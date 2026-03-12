import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  DEFAULT_SONG_CATEGORY_LABELS,
  normalizeSongCategoryLabels,
  type SongCategoryLabels,
} from "@/lib/songCategories";

export type ProfileState = {
  businessName: string;
  tagline: string;
  bio: string;
  accentColor: string;
  brandColors: {
    primary: string;
    secondary: string;
    accent: string;
    surface: string;
  };
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
  songCategoryLabels: SongCategoryLabels;
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
  loadProfileRecordBySlug: (slug: string) => Promise<{ id: string; profile: ProfileState } | null>;
}

const DEFAULT_BRAND_COLORS = {
  primary: "#059cc0",
  secondary: "#03b28c",
  accent: "#8b5cf6",
  surface: "#1f2937",
};

function parseBrandColors(value: unknown): ProfileState["brandColors"] {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return DEFAULT_BRAND_COLORS;
    if (trimmed.startsWith("{")) {
      try {
        const parsed = JSON.parse(trimmed) as Partial<ProfileState["brandColors"]>;
        return {
          primary: typeof parsed.primary === "string" ? parsed.primary : DEFAULT_BRAND_COLORS.primary,
          secondary: typeof parsed.secondary === "string" ? parsed.secondary : DEFAULT_BRAND_COLORS.secondary,
          accent: typeof parsed.accent === "string" ? parsed.accent : DEFAULT_BRAND_COLORS.accent,
          surface: typeof parsed.surface === "string" ? parsed.surface : DEFAULT_BRAND_COLORS.surface,
        };
      } catch {
        return DEFAULT_BRAND_COLORS;
      }
    }
    return {
      ...DEFAULT_BRAND_COLORS,
      primary: trimmed,
      accent: trimmed,
    };
  }

  if (value && typeof value === "object" && !Array.isArray(value)) {
    const parsed = value as Partial<ProfileState["brandColors"]>;
    return {
      primary: typeof parsed.primary === "string" ? parsed.primary : DEFAULT_BRAND_COLORS.primary,
      secondary: typeof parsed.secondary === "string" ? parsed.secondary : DEFAULT_BRAND_COLORS.secondary,
      accent: typeof parsed.accent === "string" ? parsed.accent : DEFAULT_BRAND_COLORS.accent,
      surface: typeof parsed.surface === "string" ? parsed.surface : DEFAULT_BRAND_COLORS.surface,
    };
  }

  return DEFAULT_BRAND_COLORS;
}

function parseSongCategoryLabels(value: unknown): SongCategoryLabels {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed.startsWith("{")) return DEFAULT_SONG_CATEGORY_LABELS;
    try {
      const parsed = JSON.parse(trimmed) as { songCategoryLabels?: unknown };
      return normalizeSongCategoryLabels(parsed.songCategoryLabels);
    } catch {
      return DEFAULT_SONG_CATEGORY_LABELS;
    }
  }

  if (value && typeof value === "object" && !Array.isArray(value)) {
    const parsed = value as { songCategoryLabels?: unknown };
    return normalizeSongCategoryLabels(parsed.songCategoryLabels);
  }

  return DEFAULT_SONG_CATEGORY_LABELS;
}

function serializeBrandColors(colors: ProfileState["brandColors"], songCategoryLabels: SongCategoryLabels): string {
  return JSON.stringify({
    primary: colors.primary || DEFAULT_BRAND_COLORS.primary,
    secondary: colors.secondary || DEFAULT_BRAND_COLORS.secondary,
    accent: colors.accent || DEFAULT_BRAND_COLORS.accent,
    surface: colors.surface || DEFAULT_BRAND_COLORS.surface,
    songCategoryLabels: normalizeSongCategoryLabels(songCategoryLabels),
  });
}

const DEFAULT_PROFILE: ProfileState = {
  businessName: "",
  tagline: "",
  bio: "",
  accentColor: "#059cc0",
  brandColors: DEFAULT_BRAND_COLORS,
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
  songCategoryLabels: DEFAULT_SONG_CATEGORY_LABELS,
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
      setProfile: (patch) => set((state) => {
        const nextProfile = { ...state.profile, ...patch };
        if (patch.brandColors) {
          nextProfile.brandColors = patch.brandColors;
          nextProfile.accentColor = patch.brandColors.primary;
        } else if (typeof patch.accentColor === "string") {
          nextProfile.brandColors = {
            ...state.profile.brandColors,
            primary: patch.accentColor,
            accent: patch.accentColor,
          };
        }
        return { profile: nextProfile };
      }),
      resetProfile: () => set({ profile: DEFAULT_PROFILE, profileId: null }),

      loadProfileFromDB: async () => {
        set({ loading: true });
        try {
          const response = await fetch("/api/admin/profile", {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          });
          const result = await response.json();
          const data = result.data;

          if (!response.ok || !data) {
            set({ loading: false });
            return;
          }

          const brandColors = parseBrandColors(data.accent_color);
          const songCategoryLabels = parseSongCategoryLabels(data.accent_color);

          set({
            profileId: data.id,
            profile: {
              businessName: data.business_name ?? "",
              tagline: data.tagline ?? "",
              bio: data.bio ?? "",
              accentColor: brandColors.primary,
              brandColors,
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
              songCategoryLabels,
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

      saveProfileToDB: async () => {
        const { profile } = get();
        const row = {
          business_name: profile.businessName,
          tagline: profile.tagline,
          bio: profile.bio,
          accent_color: serializeBrandColors(profile.brandColors, profile.songCategoryLabels),
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
          body: JSON.stringify({ row }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "שגיאה בשמירת פרופיל");
        if (data.profileId) set({ profileId: data.profileId });
      },

      loadProfileBySlug: async (slug: string): Promise<ProfileState | null> => {
        const result = await get().loadProfileRecordBySlug(slug);
        return result?.profile ?? null;
      },

      loadProfileRecordBySlug: async (slug: string): Promise<{ id: string; profile: ProfileState } | null> => {
        const normalizedSlug = slug.trim().toLowerCase();
        if (!normalizedSlug) return null;

        const response = await fetch(`/api/public/dj/${encodeURIComponent(normalizedSlug)}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) return null;

        const result = await response.json();
        const data = result.data;
        if (!data) return null;

        const brandColors = parseBrandColors(data.accent_color);
        const songCategoryLabels = parseSongCategoryLabels(data.accent_color);

        return {
          id: data.id,
          profile: {
            businessName: data.business_name ?? "",
            tagline: data.tagline ?? "",
            bio: data.bio ?? "",
            accentColor: brandColors.primary,
            brandColors,
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
            songCategoryLabels,
            customLinks: Array.isArray(data.custom_links) ? data.custom_links : [],
            galleryPhotos: Array.isArray(data.gallery_photos) ? data.gallery_photos : [],
            reviews: Array.isArray(data.reviews) ? data.reviews : [],
          },
        };
      },
    }),
    {
      name: "compakt-profile",
      partialize: (state) => ({ profile: state.profile, profileId: state.profileId }),
    }
  )
);
