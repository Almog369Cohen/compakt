"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, Disc3, Headphones, ShieldCheck, Sparkles } from "lucide-react";

type LandingHomeProps = {
  onStart: () => void;
  onResume: () => void;
};

const benefits = [
  {
    icon: <Sparkles className="h-5 w-5" />,
    title: "בונים את הוייב לפני האירוע",
    body: "כמה דקות קצרות שעוזרות לדייק את הכיוון המוזיקלי — בלי טפסים כבדים, בלי בלגן.",
  },
  {
    icon: <Disc3 className="h-5 w-5" />,
    title: "כל הבחירות במקום אחד",
    body: "שירי חובה, סגנון, בקשות מיוחדות ורגעים חשובים — הכול זורם מסודר ל-DJ.",
  },
  {
    icon: <ShieldCheck className="h-5 w-5" />,
    title: "חוזרים מתי שרוצים",
    body: "עם מספר אירוע ומייל אפשר לחזור בדיוק לאיפה שעצרתם.",
  },
];

const trustPoints = [
  "פתיחת אירוע תוך פחות מדקה",
  "פחות בלגן, יותר דיוק",
  "כל ההעדפות במקום אחד",
];

export function LandingHome({ onStart, onResume }: LandingHomeProps) {
  return (
    <main className="min-h-dvh gradient-hero relative overflow-hidden">
      <div className="relative mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-5 py-6 sm:px-8 lg:px-10">
        <div className="flex items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] text-secondary backdrop-blur-xl">
            <Headphones className="h-3.5 w-3.5 text-brand-blue" />
            Compakt
          </div>
          <div className="flex items-center gap-2">
            <Link href="/admin" className="rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-2 text-xs font-medium text-secondary transition-colors hover:border-white/20 hover:text-white">
              כניסת אדמין
            </Link>
          </div>
        </div>

        <div className="flex flex-1 items-center py-10 sm:py-14">
          <div className="grid w-full items-center gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:gap-14">
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              className="max-w-2xl"
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.025] px-3 py-1.5 text-[11px] font-medium text-secondary">
                <Sparkles className="h-3.5 w-3.5 text-brand-blue" />
                בריף מוזיקלי לאירועים
              </div>

              <h1 className="mt-6 max-w-[12ch] text-balance text-[38px] font-bold leading-[1.04] tracking-[-0.05em] sm:text-[56px]">
                הופכים העדפות מוזיקליות להחלטות ברורות
              </h1>

              <p className="mt-6 max-w-[34rem] text-[15px] leading-7 text-secondary sm:text-[17px] sm:leading-8">
                פותחים אירוע, בוחרים כיוון מוזיקלי, מסמנים שירי חובה, אוספים בקשות ורגעים חשובים — ונותנים לדיג׳יי תמונה מדויקת ומסודרת של הערב שאתם רוצים.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={onStart}
                  className="inline-flex items-center justify-center gap-2 rounded-[18px] bg-white px-6 py-4 text-sm font-bold text-black transition-transform hover:scale-[1.01] active:scale-[0.99]"
                >
                  נתחיל
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={onResume}
                  className="inline-flex items-center justify-center gap-2 rounded-[18px] border border-white/10 bg-white/[0.03] px-6 py-4 text-sm font-semibold text-secondary transition-colors hover:border-white/20 hover:text-white"
                >
                  יש לי מספר אירוע
                </button>
              </div>

              <div className="mt-7 flex flex-wrap gap-2.5">
                {trustPoints.map((point) => (
                  <div
                    key={point}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-2 text-xs text-secondary"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-brand-green" />
                    {point}
                  </div>
                ))}
              </div>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut", delay: 0.05 }}
              className="relative"
            >
              <div className="absolute inset-x-12 top-10 h-24 rounded-full blur-3xl" style={{ background: "rgba(5,156,192,0.10)" }} />
              <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,18,26,0.92),rgba(10,12,18,0.9))] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.24)] backdrop-blur-2xl sm:p-5">
                <div className="rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-5 sm:p-6">
                  <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] font-medium text-secondary">
                    <Sparkles className="h-3.5 w-3.5 text-brand-blue" />
                    איך זה עובד
                  </div>

                  <div className="space-y-3.5">
                    {benefits.map((item) => (
                      <div
                        key={item.title}
                        className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4.5 sm:p-5"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-brand-blue">
                            {item.icon}
                          </div>
                          <div>
                            <p className="text-[15px] font-bold">{item.title}</p>
                            <p className="mt-1.5 text-sm leading-6 text-secondary">{item.body}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.section>
          </div>
        </div>
      </div>
    </main>
  );
}
