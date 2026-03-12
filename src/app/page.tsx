"use client";

import { useMemo, useState } from "react";
import { HydrationGuard } from "@/components/ui/HydrationGuard";
import { JourneyApp } from "@/components/journey/JourneyApp";
import { LandingHome } from "@/components/journey/LandingHome";

export default function Home() {
  const [mode, setMode] = useState<"landing" | "new" | "resume">("landing");
  const shouldBypassLanding = useMemo(() => {
    if (typeof window === "undefined") return false;
    const params = new URLSearchParams(window.location.search);
    return Boolean(params.get("token") || params.get("dj") || params.get("resume"));
  }, []);

  return (
    <HydrationGuard>
      {mode !== "landing" || shouldBypassLanding ? (
        <JourneyApp initialMode={mode === "resume" ? "resume" : "new"} />
      ) : (
        <LandingHome onStart={() => setMode("new")} onResume={() => setMode("resume")} />
      )}
    </HydrationGuard>
  );
}
