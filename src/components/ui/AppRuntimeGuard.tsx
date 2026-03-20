"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Home, RotateCcw } from "lucide-react";

type RuntimeFailure = {
  message: string;
};

function getErrorMessage(value: unknown) {
  if (value instanceof Error && value.message) return value.message;
  if (typeof value === "string" && value.trim()) return value.trim();
  return "אירעה שגיאת ריצה לא צפויה.";
}

function isChunkLoadFailure(value: unknown) {
  const message = getErrorMessage(value).toLowerCase();
  return (
    message.includes("loading chunk") ||
    message.includes("chunkloaderror") ||
    message.includes("failed to fetch rsc payload")
  );
}

function recoverFromChunkFailure() {
  if (typeof window === "undefined") return false;

  const reloadKey = `compakt-chunk-reload:${window.location.pathname}`;

  if (window.sessionStorage.getItem(reloadKey) === "1") {
    window.sessionStorage.removeItem(reloadKey);
    return false;
  }

  window.sessionStorage.setItem(reloadKey, "1");
  window.location.reload();
  return true;
}

export function AppRuntimeGuard({ children }: { children: React.ReactNode }) {
  const [runtimeFailure, setRuntimeFailure] = useState<RuntimeFailure | null>(null);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error("🔥 Runtime Error:", {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error,
        stack: event.error?.stack
      });

      if (isChunkLoadFailure(event.error || event.message) && recoverFromChunkFailure()) {
        return;
      }
      setRuntimeFailure({ message: getErrorMessage(event.error || event.message) });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error("🔥 Unhandled Promise Rejection:", {
        reason: event.reason,
        stack: event.reason?.stack
      });

      if (isChunkLoadFailure(event.reason) && recoverFromChunkFailure()) {
        return;
      }
      setRuntimeFailure({ message: getErrorMessage(event.reason) });
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, []);

  const failureMessage = useMemo(() => runtimeFailure?.message || "", [runtimeFailure]);

  if (runtimeFailure) {
    return (
      <main className="min-h-dvh gradient-hero flex items-center justify-center px-4" dir="rtl">
        <div className="glass-card max-w-md w-full p-8 text-center">
          <div
            className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full"
            style={{ background: "linear-gradient(135deg, var(--accent-danger), #e74c3c)" }}
          >
            <AlertTriangle className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-xl font-bold mb-2">המסך לא נטען כמו שצריך</h1>
          <p className="text-secondary text-sm mb-2">זיהינו שגיאת ריצה בצד הלקוח.</p>
          <p className="text-xs text-white/55 mb-6 break-words">{failureMessage}</p>
          <div className="text-xs text-white/40 mb-4 text-right">
            <p>💡 פתרונות אפשריים:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>רענן את הדף (Ctrl+R / Cmd+R)</li>
              <li>בדוק את חיבור האינטרנט</li>
              <li>נסה לפתוח בדפדפן אחר</li>
              <li>נקה את ה-cache של הדפדפן</li>
            </ul>
          </div>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => window.location.reload()}
              className="btn-primary flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              נסו לטעון מחדש
            </button>
            <a href="/" className="btn-secondary flex items-center justify-center gap-2">
              <Home className="w-4 h-4" />
              חזרה לדף הבית
            </a>
          </div>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
