"use client";

import { motion } from "framer-motion";
import { Heart, Star, X } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

export function ProductShowcase() {
  const { t } = useTranslation("marketing");

  return (
    <section className="py-24 px-6 bg-gradient-to-br from-gray-900 to-gray-800 relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
          backgroundSize: '32px 32px'
        }} />
      </div>

      <div className="relative max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold text-white mb-6"
          >
            {t("showcase.title")}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-xl text-white/80 max-w-2xl mx-auto"
          >
            {t("showcase.subtitle")}
          </motion.p>
        </div>

        {/* Sexy Mini Demos - 3 in a row */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 max-w-6xl mx-auto"
        >
          {/* Loved Demo */}
          <motion.div
            whileHover={{ scale: 1.05, y: -5 }}
            className="group relative"
          >
            <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-gradient-to-br from-pink-500/20 to-rose-500/20 backdrop-blur-sm border border-pink-500/30 hover:border-pink-400/50 transition-all duration-500">
              {/* Glass effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 to-rose-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              {/* Content */}
              <div className="relative h-full flex flex-col items-center justify-center p-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center mb-4 shadow-lg shadow-pink-500/30 group-hover:scale-110 transition-transform duration-300">
                  <Heart className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2 bg-gradient-to-r from-pink-400 to-rose-400 bg-clip-text text-transparent">{t("showcase.loved")}</h3>
                <p className="text-sm text-white/80 text-center">{t("showcase.lovedDesc")}</p>
              </div>
            </div>
          </motion.div>

          {/* Must Play Demo */}
          <motion.div
            whileHover={{ scale: 1.05, y: -5 }}
            className="group relative"
            transition={{ delay: 0.1 }}
          >
            <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-gradient-to-br from-amber-500/20 to-yellow-500/20 backdrop-blur-sm border border-amber-500/30 hover:border-amber-400/50 transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-yellow-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="relative h-full flex flex-col items-center justify-center p-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center mb-4 shadow-lg shadow-amber-500/30 group-hover:scale-110 transition-transform duration-300">
                  <Star className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2 bg-gradient-to-r from-amber-400 to-yellow-400 bg-clip-text text-transparent">{t("showcase.mustPlay")}</h3>
                <p className="text-sm text-white/80 text-center">{t("showcase.mustPlayDesc")}</p>
              </div>
            </div>
          </motion.div>

          {/* Skip Demo */}
          <motion.div
            whileHover={{ scale: 1.05, y: -5 }}
            className="group relative"
            transition={{ delay: 0.2 }}
          >
            <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-gradient-to-br from-gray-500/20 to-slate-500/20 backdrop-blur-sm border border-gray-500/30 hover:border-gray-400/50 transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-br from-gray-500/10 to-slate-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="relative h-full flex flex-col items-center justify-center p-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-500 to-slate-500 flex items-center justify-center mb-4 shadow-lg shadow-gray-500/30 group-hover:scale-110 transition-transform duration-300">
                  <X className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2 bg-gradient-to-r from-gray-400 to-slate-400 bg-clip-text text-transparent">{t("showcase.skip")}</h3>
                <p className="text-sm text-white/80 text-center">{t("showcase.skipDesc")}</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
