"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, ArrowLeft, Loader2, CheckCircle } from "lucide-react";

interface EmailGateProps {
  eventId?: string;
  onVerified: (data: {
    sessionId: string;
    email: string;
    eventKey: string;
    resumeData: {
      answers: Record<string, unknown>[];
      swipes: Record<string, unknown>[];
      requests: Record<string, unknown>[];
      currentStage: number;
    } | null;
  }) => void;
  djName?: string;
}

type Step = "email" | "verified";

export function EmailGate({ eventId, onVerified, djName }: EmailGateProps) {
  const [step, setStep] = useState<Step>("email");
  const [eventNumber, setEventNumber] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    const lookupKey = (eventId || eventNumber).trim();

    if (!lookupKey) {
      setError("הזינו מספר אירוע");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError("הזינו כתובת מייל תקינה");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const sendRes = await fetch("/api/auth/email/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail, eventId: lookupKey }),
      });
      const sendData = await sendRes.json();

      if (!sendRes.ok) {
        setError(sendData.error || "שגיאה באיתור האירוע");
        return;
      }

      const verifyRes = await fetch("/api/auth/email/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sendData.sessionId,
          otp: sendData.devOtp || "000000",
          email: normalizedEmail,
        }),
      });
      const verifyData = await verifyRes.json();

      if (!verifyRes.ok) {
        setError(verifyData.error || "שגיאה באימות האירוע");
        return;
      }

      setStep("verified");
      setTimeout(() => {
        onVerified({
          sessionId: verifyData.sessionId,
          email: normalizedEmail,
          eventKey: verifyData.eventKey || sendData.eventKey || lookupKey,
          resumeData: verifyData.resumeData,
        });
      }, 800);
    } catch {
      setError("שגיאה באימות");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-sm mx-auto"
    >
      <div className="glass-card p-6 sm:p-8">
        <AnimatePresence mode="wait">
          {step === "email" && (
            <motion.div
              key="email"
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
                  <Mail className="w-7 h-7 text-white" />
                </motion.div>
                <h2 className="text-xl font-bold mb-1">!ברוכים הבאים</h2>
                {djName && (
                  <p className="text-sm text-secondary mb-1">
                    השאלון של <span className="font-semibold text-brand-blue">{djName}</span>
                  </p>
                )}
                <p className="text-xs text-muted">
                  הזינו מספר אירוע ומייל כדי לחזור לשאלון ולהמשיך בכל זמן
                </p>
              </div>

              <div className="space-y-4">
                {!eventId && (
                  <div>
                    <input
                      type="text"
                      value={eventNumber}
                      onChange={(e) => {
                        setEventNumber(e.target.value.replace(/\D/g, "").slice(0, 8));
                        setError(null);
                      }}
                      onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                      placeholder="מספר אירוע"
                      dir="ltr"
                      className="w-full px-4 py-3 rounded-xl bg-transparent border border-glass text-center text-base focus:outline-none focus:border-brand-blue transition-colors mb-3"
                      autoFocus
                    />
                  </div>
                )}
                <div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError(null);
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                    placeholder="you@example.com"
                    dir="ltr"
                    className="w-full px-4 py-3 rounded-xl bg-transparent border border-glass text-center text-base focus:outline-none focus:border-brand-blue transition-colors"
                    autoFocus={Boolean(eventId)}
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
                  onClick={handleVerify}
                  disabled={loading}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      המשיכו לשאלון
                      <ArrowLeft className="w-4 h-4" />
                    </>
                  )}
                </button>
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
