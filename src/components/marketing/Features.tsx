"use client";

import { motion } from "framer-motion";
import { Sparkles, Users, Heart, BarChart3 } from "lucide-react";

const features = [
  {
    icon: Sparkles,
    title: "פחות בלגן",
    description: "כל התקשורת עם הזוג במקום אחד. לא עוד וואטסאפים אינסופיים.",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: Users,
    title: "יותר מקצועיות",
    description: "פרופיל מרשים שמציג אתכם בצורה הכי טובה מול זוגות חדשים.",
    gradient: "from-purple-500 to-pink-500",
  },
  {
    icon: Heart,
    title: "חוויית זוג מטורפת",
    description: "בחירת שירים בסוויפ - הזוג בוחר מוזיקה בצורה כיפית ואינטואיטיבית.",
    gradient: "from-pink-500 to-rose-500",
  },
  {
    icon: BarChart3,
    title: "שליטה מלאה",
    description: "ניהול כל האירועים, מעקב אחר התקדמות, וכל המידע במקום אחד.",
    gradient: "from-green-500 to-emerald-500",
  },
];

export function Features() {
  return (
    <section className="py-24 px-6 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-20">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold text-[#1f1f21] mb-6"
          >
            למה Compakt?
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-xl text-[#4b5563] max-w-2xl mx-auto"
          >
            ארבעה סיבות למה DJs בוחרים בנו
          </motion.p>
        </div>

        {/* Features grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group relative"
            >
              <div className="h-full p-8 rounded-2xl bg-white border border-[#e5e7eb] hover:border-transparent hover:shadow-xl transition-all">
                {/* Gradient border on hover */}
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity -z-10 blur-xl`} />

                {/* Icon */}
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-[#1f1f21] mb-3">
                  {feature.title}
                </h3>
                <p className="text-[#4b5563] leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
