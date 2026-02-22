import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Song, Question, Upsell } from "@/lib/types";
import { defaultSongs } from "@/data/songs";
import { defaultQuestions } from "@/data/questions";
import { defaultUpsells } from "@/data/upsells";

interface AdminStore {
  isAuthenticated: boolean;
  songs: Song[];
  questions: Question[];
  upsells: Upsell[];

  // Auth
  login: (password: string) => boolean;
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
}

const ADMIN_PASSWORD = "compakt2024";

export const useAdminStore = create<AdminStore>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      songs: defaultSongs,
      questions: defaultQuestions,
      upsells: defaultUpsells,

      login: (password) => {
        if (password === ADMIN_PASSWORD) {
          set({ isAuthenticated: true });
          return true;
        }
        return false;
      },

      logout: () => set({ isAuthenticated: false }),

      // Songs
      addSong: (song) => {
        const { songs } = get();
        set({
          songs: [
            ...songs,
            { ...song, id: crypto.randomUUID(), sortOrder: songs.length + 1 },
          ],
        });
      },

      updateSong: (id, data) => {
        set({
          songs: get().songs.map((s) => (s.id === id ? { ...s, ...data } : s)),
        });
      },

      deleteSong: (id) => {
        set({ songs: get().songs.filter((s) => s.id !== id) });
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
        const { questions } = get();
        set({
          questions: [
            ...questions,
            {
              ...question,
              id: `q${Date.now()}`,
              sortOrder: questions.length + 1,
            },
          ],
        });
      },

      updateQuestion: (id, data) => {
        set({
          questions: get().questions.map((q) =>
            q.id === id ? { ...q, ...data } : q
          ),
        });
      },

      deleteQuestion: (id) => {
        set({ questions: get().questions.filter((q) => q.id !== id) });
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
        const { upsells } = get();
        set({
          upsells: [
            ...upsells,
            { ...upsell, id: crypto.randomUUID(), sortOrder: upsells.length + 1 },
          ],
        });
      },

      updateUpsell: (id, data) => {
        set({
          upsells: get().upsells.map((u) =>
            u.id === id ? { ...u, ...data } : u
          ),
        });
      },

      deleteUpsell: (id) => {
        set({ upsells: get().upsells.filter((u) => u.id !== id) });
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
              { label: "חפלה - נסרין המוזמנת הראשית", value: "party" },
              { label: "אפטר של החיים", value: "after" },
              { label: "מיינסטרים של מיאמי", value: "miami_mainstream" },
              { label: "היפ הופ שחורה / R&B (בשחורהה)", value: "black_rb" },
              { label: "80s funky שלמה ארצי והחברים", value: "shlomo_funky_80s" },
              { label: "שלב את הכל", value: "mix" },
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
