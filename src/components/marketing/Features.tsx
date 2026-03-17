"use client";

import { motion } from "framer-motion";
import { Sparkles, Users, Heart, BarChart3 } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

const featureIcons = [Sparkles, Users, Heart, BarChart3];
const featureGradients = [
  "from-blue-500 to-cyan-500",
  "from-purple-500 to-pink-500",
  "from-pink-500 to-rose-500",
  "from-green-500 to-emerald-500",
];
const featureKeys = ["lessMess", "moreProfessional", "coupleExperience", "fullControl"];

export function Features() {
  const { t } = useTranslation("marketing");

  const features = featureKeys.map((key, i) => ({
    icon: featureIcons[i],
    title: t(`features.items.${key}.title`),
    description: t(`features.items.${key}.description`),
    gradient: featureGradients[i],
  }));

  return (
    <section className="py-20 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block px-4 py-2 rounded-full bg-gradient-to-r from-blue-50 to-green-50 border border-[#e5e7eb] mb-4">
            <span className="text-sm font-medium bg-gradient-to-r from-[#059cc0] to-[#03b28c] bg-clip-text text-transparent">
              {t("features.badge")}
            </span>
          </div>

          <h2 className="text-3xl md:text-4xl font-bold text-[#1f1f21] mb-4">
            {t("features.title")}
          </h2>

          <p className="text-lg text-[#4b5563] max-w-2xl mx-auto">
            {t("features.subtitle")}
          </p>
        </div>

        {/* Features Grid - Mobile First */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group relative"
            >
              <div className="h-full p-6 rounded-xl bg-white border border-[#e5e7eb] hover:border-transparent hover:shadow-lg transition-all">
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity -z-10 blur-xl" style={{ background: feature.gradient }} />

                <div className="w-12 h-12 rounded-lg bg-gradient-to-br flex items-center justify-center mb-4" style={{ background: feature.gradient }}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>

                <h3 className="text-lg font-bold text-[#1f1f21] mb-2">{feature.title}</h3>
                <p className="text-[#4b5563] text-sm leading-relaxed">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
