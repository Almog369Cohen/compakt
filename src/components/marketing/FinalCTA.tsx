"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useTranslation, useLocaleStore } from "@/lib/i18n";

export function FinalCTA() {
  const { t } = useTranslation("marketing");
  const locale = useLocaleStore((s) => s.locale);
  const Arrow = locale === "he" ? ArrowLeft : ArrowRight;

  return (
    <section className="relative py-24 px-6 bg-gradient-to-br from-[#059cc0] via-[#03b28c] to-[#059cc0] overflow-hidden">
      {/* Animated gradient mesh */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400/30 rounded-full mix-blend-overlay filter blur-3xl animate-blob" />
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-400/30 rounded-full mix-blend-overlay filter blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-cyan-400/30 rounded-full mix-blend-overlay filter blur-3xl animate-blob animation-delay-4000" />
      </div>

      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:24px_24px]" />

      <div className="relative max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <motion.h2
            className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            {t("cta.title")}
          </motion.h2>

          <motion.p
            className="text-lg md:text-xl text-white/90 mb-10 leading-relaxed max-w-2xl mx-auto font-medium"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            {t("cta.subtitleLine1")} {t("cta.subtitleLine2")}
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            <Link
              href="/admin"
              className="group relative px-10 py-5 rounded-2xl bg-white text-[#059cc0] font-bold text-lg shadow-2xl shadow-black/20 hover:shadow-3xl hover:scale-105 hover:-translate-y-1 transition-all duration-300 flex items-center gap-3 overflow-hidden"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-slate-50 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <span className="relative">{t("cta.ctaPrimary")}</span>
              <Arrow className="relative w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/how-it-works"
              className="group px-10 py-5 rounded-2xl bg-white/10 backdrop-blur-xl border-2 border-white/30 text-white font-semibold text-lg hover:bg-white/20 hover:border-white/50 transition-all duration-300 flex items-center gap-2"
            >
              {t("cta.ctaSecondary")}
            </Link>
          </motion.div>

          <motion.p
            className="mt-8 text-white/70 text-sm font-medium"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
          >
            {t("cta.socialProof")}
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}
