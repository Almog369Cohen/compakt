"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, ArrowLeft, Loader2, CheckCircle, RotateCcw } from "lucide-react";

interface PhoneGateProps {
  eventId: string;
  onVerified: (data: {
    sessionId: string;
    phone: string;
    resumeData: {
      answers: Record<string, unknown>[];
      swipes: Record<string, unknown>[];
      requests: Record<string, unknown>[];
      currentStage: number;
    } | null;
  }) => void;
  djName?: string;
}

type Step = "phone" | "otp" | "verified";

export function PhoneGate({ eventId, onVerified, djName }: PhoneGateProps) {
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [sessionId, setSessionId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleSendOtp = async () => {
    if (!phone.trim() || phone.replace(/\D/g, "").length < 9) {
      setError("הזינו מספר טלפון תקין");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/phone/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, eventId }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "שגיאה בשליחת קוד");
        return;
      }

      setSessionId(data.sessionId);
      if (data.devOtp) setDevOtp(data.devOtp);
      setStep("otp");
      setCountdown(60);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch {
      setError("שגיאה בשליחת קוד");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (otpValue?: string) => {
    const code = otpValue || otp.join("");
    if (code.length !== 6) {
      setError("הזינו את 6 הספרות");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/phone/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, otp: code }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "קוד שגוי");
        setOtp(["", "", "", "", "", ""]);
        otpRefs.current[0]?.focus();
        return;
      }

      setStep("verified");
      setTimeout(() => {
        onVerified({
          sessionId: data.sessionId,
          phone,
          resumeData: data.resumeData,
        });
      }, 800);
    } catch {
      setError("שגיאה באימות");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];

    if (value.length > 1) {
      // Pasted value
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

  const handleResend = () => {
    setOtp(["", "", "", "", "", ""]);
    setError(null);
    handleSendOtp();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-sm mx-auto"
    >
      <div className="glass-card p-6 sm:p-8">
        <AnimatePresence mode="wait">
          {/* Step 1: Phone Input */}
          {step === "phone" && (
            <motion.div
              key="phone"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="text-center mb-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.1 }}
                  className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-3"
                  style={{ background: "linear-gradient(135deg, #059cc0, #03b28c)" }}
                >
                  <Phone className="w-7 h-7 text-white" />
                </motion.div>
                <h2 className="text-xl font-bold mb-1">!ברוכים הבאים</h2>
                {djName && (
                  <p className="text-sm text-secondary mb-1">
                    השאלון של <span className="font-semibold text-brand-blue">{djName}</span>
                  </p>
                )}
                <p className="text-xs text-muted">
                  הזינו מספר טלפון כדי לשמור את ההתקדמות ולחזור בכל זמן
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      setError(null);
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                    placeholder="050-1234567"
                    dir="ltr"
                    className="w-full px-4 py-3 rounded-xl bg-transparent border border-glass text-center text-lg tracking-wider focus:outline-none focus:border-brand-blue transition-colors"
                    autoFocus
                  />
                </div>

                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-center"
                    style={{ color: "var(--accent-danger)" }}
                  >
                    {error}
                  </motion.p>
                )}

                <button
                  onClick={handleSendOtp}
                  disabled={loading}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      שלחו קוד
                      <ArrowLeft className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 2: OTP Input */}
          {step === "otp" && (
            <motion.div
              key="otp"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold mb-1">הזינו את הקוד</h2>
                <p className="text-xs text-muted">
                  שלחנו קוד בן 6 ספרות ל-{" "}
                  <span className="font-mono text-brand-blue" dir="ltr">{phone}</span>
                </p>
              </div>

              {devOtp && (
                <div className="glass-card p-2 rounded-lg mb-4 text-center">
                  <p className="text-xs text-muted">🧪 Dev mode — קוד:</p>
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

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-center mb-3"
                  style={{ color: "var(--accent-danger)" }}
                >
                  {error}
                </motion.p>
              )}

              {loading && (
                <div className="flex justify-center mb-3">
                  <Loader2 className="w-5 h-5 animate-spin text-brand-blue" />
                </div>
              )}

              <div className="text-center">
                <button
                  onClick={() => { setStep("phone"); setError(null); }}
                  className="text-xs text-muted hover:text-brand-blue transition-colors ml-4"
                >
                  שינוי מספר
                </button>
                {countdown > 0 ? (
                  <span className="text-xs text-muted">
                    שליחה מחדש בעוד {countdown} שניות
                  </span>
                ) : (
                  <button
                    onClick={handleResend}
                    className="text-xs text-brand-blue hover:underline flex items-center gap-1 mx-auto"
                  >
                    <RotateCcw className="w-3 h-3" />
                    שלחו שוב
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {/* Step 3: Verified */}
          {step === "verified" && (
            <motion.div
              key="verified"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-4"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.1 }}
              >
                <CheckCircle className="w-16 h-16 text-brand-green mx-auto mb-3" />
              </motion.div>
              <h2 className="text-xl font-bold">!מאומת</h2>
              <p className="text-sm text-muted mt-1">...מתחילים</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
