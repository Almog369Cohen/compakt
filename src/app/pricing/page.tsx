"use client";

import Link from "next/link";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { motion } from "framer-motion";
import { Check, ArrowLeft, HelpCircle } from "lucide-react";

const plans = [
  {
    name: "Free",
    price: "₪0",
    period: "/חודש",
    description: "מושלם להתחלה",
    features: [
      "עד 2 אירועים בחודש",
      "פרופיל DJ בסיסי",
      "שאלון מוזיקה",
      "גלריית תמונות",
      "קישורים לרשתות חברתיות",
    ],
    cta: "התחילו בחינם",
    highlighted: false,
  },
  {
    name: "Basic",
    price: "₪55",
    period: "/חודש",
    description: "לדיג'יים צומחים",
    features: [
      "עד 7 אירועים בחודש",
      "פרופיל DJ מתקדם",
      "ניהול שירים בסיסי",
      "בריפים פשוטים",
      "אנליטיקס בסיסי",
      "תמיכה במייל",
    ],
    cta: "התחילו עכשיו",
    highlighted: true,
  },
  {
    name: "Pro",
    price: "₪99",
    period: "/חודש",
    description: "לדיג'יים מקצועיים",
    features: [
      "אירועים ללא הגבלה",
      "פרופיל DJ מתקדם",
      "ניהול שירים מלא",
      "שאלונים מותאמים אישית",
      "בריפים מסודרים",
      "אנליטיקס מתקדם",
      "תמיכה מועדפת",
      "ללא פרסומות",
    ],
    cta: "התחילו עכשיו",
    highlighted: false,
  },
];

const faqs = [
  {
    question: "האם אני צריך כרטיס אשראי כדי להתחיל?",
    answer: "לא! אפשר להתחיל עם התוכנית החינמית ללא כרטיס אשראי. תוכלו לשדרג בכל עת.",
  },
  {
    question: "מה קורה אם אני עובר את מגבלת האירועים בתוכנית החינמית?",
    answer: "תקבלו התראה כשאתם מתקרבים למגבלה. תוכלו לשדרג ל-Pro בכל עת כדי להמשיך ליצור אירועים.",
  },
  {
    question: "האם אפשר לבטל בכל עת?",
    answer: "כן! אין התחייבות. אפשר לבטל את המנוי בכל עת ולחזור לתוכנית החינמית.",
  },
  {
    question: "מה כלול בתמיכה המועדפת?",
    answer: "משתמשי Pro מקבלים מענה מהיר יותר לפניות תמיכה ועדיפות בפיתוח פיצ'רים חדשים.",
  },
];

export default function PricingPage() {
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
                מחירים פשוטים ושקופים
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl md:text-6xl font-bold text-[#1f1f21] mb-6"
            >
              בחרו את התוכנית שמתאימה לכם
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-[#4b5563] max-w-2xl mx-auto"
            >
              התחילו בחינם, שדרגו כשאתם מוכנים. ללא התחייבות.
            </motion.p>
          </div>

          {/* Pricing cards */}
          <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-8 max-w-6xl mx-auto mb-24">
            {plans.map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className={`relative p-8 rounded-2xl ${plan.highlighted
                  ? "bg-gradient-to-br from-[#059cc0] to-[#03b28c] text-white shadow-2xl scale-105"
                  : "bg-white border-2 border-[#e5e7eb] hover:border-[#059cc0]"
                  } transition-all`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-4 right-8 px-4 py-1 rounded-full bg-white text-[#059cc0] text-sm font-semibold">
                    הכי פופולרי
                  </div>
                )}

                <div className="mb-6">
                  <h3 className={`text-2xl font-bold mb-2 ${plan.highlighted ? "text-white" : "text-[#1f1f21]"}`}>
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline gap-2 mb-4">
                    <span className={`text-5xl font-bold ${plan.highlighted ? "text-white" : "text-[#1f1f21]"}`}>
                      {plan.price}
                    </span>
                    <span className={plan.highlighted ? "text-white/80" : "text-[#4b5563]"}>
                      {plan.period}
                    </span>
                  </div>
                  <p className={plan.highlighted ? "text-white/90" : "text-[#4b5563]"}>
                    {plan.description}
                  </p>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Check className={`w-5 h-5 flex-shrink-0 mt-0.5 ${plan.highlighted ? "text-white" : "text-[#03b28c]"}`} />
                      <span className={plan.highlighted ? "text-white" : "text-[#4b5563]"}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/admin"
                  className={`group flex items-center justify-center gap-2 w-full py-3 px-6 rounded-xl font-semibold transition-all ${plan.highlighted
                    ? "bg-white text-[#059cc0] hover:shadow-lg hover:-translate-y-0.5"
                    : "bg-white border-2 border-[#e5e7eb] text-[#1f1f21] hover:border-[#059cc0] hover:text-[#059cc0]"
                    }`}
                >
                  {plan.cta}
                  {plan.highlighted && (
                    <ArrowLeft className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  )}
                </Link>
              </motion.div>
            ))}
          </div>

          {/* FAQ */}
          <div className="max-w-3xl mx-auto">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl md:text-4xl font-bold text-[#1f1f21] mb-12 text-center"
            >
              שאלות נפוצות
            </motion.h2>

            <div className="space-y-6">
              {faqs.map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="p-6 rounded-2xl bg-gray-50 border border-[#e5e7eb]"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-[#059cc0] to-[#03b28c] flex items-center justify-center">
                      <HelpCircle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-[#1f1f21] mb-2">
                        {faq.question}
                      </h3>
                      <p className="text-[#4b5563] leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Final CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-20"
          >
            <h3 className="text-2xl font-bold text-[#1f1f21] mb-4">
              עדיין לא בטוחים?
            </h3>
            <p className="text-[#4b5563] mb-6">
              התחילו בחינם ללא כרטיס אשראי
            </p>
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-[#059cc0] to-[#03b28c] text-white font-semibold text-lg hover:shadow-xl hover:-translate-y-1 transition-all"
            >
              פתחו חשבון DJ
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}
