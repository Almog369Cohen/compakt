"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, ArrowLeft, Link2, Copy, Check, MessageCircle } from "lucide-react";
import { useProfileStore } from "@/stores/profileStore";
import { getSafeOrigin } from "@/lib/utils";
import { safeCopyText } from "@/lib/clipboard";

interface OnboardingStepLinkProps {
  onComplete: () => void;
  onBack: () => void;
}

export function OnboardingStepLink({ onComplete, onBack }: OnboardingStepLinkProps) {
  const djSlug = useProfileStore((s) => s.profile.djSlug);
  const [copied, setCopied] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);

  const coupleLink = djSlug ? `${getSafeOrigin()}/?dj=${djSlug}` : "";
  
  const whatsappMessage = `היי! 🎵

הכנתי לכם שאלון מוזיקלי מיוחד לאירוע.
זה לוקח 5 דקות ועוזר לי להכין לכם את הפלייליסט המושלם:

${coupleLink}

מחכה לשמוע מכם! 🎶`;

  const handleCopyLink = async () => {
    const success = await safeCopyText(coupleLink);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyMessage = async () => {
    const success = await safeCopyText(whatsappMessage);
    if (success) {
      setCopiedMessage(true);
      setTimeout(() => setCopiedMessage(false), 2000);
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

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-3xl p-8 md:p-10"
        >
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-brand-blue/20 flex items-center justify-center">
              <Link2 className="w-6 h-6 text-brand-blue" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">קישור לזוגות</h2>
              <p className="text-sm text-secondary">כמעט סיימנו! הנה הקישור שלכם</p>
            </div>
          </div>

          {/* Link Display */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 mb-6">
            <p className="text-xs text-secondary mb-2">הקישור האישי שלך:</p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={coupleLink}
                readOnly
                className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm"
                dir="ltr"
              />
              <button
                onClick={handleCopyLink}
                className="px-4 py-3 rounded-xl bg-brand-blue hover:bg-brand-blue/80 transition-colors inline-flex items-center gap-2 font-medium"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? "הועתק!" : "העתק"}
              </button>
            </div>
          </div>

          {/* WhatsApp Message Template */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <MessageCircle className="w-5 h-5 text-brand-green" />
              <h3 className="text-sm font-semibold">טקסט מוכן ל-WhatsApp</h3>
            </div>
            <div className="rounded-xl bg-white/5 p-4 mb-3 text-sm leading-relaxed whitespace-pre-line">
              {whatsappMessage}
            </div>
            <button
              onClick={handleCopyMessage}
              className="w-full px-4 py-3 rounded-xl border border-white/10 hover:bg-white/5 transition-colors inline-flex items-center justify-center gap-2 font-medium"
            >
              {copiedMessage ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copiedMessage ? "הטקסט הועתק!" : "העתק טקסט מלא"}
            </button>
          </div>

          {/* Tips */}
          <div className="rounded-2xl border border-brand-blue/20 bg-brand-blue/5 p-4 mb-6">
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <span className="text-brand-blue">💡</span>
              טיפים לשליחה
            </h3>
            <ul className="text-xs text-secondary space-y-1.5">
              <li className="flex items-start gap-2">
                <span className="text-brand-blue">•</span>
                <span>שלחו את הקישור כמה שבועות לפני האירוע</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand-blue">•</span>
                <span>תזכרו לזוגות למלא אם הם לא עושים זאת תוך כמה ימים</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-brand-blue">•</span>
                <span>אפשר לעקוב אחרי ההתקדמות שלהם בדשבורד</span>
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-white/10">
            <button
              onClick={onBack}
              className="text-sm text-secondary hover:text-foreground transition-colors inline-flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              חזרה
            </button>
            <button
              onClick={onComplete}
              className="btn-primary px-8 py-3 rounded-xl font-semibold inline-flex items-center gap-2"
            >
              סיימתי! קח אותי לדשבורד
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
