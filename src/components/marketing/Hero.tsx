"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Play, Heart, X, Star, HelpCircle } from "lucide-react";

export function Hero() {
  return (
    <section className="relative pt-32 pb-20 px-6 overflow-hidden bg-white">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-50/50 to-white pointer-events-none" />

      <div className="relative max-w-7xl mx-auto">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-50 to-green-50 border border-[#e5e7eb] mb-8"
          >
            <span className="w-2 h-2 rounded-full bg-gradient-to-r from-[#059cc0] to-[#03b28c] animate-pulse" />
            <span className="text-sm font-medium text-[#4b5563]">
              הדרך החדשה לניהול אירועי DJ
            </span>
          </motion.div>

          {/* Main headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-5xl md:text-7xl font-bold text-[#1f1f21] mb-6 leading-[1.1] tracking-tight"
          >
            הדרך החדשה שבה
            <br />
            <span className="bg-gradient-to-r from-[#059cc0] to-[#03b28c] bg-clip-text text-transparent">
              DJs מכינים אירועים
            </span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-xl md:text-2xl text-[#4b5563] mb-10 leading-relaxed max-w-3xl mx-auto"
          >
            במקום וואטסאפים אינסופיים,
            <br />
            שלחו לזוג שאלון חכם וקבלו brief מוזיקלי מסודר.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              href="/admin"
              className="group px-8 py-4 rounded-xl bg-gradient-to-r from-[#059cc0] to-[#03b28c] text-white font-semibold text-lg hover:shadow-xl hover:-translate-y-1 transition-all flex items-center gap-2"
            >
              פתחו חשבון DJ
              <ArrowLeft className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/how-it-works"
              className="px-8 py-4 rounded-xl bg-white border-2 border-[#e5e7eb] text-[#1f1f21] font-semibold text-lg hover:border-[#059cc0] hover:text-[#059cc0] transition-all flex items-center gap-2"
            >
              <Play className="w-5 h-5" />
              ראו איך זה עובד
            </Link>
          </motion.div>

          {/* Social proof */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-16 flex items-center justify-center gap-8 text-sm text-[#4b5563]"
          >
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full bg-gradient-to-br from-[#059cc0] to-[#03b28c] border-2 border-white"
                  />
                ))}
              </div>
              <span>מאות DJs כבר משתמשים</span>
            </div>
          </motion.div>
        </div>

        {/* Product preview - Music swipe demo */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="mt-20 max-w-5xl mx-auto"
        >
          <div className="relative">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#059cc0]/20 to-[#03b28c]/20 blur-3xl" />

            {/* Browser mockup */}
            <div className="relative rounded-2xl overflow-hidden border-2 border-gray-200 shadow-2xl bg-white">
              {/* Browser chrome */}
              <div className="bg-gray-100 px-4 py-3 border-b border-gray-200 flex items-center gap-2">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 mx-4 px-3 py-1 bg-white rounded-md text-xs text-gray-400">
                  compakt.app/dj/almog-cohen
                </div>
              </div>

              {/* Content - Music swipe interface */}
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-8 md:p-12">
                <div className="max-w-sm mx-auto">
                  {/* Card */}
                  <div className="relative aspect-[3/4] rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-br from-gray-800 to-gray-900 mb-6">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#059cc0] to-[#03b28c] opacity-30" />
                    <div className="relative h-full flex flex-col justify-end p-6 text-white">
                      <div>
                        <h3 className="text-2xl font-bold mb-1">Uptown Funk</h3>
                        <p className="text-lg text-white/80">Mark Ronson</p>
                        <div className="mt-2 inline-block px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-sm">
                          פופ
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center justify-center gap-3">
                    <button className="w-14 h-14 rounded-full bg-white border-2 border-red-200 flex items-center justify-center shadow-lg">
                      <X className="w-6 h-6 text-red-500" />
                    </button>

                    <button className="w-14 h-14 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center shadow-lg">
                      <HelpCircle className="w-6 h-6 text-gray-400" />
                    </button>

                    <button className="w-16 h-16 rounded-full bg-gradient-to-r from-[#059cc0] to-[#03b28c] flex items-center justify-center shadow-xl">
                      <Heart className="w-7 h-7 text-white" />
                    </button>

                    <button className="w-14 h-14 rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 flex items-center justify-center shadow-lg">
                      <Star className="w-6 h-6 text-white" />
                    </button>
                  </div>

                  <div className="text-center mt-4">
                    <p className="text-sm text-white/60">5 מתוך 20 שירים</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
