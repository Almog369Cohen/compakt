"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Sparkles, ArrowLeft, Music, Calendar, Palette, TrendingUp } from "lucide-react";
import confetti from "canvas-confetti";

interface OnboardingChecklistV2Props {
  onComplete: () => void;
  isTrialUser: boolean;
}

export function OnboardingChecklistV2({ onComplete, isTrialUser }: OnboardingChecklistV2Props) {
  const [checklist] = useState([
    { id: 1, label: "שלח את הקישור לזוג הראשון", done: false },
    { id: 2, label: "התאם אישית את הפרופיל שלך", done: false },
    { id: 3, label: "הוסף עוד שירים", done: false },
    { id: 4, label: "חבר את Google Calendar", done: false },
    { id: 5, label: "ייבא פלייליסטים מ-Spotify", done: false },
  ]);

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
        return clearInterval(interval);
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

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-dvh gradient-hero flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-3xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center mb-8"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="w-20 h-20 rounded-full bg-brand-green/20 flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle2 className="w-10 h-10 text-brand-green" />
          </motion.div>

          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            🎊 מזל טוב! הפרופיל שלך מוכן
          </h1>

          <p className="text-xl text-secondary mb-2">
            סיימת את ההקמה הראשונית בהצלחה
          </p>

          {isTrialUser && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-blue/10 border border-brand-blue/20 mt-4"
            >
              <Sparkles className="w-4 h-4 text-brand-blue" />
              <span className="text-sm font-medium text-brand-blue">
                ה-Premium Trial שלך פעיל ל-30 יום
              </span>
            </motion.div>
          )}
        </motion.div>

        {/* What's Next */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-8 mb-6"
        >
          <h2 className="text-2xl font-bold mb-6">מה הלאה?</h2>

          <div className="space-y-4">
            {checklist.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className="flex items-center gap-3 p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                <div className="w-6 h-6 rounded-full border-2 border-white/20 flex items-center justify-center flex-shrink-0">
                  {item.done && <CheckCircle2 className="w-5 h-5 text-brand-green" />}
                </div>
                <span className={item.done ? "line-through text-secondary" : ""}>
                  {item.label}
                </span>
              </motion.div>
            ))}
          </div>

          <div className="mt-6 p-4 rounded-lg bg-brand-blue/10 border border-brand-blue/20">
            <div className="flex items-start gap-3">
              <div className="text-2xl">💡</div>
              <div>
                <div className="font-medium mb-1">טיפ מקצועי</div>
                <div className="text-sm text-secondary">
                  רוב ה-DJs מקבלים תגובה ראשונה מזוג תוך 24 שעות מרגע השליחה.
                  שלח את הקישור מיד אחרי שמאשרים את האירוע!
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Premium Features Reminder */}
        {isTrialUser && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="glass-card p-6 mb-6"
          >
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-blue" />
              תכונות Premium שכדאי לנסות
            </h3>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Music className="w-5 h-5 text-brand-blue mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium text-sm">Spotify Import</div>
                  <div className="text-sm text-secondary">ייבא פלייליסטים בלחיצה</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-brand-green mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium text-sm">Google Calendar</div>
                  <div className="text-xs text-secondary">סנכרון אוטומטי</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Palette className="w-5 h-5 text-brand-blue mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium text-sm">Custom Branding</div>
                  <div className="text-xs text-secondary">הסר watermark</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <TrendingUp className="w-5 h-5 text-brand-green mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium text-sm">Analytics</div>
                  <div className="text-xs text-secondary">תובנות מתקדמות</div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-center"
        >
          <button
            onClick={onComplete}
            className="btn-primary text-lg px-8 py-4"
          >
            קח אותי לדשבורד
            <ArrowLeft className="w-5 h-5" />
          </button>

          {isTrialUser && (
            <p className="text-xs text-muted mt-4">
              💎 זכור: יש לך 30 יום לנסות את כל הפיצ&apos;רים של Premium
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
}
