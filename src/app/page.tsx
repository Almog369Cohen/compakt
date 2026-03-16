"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { JourneyApp } from "@/components/journey/JourneyApp";
import { LandingHome } from "@/components/journey/LandingHome";

function HomeContent() {
  const searchParams = useSearchParams();
  const [showJourney, setShowJourney] = useState(false);

  // Check if we should skip landing and go straight to journey
  const token = searchParams.get("token");
  const dj = searchParams.get("dj");
  const resume = searchParams.get("resume");

  useEffect(() => {
    // If there's a token, dj param, or resume param, skip landing
    if (token || dj || resume) {
      setShowJourney(true);
    }
  }, [token, dj, resume]);

  const handleStart = () => {
    setShowJourney(true);
  };

  const handleResume = () => {
    setShowJourney(true);
  };

  if (showJourney || token || dj || resume) {
    return <JourneyApp />;
  }

  return <LandingHome onStart={handleStart} onResume={handleResume} />;
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          <p className="mt-4 text-white/60">טוען...</p>
        </div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
