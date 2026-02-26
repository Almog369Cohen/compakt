import { create } from "zustand";
import { persist } from "zustand/middleware";

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
};

interface ProfileStore {
  profile: ProfileState;
  setProfile: (patch: Partial<ProfileState>) => void;
  resetProfile: () => void;
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
};

export const useProfileStore = create<ProfileStore>()(
  persist(
    (set, get) => ({
      profile: DEFAULT_PROFILE,
      setProfile: (patch) => set({ profile: { ...get().profile, ...patch } }),
      resetProfile: () => set({ profile: DEFAULT_PROFILE }),
    }),
    {
      name: "compakt-profile",
    }
  )
);
