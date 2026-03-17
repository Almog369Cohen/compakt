"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useProfileStore } from "@/stores/profileStore";
import { motion } from "framer-motion";
import { Music, Headphones } from "lucide-react";
import { useEffect, useState } from "react";
import { DJProfilePreview } from "@/components/dj/DJProfilePreview";
import type { ProfileState } from "@/stores/profileStore";
import { JourneyApp } from "@/components/journey/JourneyApp";
import { HydrationGuard } from "@/components/ui/HydrationGuard";

export default function DJPublicPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const token = searchParams.get("token");
  const resume = searchParams.get("resume");
  const start = searchParams.get("start");
  const loadProfileRecordBySlug = useProfileStore((s) => s.loadProfileRecordBySlug);
  const [profile, setProfile] = useState<ProfileState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const dbProfileRecord = await loadProfileRecordBySlug(slug);
      const dbProfile = dbProfileRecord?.profile ?? null;
      if (!cancelled && dbProfile) {
        try {
          sessionStorage.setItem("compakt_dj_slug", slug);
          sessionStorage.setItem("compakt_dj_name", dbProfile.businessName || slug);
          if (dbProfileRecord?.id) {
            sessionStorage.setItem("compakt_dj_profile_id", dbProfileRecord.id);
          }
        } catch { }
        setProfile(dbProfile);
        setLoading(false);
        return;
      }

      if (!cancelled) {
        setProfile(null);
        setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [slug, loadProfileRecordBySlug]);

  if (loading) {
    return (
      <div className="min-h-dvh gradient-hero flex items-center justify-center">
        <div className="animate-pulse">
          <Headphones className="w-12 h-12 text-brand-blue" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-dvh gradient-hero flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-8 text-center max-w-sm"
        >
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
            style={{ background: "linear-gradient(135deg, #059cc0, #03b28c)" }}
          >
            <Music className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-xl font-bold mb-2">הדף לא נמצא</h1>
          <p className="text-secondary text-sm mb-4">
            ה-DJ שחיפשתם עדיין לא הגדיר את הפרופיל שלו
          </p>
          <a href="/home" className="btn-primary inline-block text-sm">
            חזרה לאתר
          </a>
        </motion.div>
      </div>
    );
  }

  if (token) {
    return (
      <HydrationGuard>
        <JourneyApp
          initialToken={token}
          initialDjSlug={slug}
          initialDjName={profile.businessName || slug}
        />
      </HydrationGuard>
    );
  }

  if (start) {
    return (
      <HydrationGuard>
        <JourneyApp
          initialDjSlug={slug}
          initialDjName={profile.businessName || slug}
          initialMode="new"
        />
      </HydrationGuard>
    );
  }

  if (resume) {
    return (
      <HydrationGuard>
        <JourneyApp
          initialDjSlug={slug}
          initialDjName={profile.businessName || slug}
          initialMode="resume"
        />
      </HydrationGuard>
    );
  }

  return <DJProfilePreview profile={profile} mode="public" slug={slug} />;
}
