"use client";

import { AlertTriangle, Home, RotateCcw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error("Global app error:", error);

  return (
    <html lang="he" dir="rtl">
      <body className="font-sans antialiased min-h-dvh">
        <main className="min-h-dvh gradient-hero flex items-center justify-center px-4" dir="rtl">
          <div className="glass-card max-w-md w-full p-8 text-center">
            <div
              className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full"
              style={{ background: "linear-gradient(135deg, var(--accent-danger), #e74c3c)" }}
            >
              <AlertTriangle className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-xl font-bold mb-2">משהו לא הסתדר</h1>
            <p className="text-secondary text-sm mb-2">המסך לא הספיק להיטען כמו שצריך.</p>
            <p className="text-xs text-white/55 mb-6 break-words">{error.message || "שגיאה לא מזוהה"}</p>
            <div className="flex flex-col gap-3">
              <button onClick={reset} className="btn-primary flex items-center justify-center gap-2">
                <RotateCcw className="w-4 h-4" />
                נסו שוב
              </button>
              <a href="/home" className="btn-secondary flex items-center justify-center gap-2">
                <Home className="w-4 h-4" />
                חזרה לאתר
              </a>
              <a href="/admin" className="text-sm text-muted hover:text-brand-blue transition-colors">
                כניסה לחשבון DJ
              </a>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
