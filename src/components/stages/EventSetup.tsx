"use client";

import { useState, useRef, useEffect } from "react";
import { useEventStore } from "@/stores/eventStore";
import { motion, AnimatePresence } from "framer-motion";
import { Music, PartyPopper, Briefcase, Star, Heart, Copy, Check, Share2, Mail, Loader2, RotateCcw, CheckCircle } from "lucide-react";
import type { EventType } from "@/lib/types";
import { getSafeOrigin } from "@/lib/utils";

const eventTypes: { type: EventType; label: string; icon: React.ReactNode }[] = [
  { type: "wedding", label: "חתונה", icon: <Heart className="w-6 h-6" /> },
  { type: "bar_mitzvah", label: "בר/בת מצווה", icon: <Star className="w-6 h-6" /> },
  { type: "private", label: "אירוע פרטי", icon: <PartyPopper className="w-6 h-6" /> },
  { type: "corporate", label: "אירוע עסקי", icon: <Briefcase className="w-6 h-6" /> },
  { type: "other", label: "אחר", icon: <Music className="w-6 h-6" /> },
];

type SetupStep = "form" | "otp" | "verified" | "link";

export function EventSetup() {
  const event = useEventStore((s) => s.event);
  const createEvent = useEventStore((s) => s.createEvent);
  const updateEvent = useEventStore((s) => s.updateEvent);
  const setStage = useEventStore((s) => s.setStage);
  const trackEvent = useEventStore((s) => s.trackEvent);

  const [step, setStep] = useState<SetupStep>(event ? "form" : "form");
  const [selectedType, setSelectedType] = useState<EventType>(event?.eventType || "wedding");
  const [coupleNameA, setCoupleNameA] = useState(event?.coupleNameA || "");
  const [coupleNameB, setCoupleNameB] = useState(event?.coupleNameB || "");
  const [eventDate, setEventDate] = useState(event?.eventDate || "");
  const [venue, setVenue] = useState(event?.venue || "");
  const [email, setEmail] = useState("");
  const [copied, setCopied] = useState(false);
  const [magicToken, setMagicToken] = useState(event?.magicToken || "");
  const [nameHint, setNameHint] = useState(false);

  // OTP state
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [sessionId, setSessionId] = useState("");
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [emailError, setEmailError] = useState<string | null>(null);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleStart = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setEmailError("הזינו כתובת מייל תקינה");
      return;
    }
    setEmailError(null);

    if (!coupleNameA.trim() && !coupleNameB.trim()) {
      setNameHint(true);
      setTimeout(() => setNameHint(false), 1600);
      const ok = confirm("רוצים להמשיך בלי שמות? אפשר גם להוסיף אחר כך");
      if (!ok) return;
    }

    if (event) {
      // Existing event — update and send OTP
      updateEvent({
        eventType: selectedType,
        coupleNameA,
        coupleNameB,
        eventDate: eventDate || undefined,
        venue: venue || undefined,
      });
      await sendOtp(event.magicToken || event.id);
    } else {
      // Create event, then send OTP using magic token
      const token = createEvent({
        eventType: selectedType,
        coupleNameA: coupleNameA || undefined,
        coupleNameB: coupleNameB || undefined,
        eventDate: eventDate || undefined,
        venue: venue || undefined,
      });
      setMagicToken(token);
      trackEvent("event_created", { eventType: selectedType });

      // Wait for DB insert to propagate, then send OTP using magic token
      await new Promise((r) => setTimeout(r, 600));
      await sendOtp(token);
    }
  };

  const sendOtp = async (eventId: string) => {
    setOtpLoading(true);
    setOtpError(null);

    try {
      const res = await fetch("/api/auth/phone/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), eventId }),
      });
      const data = await res.json();

      if (!res.ok) {
        setOtpError(data.error || "שגיאה בשליחת קוד");
        setOtpLoading(false);
        return;
      }

      setSessionId(data.sessionId);
      if (data.devOtp) setDevOtp(data.devOtp);
      setStep("otp");
      setCountdown(60);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch {
      setOtpError("שגיאה בשליחת קוד");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async (otpValue?: string) => {
    const code = otpValue || otp.join("");
    if (code.length !== 6) {
      setOtpError("הזינו את 6 הספרות");
      return;
    }

    setOtpLoading(true);
    setOtpError(null);

    try {
      const res = await fetch("/api/auth/phone/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, otp: code, email: email.trim().toLowerCase() }),
      });
      const data = await res.json();

      if (!res.ok) {
        setOtpError(data.error || "קוד שגוי");
        setOtp(["", "", "", "", "", ""]);
        otpRefs.current[0]?.focus();
        setOtpLoading(false);
        return;
      }

      // Store session for future page refreshes
      const token = magicToken || event?.magicToken;
      if (token) {
        sessionStorage.setItem(`compakt_session_${token}`, data.sessionId);
      }

      setStep("verified");
      trackEvent("email_verified", { emailDomain: email.includes("@") ? email.split("@")[1] : undefined });

      setTimeout(() => {
        setStep("link");
      }, 800);
    } catch {
      setOtpError("שגיאה באימות");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];

    if (value.length > 1) {
      const digits = value.replace(/\D/g, "").slice(0, 6).split("");
      digits.forEach((d, i) => {
        if (i + index < 6) newOtp[i + index] = d;
      });
      setOtp(newOtp);
      const nextIdx = Math.min(index + digits.length, 5);
      otpRefs.current[nextIdx]?.focus();

      if (newOtp.every((d) => d !== "")) {
        handleVerifyOtp(newOtp.join(""));
      }
      return;
    }

    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    if (newOtp.every((d) => d !== "")) {
      handleVerifyOtp(newOtp.join(""));
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleResendOtp = () => {
    setOtp(["", "", "", "", "", ""]);
    setOtpError(null);
    const currentEvent = useEventStore.getState().event;
    if (currentEvent) {
      sendOtp(currentEvent.id);
    }
  };

  const handleContinue = () => {
    setStage(1);
    trackEvent("stage_complete", { stage: 0 });
  };

  const copyLink = () => {
    const url = `${getSafeOrigin()}?token=${magicToken}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareWhatsApp = () => {
    const url = `${getSafeOrigin()}?token=${magicToken}`;
    const text = `🎵 הצטרפו למסע המוזיקלי שלנו!\n${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md mx-auto"
    >
      <AnimatePresence mode="wait">
        {/* Step 1: Event Form + Phone */}
        {step === "form" && (
          <motion.div
            key="form"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="glass-card p-6 sm:p-8"
          >
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
                className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
                style={{ background: "linear-gradient(135deg, #059cc0, #03b28c)" }}
              >
                <Music className="w-8 h-8 text-white" />
              </motion.div>
              <h1 className="text-2xl font-bold mb-2">Compakt</h1>
              <p className="text-secondary text-sm">!בואו ניצור את האירוע שלכם</p>
            </div>

            <div className="space-y-6">
              {/* Event Type */}
              <div>
                <label className="block text-sm font-medium mb-3">סוג האירוע</label>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {eventTypes.map((et) => (
                    <button
                      key={et.type}
                      onClick={() => setSelectedType(et.type)}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${selectedType === et.type
                        ? "border-brand-blue bg-brand-blue/10 text-brand-blue"
                        : "border-glass text-secondary hover:border-brand-blue/50"
                        }`}
                    >
                      {et.icon}
                      <span className="text-xs font-medium">{et.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Names */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-muted mb-1">שם ראשון</label>
                  <input
                    type="text"
                    value={coupleNameA}
                    onChange={(e) => setCoupleNameA(e.target.value)}
                    placeholder="דנה"
                    className={`w-full px-3 py-2.5 rounded-xl bg-transparent border text-foreground placeholder:text-muted text-sm focus:outline-none transition-colors ${nameHint ? "border-accent-danger" : "border-glass focus:border-brand-blue"
                      }`}
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted mb-1">שם שני</label>
                  <input
                    type="text"
                    value={coupleNameB}
                    onChange={(e) => setCoupleNameB(e.target.value)}
                    placeholder="אלון"
                    className={`w-full px-3 py-2.5 rounded-xl bg-transparent border text-foreground placeholder:text-muted text-sm focus:outline-none transition-colors ${nameHint ? "border-accent-danger" : "border-glass focus:border-brand-blue"
                      }`}
                  />
                </div>
              </div>

              {nameHint && (
                <p className="text-xs" style={{ color: "var(--accent-danger)" }}>
                  מומלץ להוסיף לפחות שם אחד (אפשר גם אחר כך)
                </p>
              )}

              {/* Date */}
              <div>
                <label className="block text-xs text-muted mb-1">תאריך (אופציונלי)</label>
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-transparent border border-glass text-foreground text-sm focus:outline-none focus:border-brand-blue transition-colors"
                />
              </div>

              {/* Venue */}
              <div>
                <label className="block text-xs text-muted mb-1">אולם / מקום (אופציונלי)</label>
                <input
                  type="text"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  placeholder="שם האולם או העיר"
                  className="w-full px-3 py-2.5 rounded-xl bg-transparent border border-glass text-foreground placeholder:text-muted text-sm focus:outline-none focus:border-brand-blue transition-colors"
                />
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-xs text-muted mb-1">
                  <Mail className="w-3 h-3 inline ml-1" />
                  כתובת מייל
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setEmailError(null); }}
                  placeholder="you@example.com"
                  dir="ltr"
                  className={`w-full px-3 py-2.5 rounded-xl bg-transparent border text-foreground placeholder:text-muted text-sm focus:outline-none transition-colors text-center ${emailError ? "border-accent-danger" : "border-glass focus:border-brand-blue"
                    }`}
                />
                {emailError && (
                  <p className="text-xs mt-1" style={{ color: "var(--accent-danger)" }}>
                    {emailError}
                  </p>
                )}
                <p className="text-xs text-muted mt-1">נשלח קוד אימות למייל כדי לשמור את ההתקדמות שלכם</p>
              </div>

              {otpError && step === "form" && (
                <p className="text-xs text-center" style={{ color: "var(--accent-danger)" }}>
                  {otpError}
                </p>
              )}

              <button
                onClick={handleStart}
                disabled={otpLoading}
                className="btn-primary w-full text-base flex items-center justify-center gap-2"
              >
                {otpLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>← שלחו קוד ונתחיל</>
                )}
              </button>

              <div className="text-center mt-4">
                <a
                  href="/admin"
                  className="text-xs text-muted hover:text-brand-blue transition-colors"
                >
                  כניסת DJ →
                </a>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 2: OTP Verification */}
        {step === "otp" && (
          <motion.div
            key="otp"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="glass-card p-6 sm:p-8"
          >
            <div className="text-center mb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.1 }}
                className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-3"
                style={{ background: "linear-gradient(135deg, #059cc0, #03b28c)" }}
              >
                <Mail className="w-7 h-7 text-white" />
              </motion.div>
              <h2 className="text-xl font-bold mb-1">הזינו את הקוד</h2>
              <p className="text-xs text-muted">
                שלחנו קוד בן 6 ספרות ל-{" "}
                <span className="font-mono text-brand-blue" dir="ltr">{email}</span>
              </p>
            </div>

            {devOtp && (
              <div className="glass-card p-2 rounded-lg mb-4 text-center">
                <p className="text-xs text-muted">Dev mode — קוד:</p>
                <p className="font-mono text-lg font-bold text-brand-blue tracking-[0.3em]">{devOtp}</p>
              </div>
            )}

            <div className="flex gap-2 justify-center mb-4" dir="ltr">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { otpRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  className="w-11 h-13 rounded-xl border border-glass bg-transparent text-center text-xl font-bold focus:outline-none focus:border-brand-blue transition-colors"
                />
              ))}
            </div>

            {otpError && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-center mb-3"
                style={{ color: "var(--accent-danger)" }}
              >
                {otpError}
              </motion.p>
            )}

            {otpLoading && (
              <div className="flex justify-center mb-3">
                <Loader2 className="w-5 h-5 animate-spin text-brand-blue" />
              </div>
            )}

            <div className="text-center space-x-4 space-x-reverse">
              <button
                onClick={() => { setStep("form"); setOtpError(null); }}
                className="text-xs text-muted hover:text-brand-blue transition-colors"
              >
                שינוי מייל
              </button>
              {countdown > 0 ? (
                <span className="text-xs text-muted">
                  שליחה מחדש בעוד {countdown} שניות
                </span>
              ) : (
                <button
                  onClick={handleResendOtp}
                  className="text-xs text-brand-blue hover:underline inline-flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  שלחו שוב
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* Step 3: Verified Animation */}
        {step === "verified" && (
          <motion.div
            key="verified"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="glass-card p-6 sm:p-8 text-center py-12"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.1 }}
            >
              <CheckCircle className="w-16 h-16 text-brand-green mx-auto mb-3" />
            </motion.div>
            <h2 className="text-xl font-bold">!מאומת</h2>
            <p className="text-sm text-muted mt-1">...מכינים את האירוע</p>
          </motion.div>
        )}

        {/* Step 4: Link + Continue */}
        {step === "link" && (
          <motion.div
            key="link"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="glass-card p-6 sm:p-8 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.1 }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
              style={{ background: "linear-gradient(135deg, #03b28c, #059cc0)" }}
            >
              <Check className="w-8 h-8 text-white" />
            </motion.div>

            <h2 className="text-xl font-bold mb-2">!האירוע נוצר</h2>
            <p className="text-secondary text-sm mb-6">
              שמרו את הלינק הזה כדי לחזור בכל זמן
            </p>

            <div className="glass-card p-3 rounded-xl mb-4 flex items-center gap-2">
              <code className="text-xs text-brand-blue flex-1 truncate" dir="ltr">
                {typeof window !== "undefined"
                  ? `${getSafeOrigin()}?token=${magicToken}`
                  : `...?token=${magicToken}`}
              </code>
              <button
                onClick={copyLink}
                className="p-2 rounded-lg hover:bg-brand-blue/10 transition-colors"
                aria-label="העתק לינק"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-brand-green" />
                ) : (
                  <Copy className="w-4 h-4 text-brand-blue" />
                )}
              </button>
            </div>

            <button
              onClick={shareWhatsApp}
              className="btn-secondary w-full mb-3 flex items-center justify-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              שתפו בוואטסאפ
            </button>

            <button
              onClick={handleContinue}
              className="btn-primary w-full text-base"
            >
              ← בואו נתחיל
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
