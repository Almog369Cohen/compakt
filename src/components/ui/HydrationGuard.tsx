"use client";

import { useEffect, useState } from "react";

export function HydrationGuard({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  if (!hydrated) {
    return (
      <div className="min-h-dvh gradient-hero flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 animate-pulse"
            style={{ background: "linear-gradient(135deg, #059cc0, #03b28c)" }}
          >
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
              />
            </svg>
          </div>
          <p className="text-sm text-secondary">...Compakt</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
