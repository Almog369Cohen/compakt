"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, HelpCircle, Sparkles, Check, Lock } from "lucide-react";
import { useOnboardingStoreV2 } from "@/stores/onboardingStore";
import { QUICK_START_QUESTIONS, QUICK_START_QUESTIONS_COUNT } from "@/data/onboarding-questions";

interface OnboardingStepQuestionsV2Props {
  onComplete: () => void;
  onBack: () => void;
  onSkip: () => void;
  isTrialUser: boolean;
}

export function OnboardingStepQuestionsV2({ onComplete, onBack, onSkip, isTrialUser }: OnboardingStepQuestionsV2Props) {
  const setUseQuickStart = useOnboardingStoreV2((s) => s.setUseQuickStartQuestions);
  const markUpsellSeen = useOnboardingStoreV2((s) => s.markUpsellSeen);

  const [showAdvancedUpsell, setShowAdvancedUpsell] = useState(false);

  const handleQuickStart = () => {
    setUseQuickStart(true);
    onComplete();
  };

  const handleManual = () => {
    setUseQuickStart(false);
    onComplete();
  };

  const handleAdvancedQuestions = () => {
    markUpsellSeen("advancedQuestions");
    setShowAdvancedUpsell(true);
  };

  const handleCloseAdvancedUpsell = () => {
    setShowAdvancedUpsell(false);
  };

  return (
    <div className="min-h-dvh flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl">
        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-secondary">שלב 3 מתוך 4</span>
            <span className="text-sm font-medium text-brand-blue">75%</span>
          </div>
          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: "50%" }}
              animate={{ width: "75%" }}
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
            <div className="w-12 h-12 rounded-full bg-brand-blue/10 flex items-center justify-center">
              <HelpCircle className="w-6 h-6 text-brand-blue" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">שאלות לזוגות</h2>
              <p className="text-sm text-secondary">בחר איך תרצה להתחיל</p>
            </div>
          </div>

          {/* Options */}
          <div className="space-y-4 mb-6">
            {/* Quick Start Option */}
            <button
              onClick={handleQuickStart}
              className="w-full text-right p-6 rounded-xl border-2 border-brand-blue/20 hover:border-brand-blue/40 transition-all bg-brand-blue/5"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-brand-blue" />
                  <span className="font-bold text-lg">Quick Start - {QUICK_START_QUESTIONS_COUNT} שאלות בסיסיות</span>
                </div>
                <div className="px-3 py-1 rounded-full bg-brand-green/20 text-brand-green text-xs font-medium">
                  מומלץ
                </div>
              </div>
              <p className="text-sm text-secondary mb-3">
                התחל עם שאלות מנוסות ומוכחות שעוזרות לך להכיר את הזוגות
              </p>
              <div className="space-y-2">
                {QUICK_START_QUESTIONS.slice(0, 3).map((q, i) => (
                  <div key={i} className="text-xs px-3 py-2 rounded bg-white/5 text-right">
                    {q.text}
                  </div>
                ))}
                <div className="text-xs px-3 py-2 rounded bg-white/5 text-secondary text-center">
                  +{QUICK_START_QUESTIONS_COUNT - 3} שאלות נוספות
                </div>
              </div>
            </button>

            {/* Manual Option */}
            <button
              onClick={handleManual}
              className="w-full text-right p-6 rounded-xl border-2 border-white/10 hover:border-white/20 transition-all"
            >
              <div className="flex items-center gap-2 mb-2">
                <HelpCircle className="w-5 h-5 text-secondary" />
                <span className="font-bold text-lg">אתחיל ריק ואוסיף בעצמי</span>
              </div>
              <p className="text-sm text-secondary">
                התחל עם רשימה ריקה והוסף את השאלות שלך אחת אחת
              </p>
            </button>
          </div>

          {/* Advanced Questions Upsell */}
          <div className="p-6 rounded-xl border-2 border-brand-blue/20 bg-gradient-to-br from-brand-blue/5 to-transparent mb-6">
            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isTrialUser ? "bg-brand-blue/20" : "bg-white/5"
                }`}>
                {isTrialUser ? (
                  <Sparkles className="w-5 h-5 text-brand-blue" />
                ) : (
                  <Lock className="w-5 h-5 text-secondary" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-bold">שאלות מתקדמות</h3>
                  {isTrialUser && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-brand-blue/20 text-brand-blue">
                      כלול ב-Trial
                    </span>
                  )}
                </div>
                <p className="text-sm text-secondary mb-3">
                  תנאים לוגיים (if/then), חישובי אורחים אוטומטיים, ושאלות מותאמות לפי סוג אירוע
                </p>
                <ul className="text-xs text-secondary space-y-1 mb-3">
                  <li className="flex items-center gap-2">
                    <Check className="w-3 h-3 text-brand-green" />
                    <span>שאלות מותנות - הצג שאלה רק אם התשובה היא X</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3 h-3 text-brand-green" />
                    <span>חישוב אורחים אוטומטי - כמה אנשים מגיעים?</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3 h-3 text-brand-green" />
                    <span>שאלות מותאמות לסוג אירוע (חתונה/בר מצווה/וכו&apos;)</span>
                  </li>
                </ul>
                <button
                  onClick={handleAdvancedQuestions}
                  disabled={!isTrialUser}
                  className={`text-sm font-medium ${isTrialUser
                    ? "text-brand-blue hover:text-brand-blue/80"
                    : "text-secondary cursor-not-allowed"
                    }`}
                >
                  {isTrialUser ? "למד עוד →" : "🔒 זמין ב-Premium"}
                </button>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button onClick={onBack} className="btn-secondary">
              <ArrowLeft className="w-5 h-5" />
              חזרה
            </button>
            <button onClick={onSkip} className="btn-secondary flex-1">
              דלג
            </button>
          </div>
        </motion.div>
      </div>

      {/* Advanced Questions Upsell Modal */}
      {showAdvancedUpsell && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={handleCloseAdvancedUpsell}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-card p-8 max-w-lg w-full"
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-brand-blue/20 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-brand-blue" />
              </div>
              <h2 className="text-2xl font-bold mb-2">שאלות מתקדמות</h2>
              <p className="text-secondary">קבל תשובות מדויקות יותר מהזוגות</p>
            </div>

            <div className="space-y-4 mb-6">
              <div className="p-4 rounded-lg bg-white/5">
                <div className="font-medium mb-2">דוגמה: תנאים לוגיים</div>
                <div className="text-sm text-secondary space-y-1">
                  <div>שאלה 1: &quot;האם תרצו DJ או להקה?&quot;</div>
                  <div className="text-brand-blue">→ אם התשובה &quot;DJ&quot;:</div>
                  <div className="mr-4">שאלה 2: &quot;איזה סגנל מוזיקה אתם אוהבים?&quot;</div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-white/5">
                <div className="font-medium mb-2">דוגמה: חישוב אורחים</div>
                <div className="text-sm text-secondary space-y-1">
                  <div>&quot;כמה אורחים מוזמנים?&quot;</div>
                  <div className="text-brand-blue">→ חישוב אוטומטי:</div>
                  <div className="mr-4">מבוגרים + ילדים = סה&quot;כ אורחים</div>
                </div>
              </div>
            </div>

            {isTrialUser ? (
              <div className="space-y-3">
                <button onClick={handleCloseAdvancedUpsell} className="btn-primary w-full">
                  <Check className="w-5 h-5" />
                  מעולה, אשתמש בזה
                </button>
                <button onClick={handleCloseAdvancedUpsell} className="btn-secondary w-full">
                  סגור
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <button className="btn-primary w-full">
                  <Sparkles className="w-5 h-5" />
                  התחל Premium Trial (30 יום חינם)
                </button>
                <button onClick={handleCloseAdvancedUpsell} className="btn-secondary w-full">
                  אמשיך בלי
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
