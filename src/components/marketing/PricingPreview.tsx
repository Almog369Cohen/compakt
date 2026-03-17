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
    <ul className="space-y-4 mb-8">
      {Array.from({ length: count }, (_, i) => (
        <li key={i} className="flex items-start gap-3">
          <Check className={`w-5 h-5 flex-shrink-0 mt-0.5 ${checkClass}`} />
          <span className={textClass}>{t(`pricing.${planKey}.feature${i}`)}</span>
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
            {t("pricing.title")}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-xl text-[#4b5563] max-w-2xl mx-auto"
          >
            {t("pricing.subtitle")}
          </motion.p>
        </div>

        {/* Pricing cards */}
        <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Free plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="p-8 rounded-2xl bg-white border-2 border-[#e5e7eb] hover:border-[#059cc0] transition-all"
          >
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-[#1f1f21] mb-2">{t("pricing.free.name")}</h3>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-5xl font-bold text-[#1f1f21]">{t("pricing.free.price")}</span>
                <span className="text-[#4b5563]">{t("pricing.perMonth")}</span>
              </div>
              <p className="text-[#4b5563]">{t("pricing.free.description")}</p>
            </div>

            <PlanFeatures t={t} planKey="free" />

            <Link
              href="/admin"
              className="block w-full py-3 px-6 rounded-xl bg-white border-2 border-[#e5e7eb] text-[#1f1f21] font-semibold text-center hover:border-[#059cc0] hover:text-[#059cc0] transition-all"
            >
              {t("pricing.startFree")}
            </Link>
          </motion.div>

          {/* Basic plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.25 }}
            className="relative p-8 rounded-2xl bg-gradient-to-br from-[#059cc0] to-[#03b28c] text-white shadow-xl scale-105 lg:scale-100"
          >
            {/* Popular badge */}
            <div className="absolute -top-4 right-8 px-4 py-1 rounded-full bg-white text-[#059cc0] text-sm font-semibold">
              {t("pricing.popularBadge")}
            </div>

            <div className="mb-6">
              <h3 className="text-2xl font-bold mb-2">{t("pricing.basic.name")}</h3>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-5xl font-bold">{t("pricing.basic.price")}</span>
                <span className="text-white/80">{t("pricing.perMonth")}</span>
              </div>
              <p className="text-white/90">{t("pricing.basic.description")}</p>
            </div>

            <PlanFeatures t={t} planKey="basic" checkClass="text-white" textClass="text-white" />

            <Link
              href="/admin"
              className="group flex items-center justify-center gap-2 w-full py-3 px-6 rounded-xl bg-white text-[#059cc0] font-semibold hover:shadow-lg hover:-translate-y-0.5 transition-all"
            >
              {t("pricing.startNow")}
              <Arrow className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>

          {/* Pro plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="p-8 rounded-2xl bg-white border-2 border-[#e5e7eb] hover:border-[#059cc0] transition-all"
          >
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-[#1f1f21] mb-2">{t("pricing.pro.name")}</h3>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-5xl font-bold text-[#1f1f21]">{t("pricing.pro.price")}</span>
                <span className="text-[#4b5563]">{t("pricing.perMonth")}</span>
              </div>
              <p className="text-[#4b5563]">{t("pricing.pro.description")}</p>
            </div>

            <PlanFeatures t={t} planKey="pro" />

            <Link
              href="/admin"
              className="group flex items-center justify-center gap-2 w-full py-3 px-6 rounded-xl bg-gradient-to-r from-[#059cc0] to-[#03b28c] text-white font-semibold hover:shadow-lg hover:-translate-y-0.5 transition-all"
            >
              {t("pricing.startNow")}
              <Arrow className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
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
            {t("pricing.seeFullPricing")}
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
