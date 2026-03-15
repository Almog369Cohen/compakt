"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, ArrowLeft, HelpCircle, Sparkles, Check } from "lucide-react";
import { useOnboardingStore } from "@/stores/onboardingStore";
import { useAdminStore } from "@/stores/adminStore";
import { QUICK_START_QUESTIONS, QUICK_START_QUESTIONS_COUNT } from "@/data/onboarding-questions";

interface OnboardingStepQuestionsProps {
  onComplete: () => void;
  onBack: () => void;
  onSkip: () => void;
}

export function OnboardingStepQuestions({ onComplete, onBack, onSkip }: OnboardingStepQuestionsProps) {
  const useQuickStart = useOnboardingStore((s) => s.useQuickStartQuestions);
  const setUseQuickStart = useOnboardingStore((s) => s.setUseQuickStartQuestions);
  const addQuestion = useAdminStore((s) => s.addQuestion);
  const [loading, setLoading] = useState(false);

  const handleQuickStart = () => {
    setUseQuickStart(true);
    // Quick start questions will be added in the background after onboarding
    onComplete();
  };

  const handleManual = () => {
    setUseQuickStart(false);
    onComplete();
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

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-3xl p-8 md:p-10"
        >
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-brand-blue/20 flex items-center justify-center">
              <HelpCircle className="w-6 h-6 text-brand-blue" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">שאלות בסיסיות</h2>
              <p className="text-sm text-secondary">שאלות שזוגות אוהבים לענות עליהן</p>
            </div>
          </div>

          {/* Options */}
          <div className="space-y-4 mb-6">
            {/* Quick Start Option */}
            <button
              onClick={handleQuickStart}
              disabled={loading}
              className="w-full text-right rounded-2xl border-2 border-brand-blue/30 bg-brand-blue/10 hover:bg-brand-blue/20 p-6 transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-brand-blue/30 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-6 h-6 text-brand-blue" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold">Quick Start (מומלץ)</h3>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-green/20 text-brand-green text-xs font-medium">
                      <Check className="w-3 h-3" />
                      מומלץ
                    </span>
                  </div>
                  <p className="text-sm text-secondary mb-3">
                    התחל עם {QUICK_START_QUESTIONS_COUNT} שאלות מנוסות ואהובות
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs px-2 py-1 rounded-full bg-white/10">סגנון מוזיקה</span>
                    <span className="text-xs px-2 py-1 rounded-full bg-white/10">שירים מיוחדים</span>
                    <span className="text-xs px-2 py-1 rounded-full bg-white/10">אנרגיה באירוע</span>
                    <span className="text-xs px-2 py-1 rounded-full bg-white/10">+עוד</span>
                  </div>
                </div>
              </div>
            </button>

            {/* Manual Option */}
            <button
              onClick={handleManual}
              className="w-full text-right rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] p-6 transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                  <HelpCircle className="w-6 h-6 text-white/70" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2">אבנה שאלון בעצמי</h3>
                  <p className="text-sm text-secondary">
                    אתחיל עם שאלון ריק ואוסיף שאלות מותאמות אישית
                  </p>
                </div>
              </div>
            </button>
          </div>

          {/* Preview */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 mb-6">
            <p className="text-xs text-secondary mb-3">דוגמה לשאלות בשאלון המוכן:</p>
            <div className="space-y-3">
              {QUICK_START_QUESTIONS.slice(0, 3).map((q, i) => (
                <div key={i} className="text-sm">
                  <div className="flex items-start gap-2 mb-1">
                    <span className="text-brand-blue font-medium">{i + 1}.</span>
                    <span className="flex-1">{q.text}</span>
                  </div>
                  {q.options && (
                    <div className="mr-5 flex flex-wrap gap-1">
                      {q.options.slice(0, 3).map((opt, j) => (
                        <span key={j} className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-secondary">
                          {opt}
                        </span>
                      ))}
                      {q.options.length > 3 && (
                        <span className="text-xs text-secondary">+{q.options.length - 3}</span>
                      )}
                    </div>
                  )}
                </div>
              ))}
              <p className="text-xs text-secondary text-center pt-2">
                +{QUICK_START_QUESTIONS_COUNT - 3} שאלות נוספות
              </p>
            </div>
          </div>

          <p className="text-xs text-center text-secondary mb-6">
            💡 הזוגות אוהבים שאלות אישיות - אפשר תמיד להוסיף ולערוך
          </p>

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
              onClick={onSkip}
              className="text-sm text-secondary hover:text-foreground transition-colors"
            >
              דלג לעכשיו
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
