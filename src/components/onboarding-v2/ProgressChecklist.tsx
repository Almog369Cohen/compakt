"use client";

import { motion } from "framer-motion";
import { Check, Circle, ArrowRight, Sparkles } from "lucide-react";
import { useOnboardingStoreV2 } from "@/stores/onboardingStore";

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  action?: () => void;
  actionLabel?: string;
}

interface ProgressChecklistProps {
  onDismiss?: () => void;
}

export function ProgressChecklist({ onDismiss }: ProgressChecklistProps) {
  const onboardingComplete = useOnboardingStoreV2((s) => s.onboardingComplete);
  const completedSteps = useOnboardingStoreV2((s) => s.completedSteps);

  // Mock data - in real app, this would come from actual user data
  const items: ChecklistItem[] = [
    {
      id: "profile",
      title: "השלם את הפרופיל שלך",
      description: "הוסף תמונה, ביו ופרטי קשר",
      completed: completedSteps.includes(1),
      actionLabel: "עבור לפרופיל",
    },
    {
      id: "event",
      title: "צור את האירוע הראשון",
      description: "התחל לנהל את האירוע הבא שלך",
      completed: completedSteps.includes(2),
      actionLabel: "צור אירוע",
    },
    {
      id: "songs",
      title: "הוסף שירים לרשימה",
      description: "בנה את רשימת השירים שלך",
      completed: completedSteps.includes(3),
      actionLabel: "הוסף שירים",
    },
    {
      id: "questions",
      title: "התאם את השאלון",
      description: "ערוך את השאלות לזוגות",
      completed: completedSteps.includes(4),
      actionLabel: "ערוך שאלון",
    },
    {
      id: "link",
      title: "שתף את הקישור",
      description: "שלח לזוג הראשון שלך",
      completed: completedSteps.includes(5),
      actionLabel: "העתק קישור",
    },
  ];

  const completedCount = items.filter((item) => item.completed).length;
  const progress = (completedCount / items.length) * 100;

  if (onboardingComplete && completedCount === items.length) {
    return null; // Don't show if everything is done
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6 mb-6"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-brand-blue/10 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-brand-blue" />
          </div>
          <div>
            <h3 className="font-bold text-lg">התחל בצעדים הראשונים</h3>
            <p className="text-sm text-secondary">
              {completedCount} מתוך {items.length} הושלמו
            </p>
          </div>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-muted hover:text-foreground transition-colors text-sm"
          >
            ✕
          </button>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-brand-blue to-brand-green"
          />
        </div>
        <div className="flex items-center justify-between mt-2 text-xs text-muted">
          <span>{Math.round(progress)}% הושלם</span>
          {completedCount < items.length && (
            <span>עוד {items.length - completedCount} צעדים</span>
          )}
        </div>
      </div>

      {/* Checklist Items */}
      <div className="space-y-3">
        {items.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`flex items-center gap-3 p-3 rounded-lg transition-all ${item.completed
                ? "bg-brand-green/5 border border-brand-green/20"
                : "bg-white/5 border border-white/10 hover:border-brand-blue/30"
              }`}
          >
            {/* Checkbox */}
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${item.completed
                  ? "bg-brand-green text-white"
                  : "border-2 border-white/20"
                }`}
            >
              {item.completed ? (
                <Check className="w-4 h-4" />
              ) : (
                <Circle className="w-3 h-3 text-white/20" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className={`font-medium ${item.completed ? "line-through text-muted" : ""}`}>
                {item.title}
              </div>
              <div className="text-xs text-secondary">{item.description}</div>
            </div>

            {/* Action Button */}
            {!item.completed && item.actionLabel && (
              <button
                onClick={item.action}
                className="text-sm text-brand-blue hover:text-brand-green transition-colors flex items-center gap-1 flex-shrink-0"
              >
                {item.actionLabel}
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </motion.div>
        ))}
      </div>

      {/* Encouragement */}
      {completedCount > 0 && completedCount < items.length && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 p-3 rounded-lg bg-brand-blue/5 border border-brand-blue/10"
        >
          <p className="text-sm text-secondary text-center">
            🎉 כל הכבוד! המשך כך והשלם את כל הצעדים
          </p>
        </motion.div>
      )}

      {/* Completion Celebration */}
      {completedCount === items.length && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mt-4 p-4 rounded-lg bg-gradient-to-r from-brand-blue/10 to-brand-green/10 border border-brand-green/20"
        >
          <div className="text-center">
            <div className="text-3xl mb-2">🎊</div>
            <p className="font-bold mb-1">מעולה! השלמת את כל הצעדים</p>
            <p className="text-sm text-secondary">
              אתה מוכן להתחיל לנהל אירועים בצורה מקצועית!
            </p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
