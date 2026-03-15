"use client";

import { motion } from "framer-motion";
import { Sparkles, Clock, ArrowRight } from "lucide-react";
import { usePricingStore } from "@/stores/pricingStore";

interface TrialBannerProps {
  onUpgrade: () => void;
}

export function TrialBanner({ onUpgrade }: TrialBannerProps) {
  const trialActive = usePricingStore((s) => s.trialActive);
  const trialDaysLeft = usePricingStore((s) => s.trialDaysLeft);
  const hasActiveDiscount = usePricingStore((s) => s.hasActiveDiscount);

  if (!trialActive) return null;

  const isUrgent = trialDaysLeft <= 3;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`mb-6 p-4 rounded-xl border-2 ${isUrgent
        ? "border-red-500/30 bg-gradient-to-r from-red-500/10 to-orange-500/10"
        : "border-brand-blue/30 bg-gradient-to-r from-brand-blue/10 to-brand-green/10"
        }`}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isUrgent ? "bg-red-500/20" : "bg-brand-blue/20"
            }`}>
            {isUrgent ? (
              <Clock className="w-5 h-5 text-red-400" />
            ) : (
              <Sparkles className="w-5 h-5 text-brand-blue" />
            )}
          </div>
          <div>
            <div className="font-bold">
              {isUrgent ? "⏰ " : "🎁 "}
              {trialDaysLeft === 0
                ? "ה-Trial מסתיים היום!"
                : trialDaysLeft === 1
                  ? "יום אחד נותר ב-Premium Trial"
                  : `${trialDaysLeft} ימים נותרו ב-Premium Trial שלך`
              }
            </div>
            <div className="text-sm text-secondary">
              {hasActiveDiscount
                ? "שדרג עכשיו עם 50% הנחה לחודשיים הראשונים"
                : "שדרג עכשיו כדי להמשיך ליהנות מכל הפיצ'רים"
              }
            </div>
          </div>
        </div>

        <button
          onClick={onUpgrade}
          className={`btn-primary whitespace-nowrap ${isUrgent ? "bg-red-500 hover:bg-red-600" : ""
            }`}
        >
          {hasActiveDiscount ? (
            <>
              <Sparkles className="w-4 h-4" />
              שדרג עם 50% הנחה
            </>
          ) : (
            <>
              שדרג עכשיו
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}
