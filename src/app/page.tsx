"use client";

import { useEffect, useState } from "react";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { JourneyApp } from "@/components/journey/JourneyApp";
import { LandingHome } from "@/components/journey/LandingHome";

export default function Home() {
  const [mode, setMode] = useState<"landing" | "new" | "resume">("landing");
  const [shouldBypassLanding, setShouldBypassLanding] = useState(false);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      setShouldBypassLanding(Boolean(params.get("token") || params.get("dj") || params.get("resume")));
    } catch {
      setShouldBypassLanding(false);
    }
  }, []);

  return (
    <ErrorBoundary fallbackMessage="אירעה שגיאה בטעינת המסך. נסו לרענן או לחזור שוב.">
      {mode !== "landing" || shouldBypassLanding ? (
        <JourneyApp initialMode={mode === "resume" ? "resume" : "new"} />
      ) : (
        <LandingHome onStart={() => setMode("new")} onResume={() => setMode("resume")} />
      )}
    </ErrorBoundary>
  );
}
