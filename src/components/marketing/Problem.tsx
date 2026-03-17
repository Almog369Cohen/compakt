"use client";

import { motion } from "framer-motion";
import { MessageSquare, FileQuestion, Music, AlertCircle } from "lucide-react";

const problems = [
  {
    icon: MessageSquare,
    title: "עשרות הודעות וואטסאפ",
    description: "תקשורת מפוזרת בין כמה צ'אטים וקבוצות",
  },
  {
    icon: FileQuestion,
    title: "בקשות לא ברורות",
    description: "\"שירים רומנטיים\" או \"משהו אנרגטי\" - מה זה אומר?",
  },
  {
    icon: Music,
    title: "שירים מפוזרים",
    description: "רשימות בנוטס, אקסל, ספוטיפיי - בלי סדר",
  },
  {
    icon: AlertCircle,
    title: "הפתעות לפני האירוע",
    description: "\"אה, שכחנו לספר לך ש...\" ברגע האחרון",
  },
];

export function Problem() {
  return (
    <section className="py-24 px-6 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block px-4 py-2 rounded-full bg-red-50 border border-red-100 mb-6"
          >
            <span className="text-sm font-medium text-red-600">נמאס מהבלגן?</span>
          </motion.div>
          
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold text-[#1f1f21] mb-6"
          >
            הבעיות שכל DJ מכיר
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-xl text-[#4b5563] max-w-2xl mx-auto"
          >
            ניהול אירועים דרך וואטסאפ זה כאב ראש. הגיע הזמן לשיטה יותר טובה.
          </motion.p>
        </div>

        {/* Problems grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {problems.map((problem, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group p-8 rounded-2xl bg-white border border-[#e5e7eb] hover:border-red-200 hover:shadow-lg transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center group-hover:bg-red-100 transition-colors">
                  <problem.icon className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-[#1f1f21] mb-2">
                    {problem.title}
                  </h3>
                  <p className="text-[#4b5563] leading-relaxed">
                    {problem.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
