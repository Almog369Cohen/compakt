"use client";

import Link from "next/link";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { ProductScreenshot } from "@/components/marketing/ProductScreenshot";
import { ProfileDemo } from "@/components/marketing/demos/ProfileDemo";
import { MusicSwipeDemo } from "@/components/marketing/demos/MusicSwipeDemo";
import { BriefDemo } from "@/components/marketing/demos/BriefDemo";
import { DashboardDemo } from "@/components/marketing/demos/DashboardDemo";
import { motion } from "framer-motion";
import { Send, Music2, FileCheck, Sparkles, ArrowLeft } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Send,
    title: "יצירת פרופיל והשליחה לזוג",
    description: "צרו פרופיל DJ מרשים עם תמונות, וידאו, וקישורים לרשתות חברתיות. קבלו לינק ייחודי לשיתוף עם הזוג.",
    details: [
      "פרופיל מותאם אישית עם הצבעים שלכם",
      "גלריית תמונות ווידאו",
      "קישורים לספוטיפיי, סאונדקלאוד ורשתות חברתיות",
      "לינק קצר ונוח לשיתוף",
    ],
  },
  {
    number: "02",
    icon: Music2,
    title: "הזוג בוחר מוזיקה בצורה כיפית",
    description: "בחירת שירים בסוויפ - הזוג מחליק ימינה/שמאלה על שירים ובוחר מה הם אוהבים, מה חובה, ומה לא בשבילם.",
    details: [
      "ממשק אינטואיטיבי וכיפי",
      "האזנה לשירים ישירות מהאפליקציה",
      "סימון שירי חובה ושירים לא רצויים",
      "שאלון מותאם אישית על האירוע",
    ],
  },
  {
    number: "03",
    icon: FileCheck,
    title: "קבלת brief מסודר ומוכן",
    description: "כל המידע שהזוג מילא מגיע אליכם במקום אחד - העדפות מוזיקליות, שירי חובה, בקשות מיוחדות, ופרטי האירוע.",
    details: [
      "רשימת שירים מסודרת לפי קטגוריות",
      "שירי חובה מסומנים בבירור",
      "תשובות לשאלון האירוע",
      "בקשות והערות מיוחדות",
    ],
  },
  {
    number: "04",
    icon: Sparkles,
    title: "ניהול מקצועי של כל האירועים",
    description: "עקבו אחר כל האירועים שלכם, ראו מי מילא את השאלון, וקבלו תזכורות לאירועים קרובים.",
    details: [
      "לוח שנה עם כל האירועים",
      "סטטוס התקדמות לכל אירוע",
      "אנליטיקס על העדפות מוזיקליות",
      "ניהול מרכזי של כל הזוגות",
    ],
  },
];

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-white">
      <MarketingNav />

      <main className="pt-32 pb-24 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-block px-4 py-2 rounded-full bg-gradient-to-r from-blue-50 to-green-50 border border-[#e5e7eb] mb-6"
            >
              <span className="text-sm font-medium bg-gradient-to-r from-[#059cc0] to-[#03b28c] bg-clip-text text-transparent">
                איך זה עובד
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl md:text-6xl font-bold text-[#1f1f21] mb-6"
            >
              מהשליחה ועד הבריף המוכן
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-[#4b5563] max-w-2xl mx-auto"
            >
              4 שלבים פשוטים שהופכים את הכנת האירוע לקלה ומקצועית
            </motion.p>
          </div>

          {/* Steps with real demos */}
          <div className="space-y-32">
            {/* Step 1: Profile */}
            <ProductScreenshot
              title={steps[0].title}
              description={steps[0].description}
            >
              <ProfileDemo />
            </ProductScreenshot>

            {/* Step 2: Music Swipe */}
            <ProductScreenshot
              title={steps[1].title}
              description={steps[1].description}
              reverse
            >
              <MusicSwipeDemo />
            </ProductScreenshot>

            {/* Step 3: Brief */}
            <ProductScreenshot
              title={steps[2].title}
              description={steps[2].description}
            >
              <BriefDemo />
            </ProductScreenshot>

            {/* Step 4: Dashboard */}
            <ProductScreenshot
              title={steps[3].title}
              description={steps[3].description}
              reverse
            >
              <DashboardDemo />
            </ProductScreenshot>
          </div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-24 text-center"
          >
            <div className="p-12 rounded-3xl bg-gradient-to-br from-[#059cc0] to-[#03b28c] text-white">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                מוכנים לנסות?
              </h2>
              <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                נסו את זה עם הזוג הראשון שלכם - בחינם, ללא כרטיס אשראי
              </p>
              <Link
                href="/admin"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white text-[#059cc0] font-semibold text-lg hover:shadow-2xl hover:-translate-y-1 transition-all"
              >
                פתחו חשבון DJ
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </div>
          </motion.div>
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}
