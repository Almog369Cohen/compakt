"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Check, ArrowLeft } from "lucide-react";

export function PricingPreview() {
  return (
    <section className="py-24 px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold text-[#1f1f21] mb-6"
          >
            התחילו בחינם, שדרגו כשאתם מוכנים
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-xl text-[#4b5563] max-w-2xl mx-auto"
          >
            בחרו את התוכנית שמתאימה לכם
          </motion.p>
        </div>

        {/* Pricing cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Free plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="p-8 rounded-2xl bg-white border-2 border-[#e5e7eb] hover:border-[#059cc0] transition-all"
          >
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-[#1f1f21] mb-2">Free</h3>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-5xl font-bold text-[#1f1f21]">₪0</span>
                <span className="text-[#4b5563]">/חודש</span>
              </div>
              <p className="text-[#4b5563]">מושלם להתחלה</p>
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-[#03b28c] flex-shrink-0 mt-0.5" />
                <span className="text-[#4b5563]">עד 3 אירועים בחודש</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-[#03b28c] flex-shrink-0 mt-0.5" />
                <span className="text-[#4b5563]">פרופיל DJ בסיסי</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-[#03b28c] flex-shrink-0 mt-0.5" />
                <span className="text-[#4b5563]">שאלון מוזיקה</span>
              </li>
            </ul>

            <Link
              href="/admin"
              className="block w-full py-3 px-6 rounded-xl bg-white border-2 border-[#e5e7eb] text-[#1f1f21] font-semibold text-center hover:border-[#059cc0] hover:text-[#059cc0] transition-all"
            >
              התחילו בחינם
            </Link>
          </motion.div>

          {/* Pro plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="relative p-8 rounded-2xl bg-gradient-to-br from-[#059cc0] to-[#03b28c] text-white shadow-xl"
          >
            {/* Popular badge */}
            <div className="absolute -top-4 right-8 px-4 py-1 rounded-full bg-white text-[#059cc0] text-sm font-semibold">
              הכי פופולרי
            </div>

            <div className="mb-6">
              <h3 className="text-2xl font-bold mb-2">Pro</h3>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-5xl font-bold">₪99</span>
                <span className="text-white/80">/חודש</span>
              </div>
              <p className="text-white/90">לדיג&apos;יים מקצועיים</p>
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>אירועים ללא הגבלה</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>פרופיל DJ מתקדם</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>ניהול שירים מלא</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>בריפים מסודרים</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>תמיכה מועדפת</span>
              </li>
            </ul>

            <Link
              href="/admin"
              className="group flex items-center justify-center gap-2 w-full py-3 px-6 rounded-xl bg-white text-[#059cc0] font-semibold hover:shadow-lg hover:-translate-y-0.5 transition-all"
            >
              התחילו עכשיו
              <ArrowLeft className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>

        {/* Link to full pricing */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="text-center mt-12"
        >
          <Link
            href="/pricing"
            className="text-[#059cc0] hover:text-[#03b28c] font-medium transition-colors"
          >
            ראו מחירים מלאים ←
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
