"use client";

import { motion } from "framer-motion";
import { Send, Music2, FileCheck } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

const stepIcons = [Send, Music2, FileCheck];
const stepNumbers = ["01", "02", "03"];
const stepKeys = ["step1", "step2", "step3"];

export function Solution() {
  const { t } = useTranslation("marketing");

  const steps = stepKeys.map((key, i) => ({
    number: stepNumbers[i],
    icon: stepIcons[i],
    title: t(`solution.steps.${key}.title`),
    description: t(`solution.steps.${key}.description`),
  }));

  return (
    <section className="relative py-20 px-6 bg-gradient-to-b from-slate-50/50 to-white overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-1/2 left-0 w-72 h-72 bg-gradient-to-br from-cyan-100/30 to-blue-100/30 rounded-full blur-3xl" />
      <div className="absolute top-1/2 right-0 w-72 h-72 bg-gradient-to-br from-emerald-100/30 to-teal-100/30 rounded-full blur-3xl" />

      <div className="relative max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#059cc0]/10 to-[#03b28c]/10 backdrop-blur-sm border border-[#059cc0]/20 mb-6 shadow-lg shadow-[#059cc0]/5"
          >
            <span className="text-xs font-semibold bg-gradient-to-r from-[#059cc0] to-[#03b28c] bg-clip-text text-transparent">
              {t("solution.badge")}
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold bg-gradient-to-br from-slate-900 to-slate-700 bg-clip-text text-transparent mb-4"
          >
            {t("solution.title")}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
            className="text-lg text-slate-600 max-w-2xl mx-auto font-medium"
          >
            {t("solution.subtitle")}
          </motion.p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Animated connection line */}
          <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 -translate-y-1/2 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-transparent via-[#059cc0]/30 to-transparent" />
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-[#059cc0] to-transparent"
              initial={{ x: '-100%' }}
              whileInView={{ x: '100%' }}
              viewport={{ once: true }}
              transition={{ duration: 2, ease: "easeInOut" }}
            />
          </div>

          <div className="grid md:grid-cols-3 gap-6 relative">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15, type: "spring", stiffness: 100 }}
                className="relative"
              >
                <div className="group relative h-full p-6 rounded-3xl bg-white/70 backdrop-blur-xl border border-white/60 shadow-xl shadow-black/5 hover:shadow-2xl hover:shadow-[#059cc0]/10 transition-all duration-500 overflow-hidden">
                  {/* Gradient overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#059cc0]/5 to-[#03b28c]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl" />

                  {/* Animated border */}
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[#059cc0]/30 to-[#03b28c]/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{
                    padding: '1px',
                    WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                    WebkitMaskComposite: 'xor',
                    maskComposite: 'exclude'
                  }} />

                  {/* Floating number badge */}
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    whileInView={{ scale: 1, rotate: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.15 + 0.2, type: "spring", stiffness: 200 }}
                    className="absolute -top-4 -right-4 w-12 h-12 rounded-2xl bg-gradient-to-br from-[#059cc0] to-[#03b28c] flex items-center justify-center shadow-lg shadow-[#059cc0]/30 group-hover:scale-110 transition-transform duration-300"
                  >
                    <span className="text-white font-bold text-lg">{step.number}</span>
                  </motion.div>

                  <div className="relative">
                    {/* Icon */}
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center mb-5 shadow-md group-hover:scale-110 group-hover:shadow-lg transition-all duration-300">
                      <step.icon className="w-7 h-7 text-[#059cc0]" />
                    </div>

                    {/* Content */}
                    <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-slate-950 transition-colors">
                      {step.title}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
