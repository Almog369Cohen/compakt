"use client";

import { HydrationGuard } from "@/components/ui/HydrationGuard";
import { JourneyApp } from "@/components/journey/JourneyApp";

export default function Home() {
  return (
    <HydrationGuard>
      <JourneyApp />
    </HydrationGuard>
  );
}
