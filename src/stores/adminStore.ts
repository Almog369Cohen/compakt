import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Song, Question, Upsell } from "@/lib/types";
import { defaultSongs } from "@/data/songs";
import { defaultQuestions } from "@/data/questions";
import { defaultUpsells } from "@/data/upsells";
import { supabase } from "@/lib/supabase";

function normalizeSupabaseAuthError(message: string): string {
  const normalized = message.trim().toLowerCase();

  if (
    normalized.includes("password should") ||
    normalized.includes("password must") ||
    normalized.includes("weak password") ||
    normalized.includes("password is too weak")
  ) {
    return "הסיסמה חלשה מדי. בחרו לפחות 8 תווים עם אות באנגלית ומספר.";
  }

  if (normalized.includes("user already registered")) {
    return "קיים כבר חשבון עם האימייל הזה. נסו להתחבר או לאפס סיסמה.";
  }

  if (normalized.includes("invalid login credentials")) {
    return "האימייל או הסיסמה שגויים.";
  }

  if (normalized.includes("email not confirmed")) {
    return "האימייל עדיין לא אומת. בדקו את תיבת הדואר ואז נסו שוב.";
  }

  if (normalized.includes("unable to validate email address")) {
    return "כתובת האימייל לא תקינה.";
  }

  return message;
}

interface AdminStore {
  isAuthenticated: boolean;
  userId: string | null;
  userEmail: string | null;
  authError: string | null;
  songs: Song[];
  questions: Question[];
  upsells: Upsell[];

  // Auth
  login: (email: string, password: string) => boolean;
  loginWithEmail: (email: string, password: string) => Promise<boolean>;
  signUp: (email: string, password: string) => Promise<"authenticated" | "pending_confirmation" | "error">;
  loginWithOAuth: (provider: "google" | "apple" | "facebook") => Promise<void>;
  checkSession: () => Promise<void>;
  logout: () => void;
  setAuthState: (input: { isAuthenticated: boolean; userId?: string | null; userEmail?: string | null; authError?: string | null }) => void;
  resetAuthState: () => void;

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
// LEGACY_LOGIN_ALLOWED env check removed — bypass login always available

async function resolveProfileId(identity: { userId: string | null; userEmail: string | null }) {
  if (!supabase || (!identity.userId && !identity.userEmail)) {
    return null;
  }

  if (identity.userId) {
    const byClerk = await supabase.from("profiles").select("id").eq("clerk_user_id", identity.userId).maybeSingle();
    if (byClerk.data?.id) return byClerk.data.id;

    const byUserId = await supabase.from("profiles").select("id").eq("user_id", identity.userId).maybeSingle();
    if (byUserId.data?.id) return byUserId.data.id;
  }

  if (identity.userEmail) {
    const byEmail = await supabase.from("profiles").select("id").eq("email", identity.userEmail).maybeSingle();
    if (byEmail.data?.id) return byEmail.data.id;
  }

  return null;
}

export const useAdminStore = create<AdminStore>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      userId: null,
      userEmail: null,
      authError: null,
      songs: defaultSongs,
      questions: defaultQuestions,
      upsells: defaultUpsells,

      setAuthState: ({ isAuthenticated, userId = null, userEmail = null, authError = null }) => {
        set({ isAuthenticated, userId, userEmail, authError });
      },

      resetAuthState: () => {
        set({ isAuthenticated: false, userId: null, userEmail: null, authError: null });
      },

