"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Home, Music } from "lucide-react";

export default function NotFound() {
  return (
    <main className="min-h-dvh gradient-hero flex items-center justify-center px-4" dir="rtl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-8 max-w-sm w-full text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.1 }}
          className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
          style={{ background: "linear-gradient(135deg, #059cc0, #03b28c)" }}
        >
          <Music className="w-8 h-8 text-white" />
        </motion.div>

        <h1 className="text-4xl font-bold mb-2">404</h1>
        <p className="text-secondary text-sm mb-6">
          הדף שחיפשתם לא נמצא
        </p>

        <div className="flex flex-col gap-3">
          <Link href="/" className="btn-primary flex items-center justify-center gap-2">
            <Home className="w-4 h-4" />
            חזרה לדף הבית
          </Link>
          <Link
            href="/admin"
            className="text-sm text-muted hover:text-brand-blue transition-colors"
          >
            כניסה לחשבון DJ
          </Link>
        </div>
      </motion.div>
    </main>
  );
}
