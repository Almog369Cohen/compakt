"use client";

import { useEffect, useState } from "react";

export function HydrationGuard({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  if (!hydrated) {
    return (
      <main
        className="flex min-h-dvh items-center justify-center px-6"
        style={{
          background: "linear-gradient(135deg, #0a0a0f 0%, #0d1b2a 50%, #0a0a0f 100%)",
          color: "#ffffff",
        }}
      >
        <div
          className="w-full max-w-sm p-6 text-center"
          style={{
            borderRadius: "24px",
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(14,18,28,0.72)",
            boxShadow: "0 20px 48px rgba(0,0,0,0.3)",
            backdropFilter: "blur(18px)",
          }}
        >
          <div
            className="mx-auto h-10 w-10 rounded-full"
            style={{
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(255,255,255,0.06)",
            }}
          />
          <p className="mt-4 text-sm" style={{ color: "rgba(255,255,255,0.78)" }}>
            טוען את החוויה...
          </p>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
