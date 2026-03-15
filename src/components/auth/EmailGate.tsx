"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, ArrowLeft, Loader2, CheckCircle, KeyRound } from "lucide-react";

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
  const [otp, setOtp] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [resolvedEventKey, setResolvedEventKey] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendOtp = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    const lookupKey = (eventId || eventNumber).trim();

    if (!lookupKey) {
      setError("צריך מספר אירוע כדי להמשיך");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError("נראה שחסרה כתובת מייל תקינה");
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
        setError(sendData.error || "לא הצלחנו למצוא את האירוע — בדקו את המספר");
        return;
      }

      setSessionId(sendData.sessionId);
      setResolvedEventKey(sendData.eventKey || lookupKey);
      setOtpSent(true);

      if (sendData.devOtp) {
        setOtp(sendData.devOtp);
      }
    } catch {
      setError("משהו לא הסתדר, נסו שוב");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const normalizedEmail = email.trim().toLowerCase();

    if (!sessionId) {
      setError("נראה שפג התוקף — שלחו קוד חדש");
      return;
    }

    if (!otp.trim()) {
      setError("הזינו את הקוד שקיבלתם במייל");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const verifyRes = await fetch("/api/auth/email/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          otp: otp.trim(),
          email: normalizedEmail,
        }),
      });
      const verifyData = await verifyRes.json();

      if (!verifyRes.ok) {
        setError(verifyData.error || "הקוד לא תקין, נסו שוב");
        return;
      }

      setStep("verified");
      setTimeout(() => {
        onVerified({
          sessionId: verifyData.sessionId,
          email: normalizedEmail,
          eventKey: verifyData.eventKey || resolvedEventKey,
          resumeData: verifyData.resumeData,
        });
      }, 800);
    } catch {
      setError("משהו לא הסתדר, נסו שוב בעוד רגע");
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
                <h2 className="text-xl font-bold mb-1">נכנסים לאירוע</h2>
                {djName && (
                  <p className="text-sm text-secondary mb-1">
                    השאלון של <span className="font-semibold text-brand-blue">{djName}</span>
                  </p>
                )}
                <p className="text-xs text-muted">
                  מספר אירוע + מייל — ונשלח קוד כניסה כדי להמשיך מאיפה שעצרתם
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
                      onKeyDown={(e) => e.key === "Enter" && !otpSent && handleSendOtp()}
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
                    onKeyDown={(e) => e.key === "Enter" && (otpSent ? handleVerifyOtp() : handleSendOtp())}
                    placeholder="you@example.com"
                    dir="ltr"
                    className="w-full px-4 py-3 rounded-xl bg-transparent border border-glass text-center text-base focus:outline-none focus:border-brand-blue transition-colors"
                    autoFocus={Boolean(eventId)}
                  />
                </div>

                {otpSent && (
                  <div className="space-y-2">
                    <div className="relative">
                      <input
                        type="text"
                        value={otp}
                        onChange={(e) => {
                          setOtp(e.target.value.replace(/\D/g, "").slice(0, 6));
                          setError(null);
                        }}
                        onKeyDown={(e) => e.key === "Enter" && handleVerifyOtp()}
                        placeholder="קוד אימות"
                        dir="ltr"
                        className="w-full px-4 py-3 rounded-xl bg-transparent border border-glass text-center text-base tracking-[0.3em] focus:outline-none focus:border-brand-blue transition-colors"
                      />
                      <KeyRound className="w-4 h-4 text-muted absolute left-4 top-1/2 -translate-y-1/2" />
                    </div>
                    <p className="text-[11px] text-center text-muted">
                      שלחנו קוד למייל שלכם — הזינו אותו כאן ונמשיך
                    </p>
                  </div>
                )}

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
                  onClick={otpSent ? handleVerifyOtp : handleSendOtp}
                  disabled={loading}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      {otpSent ? "המשיכו" : "שלחו לי קוד"}
                      <ArrowLeft className="w-4 h-4" />
                    </>
                  )}
                </button>

                {otpSent && (
                  <button
                    onClick={handleSendOtp}
                    disabled={loading}
                    className="w-full text-xs text-secondary hover:text-brand-blue transition-colors"
                  >
                    שלחו קוד חדש
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
              <h2 className="text-xl font-bold">מעולה, אפשר להמשיך</h2>
              <p className="text-sm text-muted mt-1">עוד רגע...</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
