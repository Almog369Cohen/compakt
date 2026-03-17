"use client";

import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { Hero } from "@/components/marketing/Hero";
import { Problem } from "@/components/marketing/Problem";
import { Solution } from "@/components/marketing/Solution";
import { Features } from "@/components/marketing/Features";
import { PricingPreview } from "@/components/marketing/PricingPreview";
import { FinalCTA } from "@/components/marketing/FinalCTA";

export default function MarketingHome() {
  return (
    <div className="min-h-screen bg-white">
      <MarketingNav />
      <main>
        <Hero />
        <Problem />
        <Solution />
        <Features />
        <PricingPreview />
        <FinalCTA />
      </main>
      <MarketingFooter />
    </div>
  );
}
