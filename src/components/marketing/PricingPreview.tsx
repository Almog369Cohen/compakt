"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Check, ArrowLeft, ArrowRight } from "lucide-react";
import { useTranslation, useLocaleStore } from "@/lib/i18n";

function PlanFeatures({ t, planKey, checkClass = "text-[#03b28c]", textClass = "text-[#4b5563]" }: {
  t: (key: string) => string;
  planKey: string;
  checkClass?: string;
  textClass?: string;
}) {
  const count = parseInt(t(`pricing.${planKey}.featureCount`), 10) || 0;
  return (
    <ul className="space-y-2.5 mb-6">
      {Array.from({ length: count }, (_, i) => (
        <li key={i} className="flex items-start gap-2">
          <Check className={`w-4 h-4 flex-shrink-0 mt-0.5 ${checkClass}`} />
          <span className={`text-sm ${textClass}`}>{t(`pricing.${planKey}.feature${i}`)}</span>
        </li>
      ))}
    </ul>
  );
}

export function PricingPreview() {
  const { t } = useTranslation("marketing");
  const locale = useLocaleStore((s) => s.locale);
  const Arrow = locale === "he" ? ArrowLeft : ArrowRight;

  return (
    <section className="relative py-20 px-6 bg-gradient-to-b from-white via-slate-50/30 to-white overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-20 left-1/4 w-96 h-96 bg-gradient-to-br from-indigo-100/30 to-purple-100/30 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-gradient-to-br from-cyan-100/30 to-blue-100/30 rounded-full blur-3xl" />

      <div className="relative max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold bg-gradient-to-br from-slate-900 to-slate-700 bg-clip-text text-transparent mb-4"
          >
            {t("pricing.title")}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-slate-600 max-w-2xl mx-auto font-medium"
          >
            {t("pricing.subtitle")}
          </motion.p>
        </div>

        {/* Pricing cards */}
        <div className="grid md:grid-cols-3 gap-4 max-w-5xl mx-auto">
          {/* Free plan */}
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, type: "spring", stiffness: 100 }}
            className="group relative"
          >
            <div className="relative p-6 rounded-3xl bg-white/70 backdrop-blur-xl border border-white/60 shadow-xl shadow-black/5 hover:shadow-2xl hover:shadow-black/10 transition-all duration-500 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 to-white/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl" />
              <div className="relative">
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{t("pricing.free.name")}</h3>
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-5xl font-bold bg-gradient-to-br from-slate-900 to-slate-700 bg-clip-text text-transparent">{t("pricing.free.price")}</span>
                    <span className="text-sm text-slate-500 font-medium">{t("pricing.perMonth")}</span>
                  </div>
                  <p className="text-sm text-slate-600">{t("pricing.free.description")}</p>
                </div>

                <PlanFeatures t={t} planKey="free" />

                <Link
                  href="/admin"
                  className="block w-full py-3 px-6 rounded-xl bg-slate-100 text-slate-900 font-semibold text-sm text-center hover:bg-slate-200 transition-all duration-200"
                >
                  {t("pricing.startFree")}
                </Link>
              </div>
            </div>
          </motion.div>

          {/* Basic plan — highlighted */}
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 1.05 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15, type: "spring", stiffness: 100 }}
            className="relative group"
          >
            {/* Glow effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-[#059cc0] to-[#03b28c] rounded-3xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-500" />

            <div className="relative p-7 rounded-3xl bg-gradient-to-br from-[#059cc0] to-[#03b28c] text-white shadow-2xl shadow-[#059cc0]/30 overflow-hidden">
              {/* Animated background pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,.1)_50%,transparent_75%,transparent_100%)] bg-[length:250%_250%] animate-gradient" />
              </div>

              {/* Popular badge */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                whileInView={{ scale: 1, rotate: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                className="absolute -top-4 right-6 px-4 py-2 rounded-full bg-white text-[#059cc0] text-xs font-bold shadow-lg"
              >
                {t("pricing.popularBadge")}
              </motion.div>

              <div className="relative">

                <div className="mb-6">
                  <h3 className="text-xl font-bold mb-2">{t("pricing.basic.name")}</h3>
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-5xl font-bold">{t("pricing.basic.price")}</span>
                    <span className="text-sm text-white/80 font-medium">{t("pricing.perMonth")}</span>
                  </div>
                  <p className="text-sm text-white/90">{t("pricing.basic.description")}</p>
                </div>

                <PlanFeatures t={t} planKey="basic" checkClass="text-white" textClass="text-white/95" />

                <Link
                  href="/admin"
                  className="group flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-xl bg-white text-[#059cc0] font-bold text-sm hover:shadow-xl hover:scale-105 transition-all duration-200"
                >
                  {t("pricing.startNow")}
                  <Arrow className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </motion.div>

          {/* Pro plan */}
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
            className="group relative"
          >
            <div className="relative p-6 rounded-3xl bg-white/70 backdrop-blur-xl border border-white/60 shadow-xl shadow-black/5 hover:shadow-2xl hover:shadow-[#059cc0]/10 transition-all duration-500 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-[#059cc0]/5 to-[#03b28c]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl" />
              <div className="relative">
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{t("pricing.pro.name")}</h3>
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-5xl font-bold bg-gradient-to-br from-slate-900 to-slate-700 bg-clip-text text-transparent">{t("pricing.pro.price")}</span>
                    <span className="text-sm text-slate-500 font-medium">{t("pricing.perMonth")}</span>
                  </div>
                  <p className="text-sm text-slate-600">{t("pricing.pro.description")}</p>
                </div>

                <PlanFeatures t={t} planKey="pro" />

                <Link
                  href="/admin"
                  className="group flex items-center justify-center gap-2 w-full py-3 px-6 rounded-xl bg-gradient-to-r from-[#059cc0] to-[#03b28c] text-white font-semibold text-sm hover:shadow-lg hover:shadow-[#059cc0]/30 transition-all duration-200"
                >
                  {t("pricing.startNow")}
                  <Arrow className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Link to full pricing */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="text-center mt-8"
        >
          <Link
            href="/pricing"
            className="text-sm text-[#059cc0] hover:text-[#03b28c] font-medium transition-colors duration-200"
          >
            {t("pricing.seeFullPricing")}
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
