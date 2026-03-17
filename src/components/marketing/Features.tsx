"use client";

import { motion } from "framer-motion";
import { Sparkles, Users, Heart, BarChart3, Check } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

const featureIcons = [Sparkles, Users, Heart, BarChart3];
const featureKeys = ["lessMess", "moreProfessional", "coupleExperience", "fullControl"];
const featureAccents = ["#059cc0", "#7c3aed", "#e11d48", "#03b28c"];

export function Features() {
  const { t, locale } = useTranslation("marketing");

  const getBenefits = (key: string): string[] => {
    const currentLocale = locale === "en" ? "en" : "he";
    const benefitsData = {
      he: {
        lessMess: ["תקשורת מרוכזת — בלי וואטסאפ", "סיכום אוטומטי של כל הפרטים", "היסטוריה מלאה לכל אירוע"],
        moreProfessional: ["דף פרופיל DJ ייחודי", "תיק עבודות עם אלבומים", "המלצות מזוגות קודמים"],
        coupleExperience: ["בחירת שירים בסוויפ", "שאלון מוזיקלי מותאם", "חוויה מהירה ואינטואיטיבית"],
        fullControl: ["דשבורד מרכזי לכל האירועים", "מעקב התקדמות בזמן אמת", "בריפים מסודרים ומוכנים"],
      },
      en: {
        lessMess: ["Centralized communication — no WhatsApp", "Auto-summary of every detail", "Full history per event"],
        moreProfessional: ["Unique DJ profile page", "Portfolio with albums", "Reviews from past couples"],
        coupleExperience: ["Swipe-based song selection", "Custom music questionnaire", "Fast and intuitive experience"],
        fullControl: ["Central dashboard for all events", "Real-time progress tracking", "Organized, work-ready briefs"],
      },
    };
    return benefitsData[currentLocale as keyof typeof benefitsData][key as keyof typeof benefitsData.he] || [];
  };

  const features = featureKeys.map((key, i) => ({
    icon: featureIcons[i],
    title: t(`features.items.${key}.title`),
    description: t(`features.items.${key}.description`),
    accent: featureAccents[i],
  }));

  return (
    <section className="relative py-20 px-6 bg-gradient-to-b from-white via-slate-50/50 to-white overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-20 right-0 w-96 h-96 bg-gradient-to-br from-blue-100/40 to-emerald-100/40 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-0 w-96 h-96 bg-gradient-to-br from-purple-100/40 to-pink-100/40 rounded-full blur-3xl" />

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
              {t("features.badge")}
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold bg-gradient-to-br from-slate-900 to-slate-700 bg-clip-text text-transparent mb-4"
          >
            {t("features.title")}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
            className="text-lg text-slate-600 max-w-2xl mx-auto font-medium"
          >
            {t("features.subtitle")}
          </motion.p>
        </div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, type: "spring", stiffness: 100 }}
              className="group relative"
            >
              <div className="relative h-full p-6 rounded-3xl bg-white/60 backdrop-blur-xl border border-white/60 shadow-xl shadow-black/5 hover:shadow-2xl hover:shadow-black/10 transition-all duration-500 overflow-hidden">
                {/* Gradient overlay on hover */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"
                  style={{
                    background: `linear-gradient(135deg, ${feature.accent}08, ${feature.accent}03)`
                  }}
                />

                {/* Animated border gradient */}
                <div
                  className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background: `linear-gradient(135deg, ${feature.accent}20, transparent)`,
                    padding: '1px',
                    WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                    WebkitMaskComposite: 'xor',
                    maskComposite: 'exclude'
                  }}
                />

                <div className="relative">
                  {/* Icon + Title */}
                  <div className="flex items-start gap-4 mb-4">
                    <div
                      className="relative w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300"
                      style={{
                        background: `linear-gradient(135deg, ${feature.accent}15, ${feature.accent}25)`
                      }}
                    >
                      <feature.icon className="w-6 h-6" style={{ color: feature.accent }} />
                      {/* Glow effect */}
                      <div
                        className="absolute inset-0 rounded-2xl blur-xl opacity-0 group-hover:opacity-50 transition-opacity duration-300"
                        style={{ background: feature.accent }}
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-slate-950 transition-colors">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>

                  {/* Benefits with enhanced styling */}
                  <div className="space-y-2 pl-16">
                    {getBenefits(featureKeys[index]).map((benefit: string, benefitIndex: number) => (
                      <motion.div
                        key={benefitIndex}
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.1 + benefitIndex * 0.05 }}
                        className="flex items-start gap-2.5 group/benefit"
                      >
                        <div className="mt-0.5 w-4 h-4 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center flex-shrink-0 group-hover/benefit:scale-110 transition-transform">
                          <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                        </div>
                        <span className="text-sm text-slate-700 group-hover/benefit:text-slate-900 transition-colors">
                          {benefit}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
