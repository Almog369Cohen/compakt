import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Song, Question, Upsell } from "@/lib/types";
import { defaultSongs } from "@/data/songs";
import { defaultQuestions } from "@/data/questions";
import { defaultUpsells } from "@/data/upsells";
import { supabase } from "@/lib/supabase";

interface AdminStore {
  isAuthenticated: boolean;
  userId: string | null;
  authError: string | null;
  songs: Song[];
  questions: Question[];
  upsells: Upsell[];

  // Auth
  login: (password: string) => boolean;
  loginWithEmail: (email: string, password: string) => Promise<boolean>;
  signUp: (email: string, password: string) => Promise<boolean>;
  loginWithOAuth: (provider: "google" | "apple" | "facebook") => Promise<void>;
  checkSession: () => Promise<void>;
  logout: () => void;

  // Songs
  addSong: (song: Omit<Song, "id" | "sortOrder">) => void;
  updateSong: (id: string, data: Partial<Song>) => void;
  deleteSong: (id: string) => void;
  reorderSongs: (ids: string[]) => void;

  // Questions
  addQuestion: (question: Omit<Question, "id" | "sortOrder">) => void;
  updateQuestion: (id: string, data: Partial<Question>) => void;
  deleteQuestion: (id: string) => void;
  reorderQuestions: (ids: string[]) => void;

  // Upsells
  addUpsell: (upsell: Omit<Upsell, "id" | "sortOrder">) => void;
  updateUpsell: (id: string, data: Partial<Upsell>) => void;
  deleteUpsell: (id: string) => void;

  // DB sync
  loadContentFromDB: (profileId: string) => Promise<void>;
}

const ADMIN_PASSWORD = "compakt2024";

