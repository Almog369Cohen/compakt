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
    <section className="py-24 px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block px-4 py-2 rounded-full bg-gradient-to-r from-blue-50 to-green-50 border border-[#e5e7eb] mb-6"
          >
            <span className="text-sm font-medium bg-gradient-to-r from-[#059cc0] to-[#03b28c] bg-clip-text text-transparent">
              {t("solution.badge")}
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold text-[#1f1f21] mb-6"
          >
            {t("solution.title")}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-xl text-[#4b5563] max-w-2xl mx-auto"
          >
            {t("solution.subtitle")}
          </motion.p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connection line */}
          <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-[#059cc0] via-[#03b28c] to-[#059cc0] opacity-20 -translate-y-1/2" />

          <div className="grid md:grid-cols-3 gap-8 relative">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="relative"
              >
                <div className="bg-white rounded-2xl p-8 border-2 border-[#e5e7eb] hover:border-[#059cc0] hover:shadow-xl transition-all">
                  {/* Number badge */}
                  <div className="absolute -top-4 right-8 w-12 h-12 rounded-full bg-gradient-to-r from-[#059cc0] to-[#03b28c] flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-lg">{step.number}</span>
                  </div>

                  {/* Icon */}
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center mb-6 mt-4">
                    <step.icon className="w-8 h-8 text-[#059cc0]" />
                  </div>

                  {/* Content */}
                  <h3 className="text-2xl font-bold text-[#1f1f21] mb-3">
                    {step.title}
                  </h3>
                  <p className="text-[#4b5563] leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
