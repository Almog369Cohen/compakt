"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, Disc3, Headphones, ShieldCheck, Sparkles, Users } from "lucide-react";

type LandingHomeProps = {
  onStart: () => void;
  onResume: () => void;
};

const benefits = [
  {
    icon: <Sparkles className="h-5 w-5" />,
    title: "זה מרגיש כמו אפליקציה אמיתית",
    body: "לא שאלון כבד. חוויה קצרה, ברורה ונעימה לזוג.",
  },
  {
    icon: <Disc3 className="h-5 w-5" />,
    title: "בונים קו מוזיקלי מדויק",
    body: "שירים, אווירה, בקשות ורגעים חשובים במקום אחד.",
  },
  {
    icon: <ShieldCheck className="h-5 w-5" />,
    title: "אפשר לחזור בכל שלב",
    body: "עם מספר אירוע ומייל אפשר להמשיך בדיוק מאיפה שעצרתם.",
  },
];

const trustPoints = [
  "פתיחה מהירה של אירוע חדש",
  "חזרה פשוטה עם מספר אירוע",
  "מתאים לזוגות ולדיג׳ייז",
];

export function LandingHome({ onStart, onResume }: LandingHomeProps) {
  return (
    <main className="min-h-dvh gradient-hero relative overflow-hidden">
      <div className="relative mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] text-secondary backdrop-blur-xl">
            <Headphones className="h-3.5 w-3.5 text-brand-blue" />
            Compakt
          </div>
          <div className="flex items-center gap-2">
            <Link href="/admin" className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-secondary transition-colors hover:text-white">
              כניסת אדמין
            </Link>
          </div>
        </div>

        <div className="flex flex-1 items-center py-8 sm:py-12">
          <div className="grid w-full items-center gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              className="max-w-2xl"
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-brand-blue/20 bg-brand-blue/10 px-3 py-1.5 text-xs text-brand-blue">
                <Users className="h-3.5 w-3.5" />
                מיועד לזוגות שמתחילים לתכנן את המוזיקה כמו שצריך
              </div>

              <h1 className="mt-5 text-balance text-[40px] font-black leading-[0.95] tracking-[-0.06em] sm:text-[58px]">
                בונים את
                <br />
                המוזיקה לאירוע
                <br />
                בלי בלגן
              </h1>

              <p className="mt-5 max-w-[34rem] text-base leading-7 text-secondary sm:text-lg">
                Compakt עוזרת לכם לפתוח אירוע, לבחור כיוון מוזיקלי, לסמן שירים חשובים,
                לאסוף בקשות, ולתת לדיג׳יי תמונה חדה של הערב שאתם רוצים.
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={onStart}
                  className="inline-flex items-center justify-center gap-2 rounded-[18px] bg-white px-5 py-4 text-sm font-bold text-black transition-transform hover:scale-[1.01] active:scale-[0.99]"
                >
                  פתחו אירוע חדש
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={onResume}
                  className="inline-flex items-center justify-center gap-2 rounded-[18px] border border-white/10 bg-white/[0.04] px-5 py-4 text-sm font-semibold text-secondary transition-colors hover:text-white"
                >
                  כבר התחלתם? חזרו עם מספר אירוע
                </button>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                {trustPoints.map((point) => (
                  <div
                    key={point}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-secondary"
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
              <div className="absolute inset-x-10 top-10 h-32 rounded-full blur-3xl" style={{ background: "rgba(5,156,192,0.18)" }} />
              <div className="relative overflow-hidden rounded-[34px] border border-white/10 bg-[linear-gradient(180deg,rgba(18,22,31,0.9),rgba(9,10,16,0.88))] p-4 shadow-[0_30px_80px_rgba(0,0,0,0.28)] backdrop-blur-2xl sm:p-5">
                <div className="rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(245,197,66,0.14),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-5">
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/15 px-3 py-1 text-[11px] text-secondary">
                    <Sparkles className="h-3.5 w-3.5 text-brand-gold" />
                    מה קורה בפנים
                  </div>

                  <div className="space-y-3">
                    {benefits.map((item, index) => (
                      <div
                        key={item.title}
                        className="rounded-[22px] border border-white/10 bg-black/15 p-4"
                        style={{ transform: `translateY(${index * 0}px)` }}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-brand-blue">
                            {item.icon}
                          </div>
                          <div>
                            <p className="text-sm font-bold">{item.title}</p>
                            <p className="mt-1 text-sm leading-6 text-secondary">{item.body}</p>
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
