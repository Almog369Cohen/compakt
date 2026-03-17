"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  gradient?: string;
  delay?: number;
}

export function GlassCard({ 
  children, 
  className = "", 
  hover = true,
  gradient,
  delay = 0 
}: GlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay, type: "spring", stiffness: 100 }}
      className="group relative"
    >
      <div className={`relative rounded-3xl bg-white/70 backdrop-blur-xl border border-white/60 shadow-xl shadow-black/5 ${hover ? 'hover:shadow-2xl hover:shadow-black/10' : ''} transition-all duration-500 overflow-hidden ${className}`}>
        {/* Gradient overlay on hover */}
        {gradient && (
          <div 
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"
            style={{ background: gradient }}
          />
        )}
        
        {/* Animated border */}
        {hover && gradient && (
          <div 
            className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{
              background: gradient,
              padding: '1px',
              WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              WebkitMaskComposite: 'xor',
              maskComposite: 'exclude'
            }}
          />
        )}

        <div className="relative">
          {children}
        </div>
      </div>
    </motion.div>
  );
}
