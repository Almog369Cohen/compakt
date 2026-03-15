"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Music, Users, Calendar, TrendingUp, Check, ChevronDown } from "lucide-react";

interface PreOnboardingLandingProps {
  onStartTrial: () => void;
  onStartFree: () => void;
}

export function PreOnboardingLanding({ onStartTrial, onStartFree }: PreOnboardingLandingProps) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="min-h-dvh gradient-hero">
      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-blue/10 border border-brand-blue/20 mb-6"
          >
            <Sparkles className="w-4 h-4 text-brand-blue" />
            <span className="text-sm font-medium text-brand-blue">14 יום חינם של Premium</span>
          </motion.div>

          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-l from-brand-blue via-brand-green to-brand-blue bg-clip-text text-transparent">
            ברוכים הבאים ל-Compakt
          </h1>

          <p className="text-xl md:text-2xl text-secondary mb-8 max-w-3xl mx-auto">
            הפלטפורמה שמחברת בין DJ לזוגות<br />
            ומקלה על ניהול האירוע המושלם
          </p>

          {/* CTA Options - 2 Clear Choices */}
          <div className="grid sm:grid-cols-2 gap-4 max-w-3xl mx-auto mb-12">
            {/* Option 1: Premium Trial */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="glass-card p-6 border-2 border-brand-blue/30 relative overflow-hidden group cursor-pointer"
              onClick={onStartTrial}
            >
              {/* Popular Badge */}
              <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-brand-blue text-white text-xs font-bold">
                מומלץ ביותר
              </div>

              {/* Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-brand-blue/20 to-brand-green/20 opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-6 h-6 text-brand-blue" />
                  <h3 className="text-xl font-bold">Premium Trial</h3>
                </div>

                <div className="text-3xl font-bold mb-2">
                  14 יום <span className="text-brand-green">חינם</span>
                </div>

                <p className="text-sm text-secondary mb-4">
                  נסה את כל הפיצ&apos;רים המתקדמים ללא התחייבות
                </p>

                <ul className="space-y-2 mb-6 text-sm">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-brand-green" />
                    <span>ייבוא מ-Spotify</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-brand-green" />
                    <span>שאלונים מתקדמים</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-brand-green" />
                    <span>אנליטיקס מלא</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-brand-green" />
                    <span>תמיכה מועדפת</span>
                  </li>
                </ul>

                <button className="btn-primary w-full">
                  התחל עכשיו →
                </button>

                <p className="text-xs text-muted text-center mt-3">
                  💳 נדרש כרטיס אשראי • ללא חיוב ב-14 ימים
                </p>
              </div>
            </motion.div>

            {/* Option 2: Free Starter */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="glass-card p-6 border border-white/10 relative overflow-hidden group cursor-pointer"
              onClick={onStartFree}
            >
              <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-6 h-6 text-brand-green" />
                  <h3 className="text-xl font-bold">Starter</h3>
                </div>

                <div className="text-3xl font-bold mb-2">
                  <span className="text-brand-green">חינם</span> לתמיד
                </div>

                <p className="text-sm text-secondary mb-4">
                  התחל מיד עם הפיצ&apos;רים הבסיסיים
                </p>

                <ul className="space-y-2 mb-6 text-sm">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-brand-green" />
                    <span>קישור לזוגות</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-brand-green" />
                    <span>שאלונים בסיסיים</span>
                  </li>
                  <li className="flex items-center gap-2 opacity-50">
                    <span className="text-xs">❌ ייבוא Spotify</span>
                  </li>
                  <li className="flex items-center gap-2 opacity-50">
                    <span className="text-xs">❌ אנליטיקס</span>
                  </li>
                </ul>

                <button className="btn-secondary w-full">
                  התחל בחינם →
                </button>

                <p className="text-xs text-muted text-center mt-3">
                  ✅ ללא כרטיס אשראי • שדרוג בכל עת
                </p>
              </div>
            </motion.div>
          </div>

          {/* Trial Benefits */}
          <div className="flex flex-wrap gap-6 justify-center text-sm text-secondary">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-brand-green" />
              <span>14 יום חינם</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-brand-green" />
              <span>ללא חיוב בתקופת הניסיון</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-brand-green" />
              <span>הקמה ב-10 דקות</span>
            </div>
          </div>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid md:grid-cols-3 gap-6 mb-16"
        >
          <div className="glass-card p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-brand-blue/10 flex items-center justify-center mx-auto mb-4">
              <Music className="w-6 h-6 text-brand-blue" />
            </div>
            <h3 className="font-bold mb-2">ניהול שירים חכם</h3>
            <p className="text-sm text-secondary">
              ייבוא מ-Spotify, ניהול פלייליסטים, ובחירת שירים אינטראקטיבית לזוגות
            </p>
          </div>

          <div className="glass-card p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-brand-green/10 flex items-center justify-center mx-auto mb-4">
              <Users className="w-6 h-6 text-brand-green" />
            </div>
            <h3 className="font-bold mb-2">שאלונים מתקדמים</h3>
            <p className="text-sm text-secondary">
              שאלות מותאמות אישית, לוגיקה מתקדמת, וחישובי אורחים אוטומטיים
            </p>
          </div>

          <div className="glass-card p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-brand-blue/10 flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-6 h-6 text-brand-blue" />
            </div>
            <h3 className="font-bold mb-2">סנכרון יומן</h3>
            <p className="text-sm text-secondary">
              חיבור ל-Google Calendar, ניהול אירועים, ותזכורות אוטומטיות
            </p>
          </div>
        </motion.div>

        {/* What's Included Dropdown */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-6 mb-8"
        >
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full flex items-center justify-between text-right"
          >
            <span className="font-bold text-lg">מה כלול ב-14 ימי הניסיון?</span>
            <ChevronDown
              className={`w-5 h-5 transition-transform ${showDetails ? "rotate-180" : ""}`}
            />
          </button>

          {showDetails && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-6 grid md:grid-cols-2 gap-4"
            >
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-brand-green mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium">אירועים ללא הגבלה</div>
                    <div className="text-sm text-secondary">נהל כמה אירועים שתרצה בו-זמנית</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-brand-green mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium">Spotify Import</div>
                    <div className="text-sm text-secondary">ייבא פלייליסטים שלמים בלחיצה אחת</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-brand-green mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium">Google Calendar Sync</div>
                    <div className="text-sm text-secondary">סנכרון דו-כיווני עם היומן שלך</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-brand-green mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium">Custom Branding</div>
                    <div className="text-sm text-secondary">הסרת watermark והתאמה אישית מלאה</div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-brand-green mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium">Analytics מתקדם</div>
                    <div className="text-sm text-secondary">תובנות על העדפות הזוגות שלך</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-brand-green mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium">שאלות מתקדמות</div>
                    <div className="text-sm text-secondary">לוגיקה מותנית וחישובים אוטומטיים</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-brand-green mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium">העלאת תמונות</div>
                    <div className="text-sm text-secondary">גלריית תמונות מקצועית בפרופיל</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-brand-green mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium">עדיפות בתמיכה</div>
                    <div className="text-sm text-secondary">מענה מהיר ותמיכה ייעודית</div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Social Proof - Enhanced */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="space-y-6"
        >
          {/* Stats */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 text-secondary mb-4">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm">הצטרפו ל-50+ DJs שכבר משתמשים</span>
            </div>

            <div className="flex items-center justify-center gap-8 text-sm">
              <div>
                <div className="text-2xl font-bold text-brand-blue">50+</div>
                <div className="text-secondary">DJs פעילים</div>
              </div>
              <div className="w-px h-12 bg-white/10" />
              <div>
                <div className="text-2xl font-bold text-brand-green">100+</div>
                <div className="text-secondary">אירועים מנוהלים</div>
              </div>
              <div className="w-px h-12 bg-white/10" />
              <div>
                <div className="text-2xl font-bold text-brand-blue">95%</div>
                <div className="text-secondary">שביעות רצון</div>
              </div>
            </div>
          </div>

          {/* Testimonials */}
          <div className="grid md:grid-cols-3 gap-4 max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="glass-card p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="text-2xl">⭐⭐⭐⭐⭐</div>
              </div>
              <p className="text-sm text-secondary mb-3">
                &quot;Compakt חסך לי שעות של עבודה. הזוגות מקבלים חוויה מקצועית והכל מסודר במקום אחד!&quot;
              </p>
              <div className="text-xs text-muted">
                - DJ יוסי, 15 שנות ניסיון
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="glass-card p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="text-2xl">⭐⭐⭐⭐⭐</div>
              </div>
              <p className="text-sm text-secondary mb-3">
                &quot;המערכת הכי טובה שהשתמשתי בה. הזוגות אוהבים את הממשק והכל זורם חלק.&quot;
              </p>
              <div className="text-xs text-muted">
                - DJ רון, 8 שנות ניסיון
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="glass-card p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="text-2xl">⭐⭐⭐⭐⭐</div>
              </div>
              <p className="text-sm text-secondary mb-3">
                &quot;עברתי ל-Compakt לפני 3 חודשים ולא מסתכל אחורה. פשוט מושלם!&quot;
              </p>
              <div className="text-xs text-muted">
                - DJ מיכל, 5 שנות ניסיון
              </div>
            </motion.div>
          </div>

          {/* Trust Badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="flex items-center justify-center gap-6 text-xs text-muted"
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-brand-green" />
              <span>מאובטח ב-SSL</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-brand-blue" />
              <span>תמיכה בעברית</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-brand-green" />
              <span>עדכונים שוטפים</span>
            </div>
          </motion.div>
        </motion.div>

        {/* CTA Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center mt-12"
        >
          <p className="text-secondary mb-4">מוכנים להתחיל?</p>
          <button
            onClick={onStartTrial}
            className="btn-primary text-lg px-8 py-4"
          >
            <Sparkles className="w-5 h-5" />
            התחל 14 יום חינם
          </button>
          <p className="text-xs text-muted mt-4">
            ללא חיוב ב-14 הימים הראשונים • ביטול בכל עת • 30% הנחה לחודשיים ראשונים
          </p>
        </motion.div>
      </div>
    </div>
  );
}
