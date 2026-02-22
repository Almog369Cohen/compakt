"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Heart, X, Star, Hand } from "lucide-react";

const STORAGE_KEY = "compakt-swipe-tutorial-seen";

export function SwipeTutorial({ onDismiss }: { onDismiss: () => void }) {
  const [step, setStep] = useState(0);

  const steps = [
    {
      icon: <Hand className="w-10 h-10 text-brand-blue" />,
      title: "גררו ימינה או שמאלה",
      subtitle: "החליקו את הכרטיס כדי לבחור",
      animation: "swipe",
    },
    {
      icon: <Heart className="w-10 h-10 text-brand-green" fill="var(--accent-secondary)" />,
      title: "→ אהבתי",
      subtitle: "גררו ימינה או לחצו על הלב",
    },
    {
      icon: <X className="w-10 h-10" style={{ color: "var(--accent-danger)" }} />,
      title: "← לא מתאים",
      subtitle: "גררו שמאלה או לחצו על ה-X",
    },
    {
      icon: <Star className="w-10 h-10" style={{ color: "var(--accent-gold)" }} fill="var(--accent-gold)" />,
      title: "↑ סופר לייק!",
      subtitle: "שיר שחובה לשמוע באירוע",
    },
  ];

  const currentStep = steps[step];
  const isLast = step === steps.length - 1;

  const handleNext = () => {
    if (isLast) {
      localStorage.setItem(STORAGE_KEY, "true");
      onDismiss();
    } else {
      setStep((s) => s + 1);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 px-6"
      onClick={handleNext}
    >
      <motion.div
        key={step}
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: -20 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="glass-card p-8 text-center max-w-xs w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <motion.div
          animate={
            currentStep.animation === "swipe"
              ? { x: [0, 40, 0, -40, 0] }
              : {}
          }
          transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
          className="flex justify-center mb-4"
        >
          {currentStep.icon}
        </motion.div>

        <h3 className="text-lg font-bold mb-1">{currentStep.title}</h3>
        <p className="text-sm text-secondary mb-6">{currentStep.subtitle}</p>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-1.5 mb-4">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all ${i === step ? "bg-brand-blue w-5" : "bg-muted"
                }`}
            />
          ))}
        </div>

        <button
          onClick={handleNext}
          className="btn-primary w-full text-sm"
        >
          {isLast ? "!יאללה" : "הבא →"}
        </button>

        <button
          onClick={() => {
            localStorage.setItem(STORAGE_KEY, "true");
            onDismiss();
          }}
          className="text-xs text-muted mt-3 block w-full"
        >
          דלג
        </button>
      </motion.div>
    </motion.div>
  );
}

export function useSwipeTutorial() {
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY);
    if (!seen) {
      setShowTutorial(true);
    }
  }, []);

  return {
    showTutorial,
    dismissTutorial: () => setShowTutorial(false),
  };
}
