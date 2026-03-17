"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Play } from "lucide-react";
import { useTranslation, useLocaleStore } from "@/lib/i18n";

export function Hero() {
  const { t } = useTranslation("marketing");
  const locale = useLocaleStore((s) => s.locale);
  const Arrow = locale === "he" ? ArrowLeft : ArrowRight;

  return (
    <section className="relative pt-28 pb-16 px-6 overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/30 to-emerald-50/20">
      {/* Animated gradient mesh background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob" />
        <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000" />
      </div>
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />

      <div className="relative max-w-6xl mx-auto">
        <div className="text-center max-w-3xl mx-auto">
          {/* Modern Badge */}
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#059cc0]/10 via-[#03b28c]/10 to-[#059cc0]/10 backdrop-blur-sm border border-[#059cc0]/20 mb-6 shadow-lg shadow-[#059cc0]/5"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#03b28c] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-gradient-to-r from-[#059cc0] to-[#03b28c]" />
            </span>
            <span className="text-xs font-semibold bg-gradient-to-r from-[#059cc0] to-[#03b28c] bg-clip-text text-transparent">
              {t("hero.badge")}
            </span>
          </motion.div>

          {/* Main headline with enhanced typography */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.6 }}
            className="text-5xl md:text-7xl font-bold mb-6 leading-[1.05] tracking-tight"
          >
            <span className="inline-block bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent">
              {t("hero.titleLine1")}
            </span>
            <br />
            <span className="inline-block relative">
              <span className="absolute inset-0 bg-gradient-to-r from-[#059cc0] via-[#03b28c] to-[#059cc0] bg-clip-text text-transparent blur-sm opacity-50" aria-hidden="true">
                {t("hero.titleLine2")}
              </span>
              <span className="relative bg-gradient-to-r from-[#059cc0] via-[#03b28c] to-[#059cc0] bg-clip-text text-transparent animate-gradient">
                {t("hero.titleLine2")}
              </span>
            </span>
          </motion.h1>

          {/* Subheadline with modern styling */}
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-slate-600 mb-10 leading-relaxed max-w-2xl mx-auto font-medium"
          >
            {t("hero.subtitle")}
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <Link
              href="/admin"
              className="group relative px-8 py-4 rounded-2xl bg-gradient-to-r from-[#059cc0] to-[#03b28c] text-white font-semibold text-base shadow-lg shadow-[#059cc0]/25 hover:shadow-xl hover:shadow-[#059cc0]/40 hover:-translate-y-1 transition-all duration-300 flex items-center gap-2 overflow-hidden"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-[#03b28c] to-[#059cc0] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <span className="relative">{t("hero.ctaPrimary")}</span>
              <Arrow className="relative w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/how-it-works"
              className="group px-8 py-4 rounded-2xl bg-white/80 backdrop-blur-sm border border-slate-200 text-slate-900 font-semibold text-base hover:border-[#059cc0]/50 hover:bg-white hover:shadow-lg transition-all duration-300 flex items-center gap-2"
            >
              <Play className="w-4 h-4 text-[#059cc0]" />
              <span>{t("hero.ctaSecondary")}</span>
            </Link>
          </motion.div>

          {/* Enhanced social proof */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-12 flex items-center justify-center gap-3"
          >
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map((i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5 + i * 0.05, type: "spring" }}
                  className="w-9 h-9 rounded-full bg-gradient-to-br from-[#059cc0] to-[#03b28c] border-2 border-white shadow-md"
                />
              ))}
            </div>
            <span className="text-sm font-medium text-slate-600">{t("hero.socialProof")}</span>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
