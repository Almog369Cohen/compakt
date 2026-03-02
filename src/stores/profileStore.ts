import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase } from "@/lib/supabase";

export type ProfileState = {
  businessName: string;
  tagline: string;
  bio: string;
  accentColor: string;
  djSlug: string;
  instagramUrl: string;
  tiktokUrl: string;
  soundcloudUrl: string;
  spotifyUrl: string;
  youtubeUrl: string;
  websiteUrl: string;
  whatsappNumber: string;
  coverUrl: string;
  logoUrl: string;
  customLinks: { label: string; url: string }[];
  galleryPhotos: string[];
  reviews: { name: string; text: string; rating: number }[];
};

interface ProfileStore {
  profile: ProfileState;
  profileId: string | null;
  loading: boolean;
  setProfile: (patch: Partial<ProfileState>) => void;
  resetProfile: () => void;
  loadProfileFromDB: (userId: string) => Promise<void>;
  saveProfileToDB: (userId: string) => Promise<void>;
  loadProfileBySlug: (slug: string) => Promise<ProfileState | null>;
}

const DEFAULT_PROFILE: ProfileState = {
  businessName: "",
  tagline: "",
  bio: "",
  accentColor: "#059cc0",
  djSlug: "",
  instagramUrl: "",
  tiktokUrl: "",
  soundcloudUrl: "",
  spotifyUrl: "",
  youtubeUrl: "",
  websiteUrl: "",
  whatsappNumber: "",
  coverUrl: "",
  logoUrl: "",
  customLinks: [],
  galleryPhotos: [],
  reviews: [],
};

export const useProfileStore = create<ProfileStore>()(
  persist(
    (set, get) => ({
      profile: DEFAULT_PROFILE,
      profileId: null,
      loading: false,
      setProfile: (patch) => set({ profile: { ...get().profile, ...patch } }),
      resetProfile: () => set({ profile: DEFAULT_PROFILE, profileId: null }),

      loadProfileFromDB: async (userId: string) => {
        if (!supabase) return;
        set({ loading: true });
        try {
          const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("user_id", userId)
            .single();

          if (error || !data) {
            set({ loading: false });
            return;
          }

          set({
            profileId: data.id,
            profile: {
              businessName: data.business_name ?? "",
              tagline: data.tagline ?? "",
              bio: data.bio ?? "",
              accentColor: data.accent_color ?? "#059cc0",
              djSlug: data.dj_slug ?? "",
              instagramUrl: data.instagram_url ?? "",
              tiktokUrl: data.tiktok_url ?? "",
              soundcloudUrl: data.soundcloud_url ?? "",
              spotifyUrl: data.spotify_url ?? "",
              youtubeUrl: data.youtube_url ?? "",
              websiteUrl: data.website_url ?? "",
              whatsappNumber: data.whatsapp_number ?? "",
              coverUrl: data.cover_url ?? "",
              logoUrl: data.logo_url ?? "",
              customLinks: Array.isArray(data.custom_links) ? data.custom_links : [],
              galleryPhotos: Array.isArray(data.gallery_photos) ? data.gallery_photos : [],
              reviews: Array.isArray(data.reviews) ? data.reviews : [],
            },
            loading: false,
          });
        } catch {
          set({ loading: false });
        }
      },

      saveProfileToDB: async (userId: string) => {
        const { profile } = get();
        const row = {
          user_id: userId,
          business_name: profile.businessName,
          tagline: profile.tagline,
          bio: profile.bio,
          accent_color: profile.accentColor,
          dj_slug: profile.djSlug || null,
          instagram_url: profile.instagramUrl,
          tiktok_url: profile.tiktokUrl,
          soundcloud_url: profile.soundcloudUrl,
          spotify_url: profile.spotifyUrl,
          youtube_url: profile.youtubeUrl,
          website_url: profile.websiteUrl,
          whatsapp_number: profile.whatsappNumber,
          cover_url: profile.coverUrl,
          logo_url: profile.logoUrl,
          custom_links: profile.customLinks,
          gallery_photos: profile.galleryPhotos,
          reviews: profile.reviews,
        };

        // Use server-side API route (bypasses RLS with service role)
        const res = await fetch("/api/admin/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, profileId: get().profileId, row }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "שגיאה בשמירת פרופיל");
        if (data.profileId) set({ profileId: data.profileId });
      },

      loadProfileBySlug: async (slug: string): Promise<ProfileState | null> => {
        if (!supabase) return null;
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("dj_slug", slug)
          .single();

        if (error || !data) return null;

        return {
          businessName: data.business_name ?? "",
          tagline: data.tagline ?? "",
          bio: data.bio ?? "",
          accentColor: data.accent_color ?? "#059cc0",
          djSlug: data.dj_slug ?? "",
          instagramUrl: data.instagram_url ?? "",
          tiktokUrl: data.tiktok_url ?? "",
          soundcloudUrl: data.soundcloud_url ?? "",
          spotifyUrl: data.spotify_url ?? "",
          youtubeUrl: data.youtube_url ?? "",
          websiteUrl: data.website_url ?? "",
          whatsappNumber: data.whatsapp_number ?? "",
          coverUrl: data.cover_url ?? "",
          logoUrl: data.logo_url ?? "",
          customLinks: Array.isArray(data.custom_links) ? data.custom_links : [],
          galleryPhotos: Array.isArray(data.gallery_photos) ? data.gallery_photos : [],
          reviews: Array.isArray(data.reviews) ? data.reviews : [],
        };
      },
    }),
    {
      name: "compakt-profile",
      partialize: (state) => ({ profile: state.profile, profileId: state.profileId }),
    }
  )
);
