"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Sparkles, ArrowLeft } from "lucide-react";
import confetti from "canvas-confetti";

interface SuccessCelebrationProps {
  onComplete: () => void;
}

export function SuccessCelebration({ onComplete }: SuccessCelebrationProps) {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Trigger confetti
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function () {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        clearInterval(interval);
        return;
      }

      const particleCount = 50 * (timeLeft / duration);

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      });
    }, 250);

    // Show content after a brief delay
    setTimeout(() => setShowContent(true), 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-dvh gradient-hero flex items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg"
      >
        <div className="glass-card rounded-3xl p-8 md:p-12 text-center">
          {/* Success Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-green-600 mb-6 relative"
          >
            <CheckCircle2 className="w-12 h-12 text-white" />
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1.5, opacity: 0 }}
              transition={{
                delay: 0.3,
                duration: 1,
                repeat: Infinity,
                repeatDelay: 0.5,
              }}
              className="absolute inset-0 rounded-full bg-green-400"
            />
          </motion.div>

          {showContent && (
            <>
              {/* Title */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-3xl md:text-4xl font-bold mb-4"
              >
                מזל טוב! 🎉
              </motion.h1>

              {/* Message */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-lg text-secondary mb-6 leading-relaxed"
              >
                סיימתם את ההגדרה הראשונית!
                <br />
                עכשיו אתם מוכנים לשלוח את השאלון הראשון שלכם לזוג.
              </motion.p>

              {/* Next Steps */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 mb-8 text-right"
              >
                <div className="flex items-start gap-3 mb-4">
                  <Sparkles className="w-5 h-5 text-brand-blue flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-semibold mb-1">מה הלאה?</h3>
                    <p className="text-xs text-secondary leading-relaxed">
                      בדשבורד תמצאו את הקישור לשאלון, מעקב אחרי זוגות, וכל הכלים שצריך לנהל את האירועים שלכם.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-brand-green flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-semibold mb-1">טיפ מקצועי</h3>
                    <p className="text-xs text-secondary leading-relaxed">
                      אפשר תמיד לערוך ולהוסיף שירים ושאלות. המערכת שלכם תמשיך להשתפר עם הזמן.
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* CTA */}
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                onClick={onComplete}
                className="btn-primary text-lg px-8 py-4 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all inline-flex items-center gap-2"
              >
                קח אותי לדשבורד
                <ArrowLeft className="w-5 h-5" />
              </motion.button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
