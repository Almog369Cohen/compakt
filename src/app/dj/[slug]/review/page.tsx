"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Star, Send, CheckCircle2, Loader2, ArrowRight } from "lucide-react";
import { useProfileStore } from "@/stores/profileStore";
import { supabase } from "@/lib/supabase";

export default function ReviewPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const loadProfileBySlug = useProfileStore((s) => s.loadProfileBySlug);
  const profile = useProfileStore((s) => s.profile);

  const [step, setStep] = useState<"auth" | "review" | "success">("auth");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [eventNumber, setEventNumber] = useState("");

  const [reviewName, setReviewName] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState(5);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (slug) {
      loadProfileBySlug(slug);
    }
  }, [slug, loadProfileBySlug]);

  const handleSendOTP = async () => {
    if (!email.trim()) {
      setError("נא להזין כתובת אימייל");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/email/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          eventNumber: eventNumber.trim() || undefined
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "שליחת קוד נכשלה");
      }

      setOtpSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה בשליחת קוד");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp.trim()) {
      setError("נא להזין את הקוד שקיבלת");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/email/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          otp: otp.trim(),
          eventNumber: eventNumber.trim() || undefined
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "אימות נכשל");
      }

      setStep("review");
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה באימות");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!reviewName.trim() || !reviewText.trim()) {
      setError("נא למלא את כל השדות");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { data: profileData, error: fetchError } = await supabase
        .from("profiles")
        .select("id, dj_slug, reviews")
        .eq("dj_slug", slug)
        .single();

      if (fetchError || !profileData) {
        throw new Error("לא נמצא פרופיל DJ");
      }

      const currentReviews = Array.isArray(profileData.reviews) ? profileData.reviews : [];
      const newReview = {
        name: reviewName.trim(),
        text: reviewText.trim(),
        rating,
        verified: true,
        email: email.trim(),
        createdAt: new Date().toISOString(),
      };

      const updatedReviews = [...currentReviews, newReview];

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ reviews: updatedReviews })
        .eq("id", profileData.id);

      if (updateError) {
        throw new Error("שמירת הביקורת נכשלה");
      }

      setStep("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה בשמירת הביקורת");
    } finally {
      setLoading(false);
    }
  };

  const businessName = profile.businessName || "DJ";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="rounded-3xl border border-white/10 bg-slate-900/80 backdrop-blur-xl shadow-2xl p-6 md:p-8">
          {step === "auth" && (
            <>
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold mb-2">כתבו ביקורת</h1>
                <p className="text-sm text-white/70">עבור {businessName}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    מספר אירוע (אופציונלי)
                  </label>
                  <input
                    type="text"
                    value={eventNumber}
                    onChange={(e) => setEventNumber(e.target.value)}
                    placeholder="מספר האירוע שלכם"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-brand-blue transition-colors"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    אימייל לאימות
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-brand-blue transition-colors"
                    dir="ltr"
                    disabled={otpSent}
                  />
                </div>

                {otpSent && (
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">
                      קוד אימות
                    </label>
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="הזינו את הקוד שקיבלתם"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-brand-blue transition-colors"
                      dir="ltr"
                    />
                  </div>
                )}

                {error && (
                  <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
                    {error}
                  </div>
                )}

                <button
                  onClick={otpSent ? handleVerifyOTP : handleSendOTP}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-brand-blue to-brand-green text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : otpSent ? (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      אמת קוד
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      שלח קוד אימות
                    </>
                  )}
                </button>

                {otpSent && (
                  <button
                    onClick={() => {
                      setOtpSent(false);
                      setOtp("");
                      setError("");
                    }}
                    className="w-full text-sm text-white/60 hover:text-white/80 transition-colors"
                  >
                    שלח קוד מחדש
                  </button>
                )}
              </div>
            </>
          )}

          {step === "review" && (
            <>
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold mb-2">הביקורת שלכם</h1>
                <p className="text-sm text-white/70">שתפו את החוויה שלכם</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    השם שלכם
                  </label>
                  <input
                    type="text"
                    value={reviewName}
                    onChange={(e) => setReviewName(e.target.value)}
                    placeholder="שם מלא או שמות הזוג"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-brand-blue transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    דירוג
                  </label>
                  <div className="flex gap-2 justify-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRating(star)}
                        className="p-1 transition-transform hover:scale-110"
                      >
                        <Star
                          className={`w-8 h-8 ${star <= rating
                              ? "text-yellow-400 fill-yellow-400"
                              : "text-white/20"
                            }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    הביקורת שלכם
                  </label>
                  <textarea
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="ספרו לנו על החוויה שלכם..."
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-brand-blue transition-colors min-h-[120px] resize-y"
                    rows={4}
                  />
                </div>

                {error && (
                  <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
                    {error}
                  </div>
                )}

                <button
                  onClick={handleSubmitReview}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-brand-blue to-brand-green text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      שלח ביקורת
                    </>
                  )}
                </button>
              </div>
            </>
          )}

          {step === "success" && (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-400" />
              </div>
              <h1 className="text-2xl font-bold mb-2">תודה רבה!</h1>
              <p className="text-white/70 mb-6">הביקורת שלכם נשמרה בהצלחה</p>
              <button
                onClick={() => router.push(`/dj/${slug}`)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium transition-colors"
              >
                <ArrowRight className="w-5 h-5" />
                חזרה לפרופיל
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