      login: (email, password) => {
        if (password === ADMIN_PASSWORD) {
          set({ isAuthenticated: true, authError: null, userId: `bypass-${email}`, userEmail: email });
          if (typeof document !== "undefined") {
            document.cookie = `compakt-admin-bypass=${email}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
          }
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
          set({ authError: normalizeSupabaseAuthError(error.message) });
          return false;
        }
        set({ isAuthenticated: true, userId: data.user?.id ?? null, userEmail: data.user?.email ?? null, authError: null });
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
          set({ authError: normalizeSupabaseAuthError(error.message) });
        }
      },

      signUp: async (email, password) => {
        if (!supabase) {
          set({ authError: "Supabase is not configured" });
          return "error";
        }
        set({ authError: null });
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) {
          set({ authError: normalizeSupabaseAuthError(error.message) });
          return "error";
        }
        if (data.session?.user) {
          set({ isAuthenticated: true, userId: data.session.user.id, userEmail: data.session.user.email ?? null, authError: null });
          return "authenticated";
        }
        set({ isAuthenticated: false, userId: null, userEmail: data.user?.email ?? email, authError: null });
        return "pending_confirmation";
      },

      checkSession: async () => {
        if (!supabase) return;
        const { data } = await supabase.auth.getSession();
        if (data.session?.user) {
          set({ isAuthenticated: true, userId: data.session.user.id, userEmail: data.session.user.email ?? null });
          return;
        }
        set({ isAuthenticated: false, userId: null, userEmail: null });
      },

      logout: () => {
        if (supabase) {
          supabase.auth.signOut().then(() => { });
        }
        set({ isAuthenticated: false, userId: null, userEmail: null, authError: null });
      },

      // Songs
      addSong: (song) => {
        const { songs } = get();
        const id = crypto.randomUUID();
        const newSong = { ...song, id, sortOrder: songs.length + 1 };
        set({ songs: [...songs, newSong] });

        void fetch("/api/admin/songs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ song: newSong }),
        });
      },

      updateSong: (id, data) => {
        set({
          songs: get().songs.map((s) => (s.id === id ? { ...s, ...data } : s)),
        });

        void fetch(`/api/admin/songs/${encodeURIComponent(id)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data }),
        });
      },

      deleteSong: (id) => {
        set({ songs: get().songs.filter((s) => s.id !== id) });
        void fetch(`/api/admin/songs/${encodeURIComponent(id)}`, {
          method: "DELETE",
        });
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
        const { questions, userId, userEmail } = get();
        const id = `q${Date.now()}`;
        const newQ = { ...question, id, sortOrder: questions.length + 1 };
        set({ questions: [...questions, newQ] });

        if (supabase && (userId || userEmail)) {
          resolveProfileId({ userId, userEmail }).then((profileId) => {
            if (!profileId) return;
            supabase!.from("questions").insert({
              id, dj_id: profileId, question_he: question.questionHe,
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
        const { upsells, userId, userEmail } = get();
        const id = crypto.randomUUID();
        const newUpsell = { ...upsell, id, sortOrder: upsells.length + 1 };
        set({ upsells: [...upsells, newUpsell] });

        if (supabase && (userId || userEmail)) {
          resolveProfileId({ userId, userEmail }).then((profileId) => {
            if (!profileId) return;
            supabase!.from("upsells").insert({
              id, dj_id: profileId, title_he: upsell.titleHe,
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
        const dbSongs: Song[] = (songsRes.data || []).map((s: {
          id: string;
          title: string;
          artist: string;
          cover_url?: string | null;
          preview_url?: string | null;
          external_link?: string | null;
          category?: string | null;
          tags?: string[] | string | null;
          energy?: number | null;
          language?: string | null;
          is_safe?: boolean | null;
          is_active?: boolean | null;
          sort_order?: number | null;
        }) => ({
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

        const dbQuestions: Question[] = (questionsRes.data || []).map((q: {
          id: string;
          question_he: string;
          question_type?: Question["questionType"] | null;
          event_type?: Question["eventType"] | null;
          options?: Question["options"] | string | null;
          slider_min?: number | null;
          slider_max?: number | null;
          slider_labels?: string[] | string | null;
          is_active?: boolean | null;
          sort_order?: number | null;
        }) => ({
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

        const dbUpsells: Upsell[] = (upsellsRes.data || []).map((u: {
          id: string;
          title_he: string;
          description_he?: string | null;
          price_hint?: string | null;
          cta_text_he?: string | null;
          placement?: Upsell["placement"] | null;
          is_active?: boolean | null;
          sort_order?: number | null;
        }) => ({
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
              body: JSON.stringify({}),
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
                  songs: s2.data.map((s: {
                    id: string;
                    title: string;
                    artist: string;
                    cover_url?: string | null;
                    preview_url?: string | null;
                    external_link?: string | null;
                    category?: string | null;
                    tags?: string[] | null;
                    energy?: number | null;
                    language?: string | null;
                    is_safe?: boolean | null;
                    is_active?: boolean | null;
                    sort_order?: number | null;
                  }) => ({
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
                  questions: q2.data.map((q: {
                    id: string;
                    question_he: string;
                    question_type?: Question["questionType"] | null;
                    event_type?: Question["eventType"] | null;
                    options?: Question["options"] | null;
                    slider_min?: number | null;
                    slider_max?: number | null;
                    slider_labels?: string[] | null;
                    is_active?: boolean | null;
                    sort_order?: number | null;
                  }) => ({
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
                  upsells: u2.data.map((u: {
                    id: string;
                    title_he: string;
                    description_he?: string | null;
                    price_hint?: string | null;
                    cta_text_he?: string | null;
                    placement?: Upsell["placement"] | null;
                    is_active?: boolean | null;
                    sort_order?: number | null;
                  }) => ({
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
        }
      },
    }
  )
);
