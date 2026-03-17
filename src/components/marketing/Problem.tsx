"use client";

import { motion } from "framer-motion";
import { MessageSquare, FileQuestion, Music, AlertCircle } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

const problemIcons = [MessageSquare, FileQuestion, Music, AlertCircle];
const problemKeys = ["whatsapp", "unclearRequests", "scatteredSongs", "lastMinute"];

export function Problem() {
  const { t } = useTranslation("marketing");

  const problems = problemKeys.map((key, i) => ({
    icon: problemIcons[i],
    title: t(`problem.items.${key}.title`),
    description: t(`problem.items.${key}.description`),
  }));

  return (
    <section className="relative py-20 px-6 bg-gradient-to-b from-white to-slate-50/50 overflow-hidden">
      {/* Decorative gradient orbs */}
      <div className="absolute top-10 left-10 w-64 h-64 bg-gradient-to-br from-red-100/30 to-orange-100/30 rounded-full blur-3xl" />
      <div className="absolute bottom-10 right-10 w-64 h-64 bg-gradient-to-br from-amber-100/30 to-yellow-100/30 rounded-full blur-3xl" />

      <div className="relative max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-red-50 to-orange-50 backdrop-blur-sm border border-red-200/50 mb-6 shadow-lg shadow-red-500/5"
          >
            <span className="text-xs font-semibold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">{t("problem.badge")}</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold bg-gradient-to-br from-slate-900 to-slate-700 bg-clip-text text-transparent mb-4"
          >
            {t("problem.title")}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
            className="text-lg text-slate-600 max-w-2xl mx-auto font-medium"
          >
            {t("problem.subtitle")}
          </motion.p>
        </div>

        {/* Problems — Modern glassmorphism cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {problems.map((problem, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, type: "spring", stiffness: 120 }}
              className="group relative"
            >
              <div className="relative p-5 rounded-2xl bg-white/70 backdrop-blur-xl border border-white/60 shadow-lg shadow-black/5 hover:shadow-xl hover:shadow-red-500/10 transition-all duration-500 overflow-hidden">
                {/* Gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-red-50/50 to-orange-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />

                {/* Animated border */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-red-200/50 to-orange-200/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{
                  padding: '1px',
                  WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                  WebkitMaskComposite: 'xor',
                  maskComposite: 'exclude'
                }} />

                <div className="relative">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-red-100 to-orange-100 flex items-center justify-center mb-4 shadow-md group-hover:scale-110 group-hover:shadow-lg transition-all duration-300">
                    <problem.icon className="w-5 h-5 text-red-600" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mb-2 group-hover:text-slate-950 transition-colors">
                    {problem.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
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
