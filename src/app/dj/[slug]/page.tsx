"use client";

import { useParams } from "next/navigation";
import { useProfileStore } from "@/stores/profileStore";
import { motion } from "framer-motion";
import { Music, Headphones } from "lucide-react";
import { useEffect, useState } from "react";
import { DJProfilePreview } from "@/components/dj/DJProfilePreview";
import type { ProfileState } from "@/stores/profileStore";

export default function DJPublicPage() {
  const params = useParams();
  const slug = params.slug as string;
  const storeProfile = useProfileStore((s) => s.profile);
  const loadProfileBySlug = useProfileStore((s) => s.loadProfileBySlug);
  const [profile, setProfile] = useState<ProfileState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      // Try Supabase first
      const dbProfile = await loadProfileBySlug(slug);
      if (!cancelled && dbProfile && dbProfile.businessName) {
        setProfile(dbProfile);
        setLoading(false);
        return;
      }

      // Fallback to localStorage
      if (!cancelled) {
        const isMatch = storeProfile.djSlug === slug;
        setProfile(isMatch ? storeProfile : null);
        setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [slug, storeProfile, loadProfileBySlug]);

  if (loading) {
    return (
      <div className="min-h-dvh gradient-hero flex items-center justify-center">
        <div className="animate-pulse">
          <Headphones className="w-12 h-12 text-brand-blue" />
        </div>
      </div>
    );
  }

  if (!profile || !profile.businessName) {
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
          <a href="/" className="btn-primary inline-block text-sm">
            חזרה לדף הבית
          </a>
        </motion.div>
      </div>
    );
  }

  return <DJProfilePreview profile={profile} mode="public" slug={slug} />;
}
