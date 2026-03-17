"use client";

import { motion } from "framer-motion";
import { MusicSwipeDemo } from "./demos/MusicSwipeDemo";

export function ProductShowcase() {
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
            בחירת מוזיקה בסוויפ
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-xl text-white/80 max-w-2xl mx-auto"
          >
            הזוג מחליק ימינה/שמאלה על שירים ובוחר מה הם אוהבים בצורה כיפית ואינטואיטיבית
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="max-w-2xl mx-auto"
        >
          <MusicSwipeDemo />
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-16 grid md:grid-cols-3 gap-6 max-w-4xl mx-auto"
        >
          {[
            { emoji: "❤️", title: "אהבתי", desc: "שירים שהזוג רוצה לשמוע" },
            { emoji: "⭐", title: "חובה!", desc: "שירים שחייבים לנגן" },
            { emoji: "✖️", title: "לא בשבילי", desc: "שירים שלא מתאימים" },
          ].map((item, i) => (
            <div key={i} className="p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 text-center">
              <div className="text-4xl mb-3">{item.emoji}</div>
              <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
              <p className="text-sm text-white/70">{item.desc}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
