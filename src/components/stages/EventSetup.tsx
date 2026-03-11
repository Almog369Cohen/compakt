"use client";

import { useEffect, useState } from "react";
import { useEventStore } from "@/stores/eventStore";
import { motion, AnimatePresence } from "framer-motion";
import { Music, PartyPopper, Briefcase, Star, Heart, Copy, Check, Share2, Mail, Loader2 } from "lucide-react";
import type { EventType } from "@/lib/types";
import { getSafeOrigin } from "@/lib/utils";

const eventTypes: { type: EventType; label: string; icon: React.ReactNode }[] = [
  { type: "wedding", label: "חתונה", icon: <Heart className="w-6 h-6" /> },
  { type: "bar_mitzvah", label: "בר/בת מצווה", icon: <Star className="w-6 h-6" /> },
  { type: "private", label: "אירוע פרטי", icon: <PartyPopper className="w-6 h-6" /> },
  { type: "corporate", label: "אירוע עסקי", icon: <Briefcase className="w-6 h-6" /> },
  { type: "other", label: "אחר", icon: <Music className="w-6 h-6" /> },
];

type SetupStep = "form" | "link";

type EventSetupProps = {
  initialDjSlug?: string | null;
  initialDjName?: string | null;
};

export function EventSetup({ initialDjSlug = null, initialDjName = null }: EventSetupProps) {
  const event = useEventStore((s) => s.event);
  const updateEvent = useEventStore((s) => s.updateEvent);
  const setStage = useEventStore((s) => s.setStage);
  const trackEvent = useEventStore((s) => s.trackEvent);

  const [step, setStep] = useState<SetupStep>("form");
  const [selectedType, setSelectedType] = useState<EventType>(event?.eventType || "wedding");
  const [coupleNameA, setCoupleNameA] = useState(event?.coupleNameA || "");
  const [coupleNameB, setCoupleNameB] = useState(event?.coupleNameB || "");
  const [eventDate, setEventDate] = useState(event?.eventDate || "");
  const [venue, setVenue] = useState(event?.venue || "");
  const [email, setEmail] = useState(event?.contactEmail || "");
  const [phone, setPhone] = useState(event?.contactPhone || "");
  const [copied, setCopied] = useState(false);
  const [magicToken, setMagicToken] = useState(event?.magicToken || "");
  const [eventNumber, setEventNumber] = useState(event?.eventNumber || "");
  const [nameHint, setNameHint] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [djName, setDjName] = useState("");
  const [selectedDjId, setSelectedDjId] = useState("");
  const [selectedDjSlug, setSelectedDjSlug] = useState("");
  const [djContextReady, setDjContextReady] = useState(false);
  const [availableDjs, setAvailableDjs] = useState<Array<{ id: string; business_name: string; dj_slug: string }>>([]);

  useEffect(() => {
    const storedDjName = sessionStorage.getItem("compakt_dj_name") || "";
    const storedDjId = sessionStorage.getItem("compakt_dj_profile_id") || "";
    const storedDjSlug = sessionStorage.getItem("compakt_dj_slug") || "";
    const preferredDjSlug = initialDjSlug?.trim() || storedDjSlug;
    const preferredDjName = initialDjName?.trim() || storedDjName;

    setDjContextReady(false);

    const initDjContext = async () => {
      const loadAvailableDjs = async () => {
        const response = await fetch("/api/public/djs", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
          setAvailableDjs([]);
          return;
        }

        const result = await response.json();
        const data = result.data;

        if (!Array.isArray(data)) {
          setAvailableDjs([]);
          return;
        }

        setAvailableDjs(
          data
            .filter(
              (row) =>
                typeof row.id === "string" &&
                typeof row.business_name === "string" &&
                row.business_name.trim().length > 0 &&
                typeof row.dj_slug === "string" &&
                row.dj_slug.trim().length > 0
            )
            .map((row) => ({
              id: row.id,
              business_name: row.business_name,
              dj_slug: row.dj_slug,
            }))
        );
      };

      const clearStoredDj = async () => {
        sessionStorage.removeItem("compakt_dj_profile_id");
        sessionStorage.removeItem("compakt_dj_slug");
        sessionStorage.removeItem("compakt_dj_name");
        setSelectedDjId("");
        setSelectedDjSlug("");
        setDjName("");
        await loadAvailableDjs();
        setDjContextReady(true);
      };

      if (preferredDjSlug) {
        const response = await fetch(`/api/public/djs?slug=${encodeURIComponent(preferredDjSlug)}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        const result = response.ok ? await response.json() : { data: null };
        const data = result.data as { id: string; business_name: string | null; dj_slug: string | null } | null;

        if (!data?.id) {
          await clearStoredDj();
          return;
        }

        sessionStorage.setItem("compakt_dj_profile_id", data.id);
        sessionStorage.setItem("compakt_dj_slug", data.dj_slug || preferredDjSlug);
        if (data.business_name) {
          sessionStorage.setItem("compakt_dj_name", data.business_name);
        }

        setSelectedDjId(data.id);
        setSelectedDjSlug(data.dj_slug || preferredDjSlug);
        setDjName(data.business_name || preferredDjName);
        setDjContextReady(true);
        return;
      }

      if (storedDjId) {
        const response = await fetch(`/api/public/djs?id=${encodeURIComponent(storedDjId)}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        const result = response.ok ? await response.json() : { data: null };
        const data = result.data as { id: string; business_name: string | null; dj_slug: string | null } | null;

        if (!data?.id) {
          await clearStoredDj();
          return;
        }

        setSelectedDjId(data.id);
        setSelectedDjSlug(data.dj_slug || "");
        setDjName(data.business_name || preferredDjName);

        if (data.dj_slug) {
          sessionStorage.setItem("compakt_dj_slug", data.dj_slug);
        }
        if (data.business_name) {
          sessionStorage.setItem("compakt_dj_name", data.business_name);
        }
        setDjContextReady(true);
        return;
      }

      await loadAvailableDjs();
      setDjContextReady(true);
    };

    initDjContext().catch(() => {
      setSelectedDjId("");
      setSelectedDjSlug("");
      setDjName("");
      setDjContextReady(true);
    });
  }, [initialDjName, initialDjSlug]);

  const buildLink = () => {
    const djSlug = selectedDjSlug || sessionStorage.getItem("compakt_dj_slug");
    return djSlug
      ? `${getSafeOrigin()}/dj/${djSlug}?token=${magicToken}`
      : `${getSafeOrigin()}?token=${magicToken}`;
  };

  const handleStart = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = phone.trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setEmailError("הזינו כתובת מייל תקינה");
      return;
    }
    setEmailError(null);

    if (normalizedPhone.length < 9) {
      setPhoneError("הזינו מספר טלפון תקין");
      return;
    }
    setPhoneError(null);
    setFormError(null);

    if (!coupleNameA.trim() && !coupleNameB.trim()) {
      setNameHint(true);
      setTimeout(() => setNameHint(false), 1600);
      const ok = confirm("רוצים להמשיך בלי שמות? אפשר גם להוסיף אחר כך");
      if (!ok) return;
    }

    if (event) {
      updateEvent({
        eventType: selectedType,
        coupleNameA,
        coupleNameB,
        eventDate: eventDate || undefined,
        venue: venue || undefined,
        contactEmail: normalizedEmail,
        contactPhone: normalizedPhone,
      });
      sessionStorage.setItem(`compakt_session_${event.magicToken}`, normalizedEmail);
      trackEvent("event_updated", { eventType: selectedType });
      setStep("link");
      return;
    }

    if (!djContextReady) {
      setFormError("טוען את פרטי הדיג׳יי, נסו שוב בעוד רגע.");
      return;
    }

    const djProfileId = selectedDjId || undefined;
    const djSlug = selectedDjSlug || undefined;

    if (!djProfileId && !djSlug) {
      setFormError("בחרו דיג׳יי לפני יצירת האירוע.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/couple/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          djId: djProfileId,
          djSlug: djSlug || undefined,
          eventType: selectedType,
          coupleNameA: coupleNameA || undefined,
          coupleNameB: coupleNameB || undefined,
          eventDate: eventDate || undefined,
          venue: venue || undefined,
          contactEmail: normalizedEmail,
          contactPhone: normalizedPhone,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "יצירת האירוע נכשלה");
      }

      setMagicToken(data.eventKey);
      setEventNumber(data.eventNumber || "");
      sessionStorage.setItem(`compakt_session_${data.eventKey}`, normalizedEmail);

      useEventStore.setState((state) => ({
        ...state,
        event: {
          id: data.event.id,
          magicToken: data.event.magic_token,
          eventNumber: data.event.token || undefined,
          eventType: data.event.event_type,
          eventDate: data.event.event_date || undefined,
          venue: data.event.venue || undefined,
          coupleNameA: data.event.couple_name_a || undefined,
          coupleNameB: data.event.couple_name_b || undefined,
          contactEmail: normalizedEmail,
          contactPhone: data.event.phone_number || undefined,
          djId: data.event.dj_id || undefined,
          currentStage: data.event.current_stage ?? 0,
          theme: state.theme,
          createdAt: data.event.created_at,
        },
        answers: [],
        swipes: [],
        requests: [],
        upsellClicks: [],
        analytics: [],
      }));

      trackEvent("event_created", { eventType: selectedType });
      setStep("link");
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "יצירת האירוע נכשלה");
    } finally {
      setSubmitting(false);
    }
  };

  const handleContinue = () => {
    setStage(1);
    trackEvent("stage_complete", { stage: 0 });
  };

  const copyLink = () => {
    navigator.clipboard.writeText(buildLink());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareWhatsApp = () => {
    const text = `🎵 הצטרפו למסע המוזיקלי שלנו!\n${buildLink()}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md mx-auto"
    >
      <AnimatePresence mode="wait">
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
              {djName ? (
                <p className="text-xs text-brand-blue mt-2">
                  השאלון של <span className="font-semibold">{djName}</span>
                </p>
              ) : null}
            </div>

            <div className="space-y-6">
              {!selectedDjId && availableDjs.length > 0 && (
                <div>
                  <label className="block text-xs text-muted mb-1">בחירת דיג׳יי</label>
                  <select
                    value={selectedDjId}
                    onChange={(e) => {
                      const nextId = e.target.value;
                      const nextDj = availableDjs.find((row) => row.id === nextId);

                      setSelectedDjId(nextId);
                      setSelectedDjSlug(nextDj?.dj_slug || "");
                      setDjName(nextDj?.business_name || "");

                      if (nextDj) {
                        sessionStorage.setItem("compakt_dj_profile_id", nextDj.id);
                        sessionStorage.setItem("compakt_dj_slug", nextDj.dj_slug);
                        sessionStorage.setItem("compakt_dj_name", nextDj.business_name);
                      }
                    }}
                    className="w-full px-3 py-2.5 rounded-xl bg-transparent border border-glass text-foreground text-sm focus:outline-none focus:border-brand-blue transition-colors"
                  >
                    <option value="">בחרו דיג׳יי לשיוך האירוע</option>
                    {availableDjs.map((dj) => (
                      <option key={dj.id} value={dj.id}>
                        {dj.business_name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted mt-1">אם הגעתם ישירות בלי לינק של דיג׳יי, בחרו למי לשייך את האירוע</p>
                </div>
              )}

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

              <div>
                <label className="block text-xs text-muted mb-1">תאריך (אופציונלי)</label>
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-transparent border border-glass text-foreground text-sm focus:outline-none focus:border-brand-blue transition-colors"
                />
              </div>

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

              <div>
                <label className="block text-xs text-muted mb-1">טלפון ליצירת קשר</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    setPhoneError(null);
                  }}
                  placeholder="050-000-0000"
                  dir="ltr"
                  className={`w-full px-3 py-2.5 rounded-xl bg-transparent border text-foreground placeholder:text-muted text-sm focus:outline-none transition-colors text-center ${phoneError ? "border-accent-danger" : "border-glass focus:border-brand-blue"
                    }`}
                />
                {phoneError && (
                  <p className="text-xs mt-1" style={{ color: "var(--accent-danger)" }}>
                    {phoneError}
                  </p>
                )}
                <p className="text-xs text-muted mt-1">הטלפון נשמר ליצירת קשר בלבד</p>
              </div>

              <div>
                <label className="block text-xs text-muted mb-1">
                  <Mail className="w-3 h-3 inline ml-1" />
                  כתובת מייל
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailError(null);
                  }}
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
                <p className="text-xs text-muted mt-1">המייל משמש לשיוך וחזרה לאירוע</p>
              </div>

              {formError && (
                <p className="text-xs text-center" style={{ color: "var(--accent-danger)" }}>
                  {formError}
                </p>
              )}

              <button
                onClick={handleStart}
                disabled={submitting || !djContextReady}
                className="btn-primary w-full text-base flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    יוצרים אירוע...
                  </>
                ) : !djContextReady ? (
                  "טוען דיג׳יי..."
                ) : (
                  "← צרו אירוע ונתחיל"
                )}
              </button>

              {submitting && (
                <p className="text-xs text-center text-muted">
                  יוצר את האירוע שלכם, אין צורך ללחוץ שוב
                </p>
              )}

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
              שמרו את מספר האירוע והלינק כדי לחזור בכל זמן
            </p>

            {eventNumber && (
              <div className="glass-card p-3 rounded-xl mb-4 text-center">
                <p className="text-xs text-muted mb-1">מספר אירוע</p>
                <p className="font-mono text-lg font-bold text-brand-blue" dir="ltr">{eventNumber}</p>
              </div>
            )}

            <div className="glass-card p-3 rounded-xl mb-4 flex items-center gap-2">
              <code className="text-xs text-brand-blue flex-1 truncate" dir="ltr">
                {typeof window !== "undefined" ? buildLink() : `...?token=${magicToken}`}
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