export const useAdminStore = create<AdminStore>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      userId: null,
      authError: null,
      songs: defaultSongs,
      questions: defaultQuestions,
      upsells: defaultUpsells,

      login: (password) => {
        if (password === ADMIN_PASSWORD) {
          set({ isAuthenticated: true, authError: null });
          return true;
        }
        set({ authError: null });
        return false;
      },

      loginWithEmail: async (email, password) => {
        if (!supabase) {
          set({ authError: "Supabase is not configured" });
          return false;
        }
        set({ authError: null });
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          set({ authError: error.message });
          return false;
        }
        set({ isAuthenticated: true, userId: data.user?.id ?? null, authError: null });
        return true;
      },

      loginWithOAuth: async (provider) => {
        if (!supabase) {
          set({ authError: "Supabase is not configured" });
          return;
        }
        set({ authError: null });
        const { error } = await supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo: typeof window !== "undefined" ? `${window.location.origin}/admin` : undefined,
          },
        });
        if (error) {
          set({ authError: error.message });
        }
      },

      signUp: async (email, password) => {
        if (!supabase) {
          set({ authError: "Supabase is not configured" });
          return false;
        }
        set({ authError: null });
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) {
          set({ authError: error.message });
          return false;
        }
        if (data.user) {
          set({ isAuthenticated: true, userId: data.user.id, authError: null });
        }
        return true;
      },

      checkSession: async () => {
        if (!supabase) return;
        const { data } = await supabase.auth.getSession();
        if (data.session?.user) {
          set({ isAuthenticated: true, userId: data.session.user.id });
        }
      },

      logout: () => {
        if (supabase) {
          supabase.auth.signOut().then(() => { });
        }
        set({ isAuthenticated: false, userId: null, authError: null });
      },

      // Songs
      addSong: (song) => {
        const { songs, userId } = get();
        const id = crypto.randomUUID();
        const newSong = { ...song, id, sortOrder: songs.length + 1 };
        set({ songs: [...songs, newSong] });

        if (supabase && userId) {
          supabase.from("profiles").select("id").eq("user_id", userId).single().then(({ data: profile }) => {
            if (!profile) return;
            supabase!.from("songs").insert({
              id, dj_id: profile.id, title: song.title, artist: song.artist,
              cover_url: song.coverUrl || "", preview_url: song.previewUrl || "",
              external_link: song.externalLink || "", category: song.category,
              tags: JSON.stringify(song.tags), energy: song.energy,
              language: song.language, is_safe: song.isSafe, is_active: song.isActive,
              sort_order: songs.length + 1,
            }).then(() => { });
          });
        }
      },

      updateSong: (id, data) => {
        set({
          songs: get().songs.map((s) => (s.id === id ? { ...s, ...data } : s)),
        });

        if (supabase) {
          const row: Record<string, unknown> = {};
          if (data.title !== undefined) row.title = data.title;
          if (data.artist !== undefined) row.artist = data.artist;
          if (data.coverUrl !== undefined) row.cover_url = data.coverUrl;
          if (data.previewUrl !== undefined) row.preview_url = data.previewUrl;
          if (data.externalLink !== undefined) row.external_link = data.externalLink;
          if (data.category !== undefined) row.category = data.category;
          if (data.tags !== undefined) row.tags = JSON.stringify(data.tags);
          if (data.energy !== undefined) row.energy = data.energy;
          if (data.language !== undefined) row.language = data.language;
          if (data.isSafe !== undefined) row.is_safe = data.isSafe;
          if (data.isActive !== undefined) row.is_active = data.isActive;
          if (data.sortOrder !== undefined) row.sort_order = data.sortOrder;
          if (Object.keys(row).length > 0) {
            supabase!.from("songs").update(row).eq("id", id).then(() => { });
          }
        }
      },

      deleteSong: (id) => {
        set({ songs: get().songs.filter((s) => s.id !== id) });
        if (supabase) {
          supabase!.from("songs").delete().eq("id", id).then(() => { });
        }
      },

      reorderSongs: (ids) => {
        const { songs } = get();
        const reordered = ids
          .map((id, i) => {
            const song = songs.find((s) => s.id === id);
            return song ? { ...song, sortOrder: i + 1 } : null;
          })
          .filter(Boolean) as Song[];
        set({ songs: reordered });
      },

      // Questions
      addQuestion: (question) => {
        const { questions, userId } = get();
        const id = `q${Date.now()}`;
        const newQ = { ...question, id, sortOrder: questions.length + 1 };
        set({ questions: [...questions, newQ] });

        if (supabase && userId) {
          supabase.from("profiles").select("id").eq("user_id", userId).single().then(({ data: profile }) => {
            if (!profile) return;
            supabase!.from("questions").insert({
              id, dj_id: profile.id, question_he: question.questionHe,
              question_type: question.questionType, event_type: question.eventType,
              options: JSON.stringify(question.options || []),
              slider_min: question.sliderMin, slider_max: question.sliderMax,
              slider_labels: question.sliderLabels ? JSON.stringify(question.sliderLabels) : null,
              is_active: question.isActive, sort_order: questions.length + 1,
            }).then(() => { });
          });
        }
      },

      updateQuestion: (id, data) => {
        set({
          questions: get().questions.map((q) =>
            q.id === id ? { ...q, ...data } : q
          ),
        });

        if (supabase) {
          const row: Record<string, unknown> = {};
          if (data.questionHe !== undefined) row.question_he = data.questionHe;
          if (data.questionType !== undefined) row.question_type = data.questionType;
          if (data.eventType !== undefined) row.event_type = data.eventType;
          if (data.options !== undefined) row.options = JSON.stringify(data.options);
          if (data.sliderMin !== undefined) row.slider_min = data.sliderMin;
          if (data.sliderMax !== undefined) row.slider_max = data.sliderMax;
          if (data.sliderLabels !== undefined) row.slider_labels = JSON.stringify(data.sliderLabels);
          if (data.isActive !== undefined) row.is_active = data.isActive;
          if (data.sortOrder !== undefined) row.sort_order = data.sortOrder;
          if (Object.keys(row).length > 0) {
            supabase!.from("questions").update(row).eq("id", id).then(() => { });
          }
        }
      },

      deleteQuestion: (id) => {
        set({ questions: get().questions.filter((q) => q.id !== id) });
        if (supabase) {
          supabase!.from("questions").delete().eq("id", id).then(() => { });
        }
      },

      reorderQuestions: (ids) => {
        const { questions } = get();
        const reordered = ids
          .map((id, i) => {
            const q = questions.find((q) => q.id === id);
            return q ? { ...q, sortOrder: i + 1 } : null;
          })
          .filter(Boolean) as Question[];
        set({ questions: reordered });
      },

      // Upsells
      addUpsell: (upsell) => {
        const { upsells, userId } = get();
        const id = crypto.randomUUID();
        const newUpsell = { ...upsell, id, sortOrder: upsells.length + 1 };
        set({ upsells: [...upsells, newUpsell] });

        if (supabase && userId) {
          supabase.from("profiles").select("id").eq("user_id", userId).single().then(({ data: profile }) => {
            if (!profile) return;
            supabase!.from("upsells").insert({
              id, dj_id: profile.id, title_he: upsell.titleHe,
              description_he: upsell.descriptionHe, price_hint: upsell.priceHint || "",
              cta_text_he: upsell.ctaTextHe, placement: upsell.placement,
              is_active: upsell.isActive, sort_order: upsells.length + 1,
            }).then(() => { });
          });
        }
      },

      updateUpsell: (id, data) => {
        set({
          upsells: get().upsells.map((u) =>
            u.id === id ? { ...u, ...data } : u
          ),
        });

        if (supabase) {
          const row: Record<string, unknown> = {};
          if (data.titleHe !== undefined) row.title_he = data.titleHe;
          if (data.descriptionHe !== undefined) row.description_he = data.descriptionHe;
          if (data.priceHint !== undefined) row.price_hint = data.priceHint;
          if (data.ctaTextHe !== undefined) row.cta_text_he = data.ctaTextHe;
          if (data.placement !== undefined) row.placement = data.placement;
          if (data.isActive !== undefined) row.is_active = data.isActive;
          if (data.sortOrder !== undefined) row.sort_order = data.sortOrder;
          if (Object.keys(row).length > 0) {
            supabase.from("upsells").update(row).eq("id", id).then(() => { });
          }
        }
      },

      deleteUpsell: (id) => {
        set({ upsells: get().upsells.filter((u) => u.id !== id) });
        if (supabase) {
          supabase.from("upsells").delete().eq("id", id).then(() => { });
        }
      },

      // Load all DJ content from Supabase
      // CRITICAL: Always set state from DB result, even if empty.
      // Never keep mock/localStorage data when DB returns 0 rows.
      loadContentFromDB: async (profileId: string) => {
        if (!supabase) return;

        const [songsRes, questionsRes, upsellsRes] = await Promise.all([
          supabase.from("songs").select("*").eq("dj_id", profileId).order("sort_order"),
          supabase.from("questions").select("*").eq("dj_id", profileId).order("sort_order"),
          supabase.from("upsells").select("*").eq("dj_id", profileId).order("sort_order"),
        ]);

        // Map DB rows to app types (empty array if no data)
        const dbSongs: Song[] = (songsRes.data || []).map((s) => ({
          id: s.id,
          title: s.title,
          artist: s.artist,
          coverUrl: s.cover_url ?? "",
          previewUrl: s.preview_url ?? "",
          externalLink: s.external_link ?? "",
          category: s.category ?? "dancing",
          tags: Array.isArray(s.tags) ? s.tags : (typeof s.tags === "string" ? JSON.parse(s.tags) : []),
          energy: s.energy ?? 3,
          language: s.language ?? "hebrew",
          isSafe: s.is_safe ?? true,
          isActive: s.is_active ?? true,
          sortOrder: s.sort_order ?? 0,
        })) as Song[];

        const dbQuestions: Question[] = (questionsRes.data || []).map((q) => ({
          id: q.id,
          questionHe: q.question_he,
          questionType: q.question_type ?? "single_select",
          eventType: q.event_type ?? "wedding",
          options: Array.isArray(q.options) ? q.options : (typeof q.options === "string" ? JSON.parse(q.options) : []),
          sliderMin: q.slider_min,
          sliderMax: q.slider_max,
          sliderLabels: q.slider_labels ? (Array.isArray(q.slider_labels) ? q.slider_labels : JSON.parse(q.slider_labels)) : undefined,
          isActive: q.is_active ?? true,
          sortOrder: q.sort_order ?? 0,
        })) as Question[];

        const dbUpsells: Upsell[] = (upsellsRes.data || []).map((u) => ({
          id: u.id,
          titleHe: u.title_he,
          descriptionHe: u.description_he ?? "",
          priceHint: u.price_hint ?? "",
          ctaTextHe: u.cta_text_he ?? "",
          placement: u.placement ?? "stage_4",
          isActive: u.is_active ?? true,
          sortOrder: u.sort_order ?? 0,
        })) as Upsell[];

        // Always overwrite local state with DB truth
        set({ songs: dbSongs, questions: dbQuestions, upsells: dbUpsells });

        // If DB is empty, auto-bootstrap defaults
        const needsBootstrap = dbSongs.length === 0 || dbQuestions.length === 0;
        if (needsBootstrap) {
          console.warn("[DB Health] Empty content detected for DJ — triggering bootstrap", {
            songs: dbSongs.length,
            questions: dbQuestions.length,
            upsells: dbUpsells.length,
          });

          try {
            const res = await fetch("/api/admin/ensure-defaults", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ profileId }),
            });
            const result = await res.json();

            if (result.seeded && result.seeded.length > 0) {
              console.log("[DB Health] Bootstrap seeded:", result.seeded);
              // Reload from DB after seeding
              const [s2, q2, u2] = await Promise.all([
                supabase.from("songs").select("*").eq("dj_id", profileId).order("sort_order"),
                supabase.from("questions").select("*").eq("dj_id", profileId).order("sort_order"),
                supabase.from("upsells").select("*").eq("dj_id", profileId).order("sort_order"),
              ]);
              if (s2.data && s2.data.length > 0) {
                set({
                  songs: s2.data.map((s) => ({
                    id: s.id, title: s.title, artist: s.artist,
                    coverUrl: s.cover_url ?? "", previewUrl: s.preview_url ?? "",
                    externalLink: s.external_link ?? "", category: s.category ?? "dancing",
                    tags: Array.isArray(s.tags) ? s.tags : [], energy: s.energy ?? 3,
                    language: s.language ?? "hebrew", isSafe: s.is_safe ?? true,
                    isActive: s.is_active ?? true, sortOrder: s.sort_order ?? 0,
                  })) as Song[],
                });
              }
              if (q2.data && q2.data.length > 0) {
                set({
                  questions: q2.data.map((q) => ({
                    id: q.id, questionHe: q.question_he,
                    questionType: q.question_type ?? "single_select",
                    eventType: q.event_type ?? "wedding",
                    options: Array.isArray(q.options) ? q.options : [],
                    sliderMin: q.slider_min, sliderMax: q.slider_max,
                    sliderLabels: q.slider_labels ? (Array.isArray(q.slider_labels) ? q.slider_labels : []) : undefined,
                    isActive: q.is_active ?? true, sortOrder: q.sort_order ?? 0,
                  })) as Question[],
                });
              }
              if (u2.data && u2.data.length > 0) {
                set({
                  upsells: u2.data.map((u) => ({
                    id: u.id, titleHe: u.title_he, descriptionHe: u.description_he ?? "",
                    priceHint: u.price_hint ?? "", ctaTextHe: u.cta_text_he ?? "",
                    placement: u.placement ?? "stage_4", isActive: u.is_active ?? true,
                    sortOrder: u.sort_order ?? 0,
                  })) as Upsell[],
                });
              }
            }
          } catch (e) {
            console.error("[DB Health] Bootstrap failed:", e);
          }
        }
      },
    }),
    {
      name: "compakt-admin",
      partialize: (state) => ({
        songs: state.songs,
        questions: state.questions,
        upsells: state.upsells,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isAuthenticated = false;

          const q1 = state.questions.find((q) => q.id === "q1");
          if (q1) {
            q1.questionType = "multi_select";

            const desiredOptions = [
              { label: "חפלה - נסרין המוזמנת הראשית 🪘", value: "party" },
              { label: "אפטר של החיים 😎", value: "after" },
              { label: "מיינסטרים של מיאמי 🏖️🍹", value: "miami_mainstream" },
              { label: "היפ הופ שחורה / R&B (בשחורהה) 🎤�", value: "black_rb" },
              { label: "80s funky שלמה ארצי והחברים 🪩", value: "shlomo_funky_80s" },
              { label: "שלב את הכל 🔀", value: "mix" },
            ];

            const valueMap: Record<string, string> = {
              nostalgic: "party",
              elegant: "miami_mainstream",
              classic_israeli: "shlomo_funky_80s",
            };

            const existing = Array.isArray(q1.options) ? q1.options : [];
            const normalizedExisting = existing
              .map((o) => ({
                ...o,
                value: valueMap[o.value] ?? o.value,
              }))
              .filter((o) => desiredOptions.some((d) => d.value === o.value));

            const merged = desiredOptions.map((d) => {
              const found = normalizedExisting.find((o) => o.value === d.value);
              return found ? { ...found, label: d.label, value: d.value } : d;
            });

            q1.options = merged;
          }

          const q5 = state.questions.find((q) => q.id === "q5");
          if (q5 && q5.questionType === "slider") {
            q5.sliderLabels = ["רגוע 🧘", "זורם 🌊", "מקפיץ ⚡", "שיאים 🔥", "פסטיבל 💥"];
          }
        }
      },
    }
  )
);
