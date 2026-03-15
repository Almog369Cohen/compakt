"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, ArrowLeft, Copy, Check, MessageCircle, Sparkles, Calendar, TrendingUp, Palette } from "lucide-react";
import { useProfileStore } from "@/stores/profileStore";
import { usePricingStore } from "@/stores/pricingStore";
import { getSafeOrigin } from "@/lib/utils";
import { safeCopyText } from "@/lib/clipboard";

interface OnboardingStepLinkV2Props {
  onComplete: () => void;
  onBack: () => void;
  isTrialUser: boolean;
}

export function OnboardingStepLinkV2({ onComplete, onBack, isTrialUser }: OnboardingStepLinkV2Props) {
  const profile = useProfileStore((s) => s.profile);
  const trialDaysLeft = usePricingStore((s) => s.trialDaysLeft);

  const [linkCopied, setLinkCopied] = useState(false);
  const [textCopied, setTextCopied] = useState(false);

  const coupleLink = profile.djSlug
    ? `${getSafeOrigin()}/?dj=${profile.djSlug}`
    : `${getSafeOrigin()}`;

  const whatsappMessage = `היי! 🎵

אני ${profile.businessName || "ה-DJ"} שלכם לאירוע הקרוב!

כדי שאוכל להכין לכם את החוויה המושלמת, מלאו בבקשה את השאלון הקצר שלי:
${coupleLink}

זה לוקח רק כמה דקות ועוזר לי להכיר אתכם ואת הטעם המוזיקלי שלכם 🎶

מחכה לשמוע מכם!`;

  const handleCopyLink = async () => {
    const success = await safeCopyText(coupleLink);
    if (success) {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
  };

  const handleCopyText = async () => {
    const success = await safeCopyText(whatsappMessage);
    if (success) {
      setTextCopied(true);
      setTimeout(() => setTextCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-dvh flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl">
        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-secondary">שלב 4 מתוך 4</span>
            <span className="text-sm font-medium text-brand-blue">100%</span>
          </div>
          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: "75%" }}
              animate={{ width: "100%" }}
              className="h-full bg-gradient-to-r from-brand-blue to-brand-green"
            />
          </div>
        </div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-8"
        >
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-brand-green/10 flex items-center justify-center">
              <Check className="w-6 h-6 text-brand-green" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">הקישור שלך מוכן!</h2>
              <p className="text-sm text-secondary">שלח אותו לזוגות שלך</p>
            </div>
          </div>

          {/* Link Display */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">הקישור האישי שלך</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={coupleLink}
                readOnly
                className="input-field flex-1"
                dir="ltr"
              />
              <button
                onClick={handleCopyLink}
                className="btn-secondary px-4"
              >
                {linkCopied ? (
                  <Check className="w-5 h-5 text-brand-green" />
                ) : (
                  <Copy className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* WhatsApp Message */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2 flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              טקסט מוכן ל-WhatsApp
            </label>
            <textarea
              value={whatsappMessage}
              readOnly
              rows={8}
              className="input-field resize-none text-sm"
            />
            <button
              onClick={handleCopyText}
              className="btn-secondary w-full mt-2"
            >
              {textCopied ? (
                <>
                  <Check className="w-5 h-5 text-brand-green" />
                  הועתק!
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5" />
                  העתק טקסט מלא
                </>
              )}
            </button>
          </div>

          {/* Trial Summary */}
          {isTrialUser && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 rounded-xl border-2 border-brand-blue/20 bg-gradient-to-br from-brand-blue/10 to-transparent mb-6"
            >
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-brand-blue/20 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-brand-blue" />
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1">ה-Premium Trial שלך פעיל! 🎉</h3>
                  <p className="text-sm text-secondary">
                    יש לך {trialDaysLeft || 30} יום לנסות את כל הפיצ&apos;רים
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-brand-green mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium">אירועים ללא הגבלה</div>
                    <div className="text-sm text-secondary">נהל כמה אירועים שתרצה בו-זמנית</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-brand-blue mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium">Spotify Import</div>
                    <div className="text-sm text-secondary">ייבא פלייליסטים שלמים בלחיצה</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-brand-green mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium">Google Calendar Sync</div>
                    <div className="text-sm text-secondary">סנכרון דו-כיווני עם היומן</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Palette className="w-5 h-5 text-brand-blue mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium">Custom Branding</div>
                    <div className="text-sm text-secondary">הסרת watermark והתאמה אישית</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <TrendingUp className="w-5 h-5 text-brand-green mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium">Analytics מתקדם</div>
                    <div className="text-sm text-secondary">תובנות על העדפות הזוגות</div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-white/10 text-sm text-secondary">
                💡 נשלח לך תזכורת 3 ימים לפני סיום ה-trial
              </div>
            </motion.div>
          )}

          {/* Tips */}
          <div className="p-4 rounded-lg bg-white/5 mb-6">
            <div className="font-medium mb-2">💡 טיפים לשליחה:</div>
            <ul className="text-sm text-secondary space-y-1">
              <li>• שלח את הקישור מיד אחרי שמאשרים את האירוע</li>
              <li>• רוב הזוגות ממלאים תוך 24 שעות</li>
              <li>• אפשר לשלוח תזכורת אחרי 3 ימים</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button onClick={onBack} className="btn-secondary">
              <ArrowLeft className="w-5 h-5" />
              חזרה
            </button>
            <button onClick={onComplete} className="btn-primary flex-1">
              סיימתי
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
