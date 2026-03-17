"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

export function FinalCTA() {
  return (
    <section className="py-24 px-6 bg-gradient-to-br from-[#059cc0] to-[#03b28c] relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
          backgroundSize: '32px 32px'
        }} />
      </div>

      <div className="relative max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            מוכנים להתחיל?
          </h2>
          
          <p className="text-xl md:text-2xl text-white/90 mb-10 leading-relaxed">
            התחילו עם הזוג הראשון שלכם - בחינם.
            <br />
            לא צריך כרטיס אשראי.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/admin"
              className="group px-8 py-4 rounded-xl bg-white text-[#059cc0] font-semibold text-lg hover:shadow-2xl hover:-translate-y-1 transition-all flex items-center gap-2"
            >
              פתחו חשבון DJ
              <ArrowLeft className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            
            <Link
              href="/how-it-works"
              className="px-8 py-4 rounded-xl bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white font-semibold text-lg hover:bg-white/20 transition-all"
            >
              ראו איך זה עובד
            </Link>
          </div>

          <p className="mt-8 text-white/70 text-sm">
            הצטרפו למאות DJs שכבר משתמשים ב-Compakt
          </p>
        </motion.div>
      </div>
    </section>
  );
}
