"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface SectionHeaderProps {
  badge?: string;
  title: string | ReactNode;
  subtitle?: string;
  centered?: boolean;
}

export function SectionHeader({ 
  badge, 
  title, 
  subtitle, 
  centered = true 
}: SectionHeaderProps) {
  return (
    <div className={`mb-16 ${centered ? 'text-center' : ''}`}>
      {badge && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#059cc0]/10 to-[#03b28c]/10 backdrop-blur-sm border border-[#059cc0]/20 mb-6 shadow-lg shadow-[#059cc0]/5"
        >
          <span className="text-xs font-semibold bg-gradient-to-r from-[#059cc0] to-[#03b28c] bg-clip-text text-transparent">
            {badge}
          </span>
        </motion.div>
      )}

      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.1 }}
        className="text-4xl md:text-5xl font-bold bg-gradient-to-br from-slate-900 to-slate-700 bg-clip-text text-transparent mb-4"
      >
        {title}
      </motion.h2>

      {subtitle && (
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15 }}
          className={`text-lg text-slate-600 font-medium ${centered ? 'max-w-2xl mx-auto' : 'max-w-3xl'}`}
        >
          {subtitle}
        </motion.p>
      )}
    </div>
  );
}
