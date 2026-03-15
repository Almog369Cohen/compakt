"use client";

import { motion } from "framer-motion";
import { Music, Sparkles, Users, Zap } from "lucide-react";

interface WelcomeScreenProps {
  onStart: () => void;
  onSkip: () => void;
}

export function WelcomeScreen({ onStart, onSkip }: WelcomeScreenProps) {
  return (
    <div className="min-h-dvh gradient-hero flex items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl"
      >
        <div className="glass-card rounded-3xl p-8 md:p-12 text-center">
          {/* Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-6"
            style={{ background: "linear-gradient(135deg, #059cc0, #03b28c)" }}
          >
            <Music className="w-10 h-10 text-white" />
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-3xl md:text-4xl font-bold mb-4"
          >
            ברוכים הבאים ל-Compakt! 🎵
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-lg text-secondary mb-8 leading-relaxed max-w-xl mx-auto"
          >
            אתם במרחק 4 צעדים פשוטים מלשלוח את השאלון הראשון שלכם לזוג.
            <br />
            בואו נתחיל - זה לוקח בערך <strong className="text-brand-blue">10 דקות</strong>.
          </motion.p>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="grid md:grid-cols-3 gap-4 mb-8"
          >
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand-blue/20 mb-3">
                <Zap className="w-6 h-6 text-brand-blue" />
              </div>
              <h3 className="text-sm font-semibold mb-1">התחלה מהירה</h3>
              <p className="text-xs text-secondary">תבניות מוכנות של שירים ושאלות</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand-green/20 mb-3">
                <Users className="w-6 h-6 text-brand-green" />
              </div>
              <h3 className="text-sm font-semibold mb-1">פשוט לזוגות</h3>
              <p className="text-xs text-secondary">שאלון נוח ומהנה למילוי</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-purple-500/20 mb-3">
                <Sparkles className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-sm font-semibold mb-1">תוצאות מדהימות</h3>
              <p className="text-xs text-secondary">פלייליסט מושלם לכל אירוע</p>
            </div>
          </motion.div>

          {/* Steps Preview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 mb-8 text-right"
          >
            <h3 className="text-sm font-semibold mb-4 text-center">4 הצעדים שלנו:</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-blue/20 text-brand-blue flex items-center justify-center text-sm font-bold">
                  1
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">פרופיל בסיסי</p>
                  <p className="text-xs text-secondary">שם, קישור ודרך יצירת קשר</p>
                </div>
                <span className="text-xs text-muted">2 דק׳</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-blue/20 text-brand-blue flex items-center justify-center text-sm font-bold">
                  2
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">שירים מהירים</p>
                  <p className="text-xs text-secondary">50 שירים פופולריים מוכנים</p>
                </div>
                <span className="text-xs text-muted">3 דק׳</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-blue/20 text-brand-blue flex items-center justify-center text-sm font-bold">
                  3
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">שאלות בסיסיות</p>
                  <p className="text-xs text-secondary">8 שאלות שזוגות אוהבים</p>
                </div>
                <span className="text-xs text-muted">2 דק׳</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-blue/20 text-brand-blue flex items-center justify-center text-sm font-bold">
                  4
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">קישור לזוגות</p>
                  <p className="text-xs text-secondary">טקסט מוכן לשליחה</p>
                </div>
                <span className="text-xs text-muted">1 דק׳</span>
              </div>
            </div>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex flex-col sm:flex-row gap-3 justify-center"
          >
            <button
              onClick={onStart}
              className="btn-primary text-lg px-8 py-4 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              בואו נתחיל את המסע 🚀
            </button>
            <button
              onClick={onSkip}
              className="text-sm text-secondary hover:text-foreground transition-colors"
            >
              אעשה זאת אחר כך
            </button>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
