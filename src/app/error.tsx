"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

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
          style={{ background: "linear-gradient(135deg, var(--accent-danger), #e74c3c)" }}
        >
          <AlertTriangle className="w-8 h-8 text-white" />
        </motion.div>

        <h1 className="text-xl font-bold mb-2">משהו לא הסתדר</h1>
        <p className="text-secondary text-sm mb-6">
          קרה משהו לא צפוי. אפשר לנסות שוב או לחזור הביתה.
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={reset}
            className="btn-primary flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            נסו שוב
          </button>
          <a
            href="/"
            className="btn-secondary flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            חזרה לדף הבית
          </a>
        </div>
      </motion.div>
    </main>
  );
}
