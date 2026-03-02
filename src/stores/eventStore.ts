import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  EventData,
  QuestionAnswer,
  SongSwipe,
  EventRequest,
  UpsellClick,
  ThemeMode,
  SwipeAction,
} from "@/lib/types";
import { generateMagicToken } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

interface AnalyticsEvent {
  eventName: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

interface EventStore {
  // Current event
  event: EventData | null;
  answers: QuestionAnswer[];
  swipes: SongSwipe[];
  requests: EventRequest[];
  upsellClicks: UpsellClick[];
  analytics: AnalyticsEvent[];
  theme: ThemeMode;

  // Actions
  createEvent: (data: Partial<EventData>) => string;
  loadEvent: (token: string) => boolean;
  updateEvent: (data: Partial<EventData>) => void;
  setStage: (stage: number) => void;

  // Questions
  saveAnswer: (questionId: string, value: string | string[] | number) => void;
  getAnswer: (questionId: string) => QuestionAnswer | undefined;

  // Swipes
  saveSwipe: (songId: string, action: SwipeAction, reasonChips?: string[]) => void;
  getSwipe: (songId: string) => SongSwipe | undefined;
  getSwipedSongIds: () => string[];
  removeSwipe: (songId: string) => void;
  setSwipes: (swipes: SongSwipe[]) => void;

  // Requests
  addRequest: (request: Omit<EventRequest, "id" | "eventId" | "createdAt">) => void;
  removeRequest: (id: string) => void;

  // Upsells
  trackUpsellClick: (upsellId: string) => void;

  // Analytics
  trackEvent: (eventName: string, metadata?: Record<string, unknown>) => void;

  // Theme
  setTheme: (theme: ThemeMode) => void;

  // Reset
  reset: () => void;
}

const initialState = {
  event: null as EventData | null,
  answers: [] as QuestionAnswer[],
  swipes: [] as SongSwipe[],
  requests: [] as EventRequest[],
  upsellClicks: [] as UpsellClick[],
  analytics: [] as AnalyticsEvent[],
  theme: "night" as ThemeMode,
};

export const useEventStore = create<EventStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      createEvent: (data) => {
        const token = generateMagicToken();
        const event: EventData = {
          id: crypto.randomUUID(),
          magicToken: token,
          eventType: data.eventType || "wedding",
          eventDate: data.eventDate,
          venue: data.venue,
          city: data.city,
          coupleNameA: data.coupleNameA,
          coupleNameB: data.coupleNameB,
          currentStage: 0,
          theme: "night",
          createdAt: new Date().toISOString(),
        };
        set({ event, answers: [], swipes: [], requests: [], upsellClicks: [], analytics: [] });

        // Sync to Supabase in background
        if (supabase) {
          supabase
            .from("events")
            .insert({
              id: event.id,
              magic_token: token,
              event_type: event.eventType,
              couple_name_a: event.coupleNameA || "",
              couple_name_b: event.coupleNameB || "",
              event_date: event.eventDate || "",
              venue: event.venue || "",
              current_stage: 0,
            })
            .then(() => { });
        }

        return token;
      },

      loadEvent: (token) => {
        const { event } = get();
        if (event?.magicToken === token) return true;

        // Try loading from Supabase if not in localStorage
        if (supabase) {
          supabase
            .from("events")
            .select("*")
            .eq("magic_token", token)
            .single()
            .then(({ data }) => {
              if (data) {
                set({
                  event: {
                    id: data.id,
                    magicToken: data.magic_token,
                    eventType: data.event_type,
                    coupleNameA: data.couple_name_a,
                    coupleNameB: data.couple_name_b,
                    eventDate: data.event_date,
                    venue: data.venue,
                    currentStage: data.current_stage ?? 0,
                    theme: "night",
                    createdAt: data.created_at,
                  },
                });
              }
            });
        }

        return false;
      },

      updateEvent: (data) => {
        const { event } = get();
        if (!event) return;
        set({ event: { ...event, ...data } });
      },

      setStage: (stage) => {
        const { event, trackEvent } = get();
        if (!event) return;
        set({ event: { ...event, currentStage: stage } });
        trackEvent("stage_change", { stage });

        if (supabase) {
          supabase.from("events").update({ current_stage: stage }).eq("id", event.id).then(() => { });
        }
      },

      saveAnswer: (questionId, value) => {
        const { event, answers } = get();
        if (!event) return;
        const existing = answers.findIndex((a) => a.questionId === questionId);
        const answer: QuestionAnswer = {
          id: existing >= 0 ? answers[existing].id : crypto.randomUUID(),
          eventId: event.id,
          questionId,
          answerValue: value,
          answeredAt: new Date().toISOString(),
        };
        if (existing >= 0) {
          const updated = [...answers];
          updated[existing] = answer;
          set({ answers: updated });
        } else {
          set({ answers: [...answers, answer] });
        }

        // Sync to Supabase
        if (supabase) {
          supabase
            .from("answers")
            .upsert(
              {
                id: answer.id,
                event_id: event.id,
                question_id: questionId,
                answer_value: JSON.stringify(value),
              },
              { onConflict: "id" }
            )
            .then(() => { });
        }
      },

      getAnswer: (questionId) => {
        return get().answers.find((a) => a.questionId === questionId);
      },

      saveSwipe: (songId, action, reasonChips = []) => {
        const { event, swipes } = get();
        if (!event) return;
        const existing = swipes.findIndex((s) => s.songId === songId);
        const swipe: SongSwipe = {
          id: existing >= 0 ? swipes[existing].id : crypto.randomUUID(),
          eventId: event.id,
          songId,
          action,
          reasonChips,
          swipedAt: new Date().toISOString(),
        };
        if (existing >= 0) {
          const updated = [...swipes];
          updated[existing] = swipe;
          set({ swipes: updated });
        } else {
          set({ swipes: [...swipes, swipe] });
        }

        // Sync to Supabase
        if (supabase) {
          supabase
            .from("swipes")
            .upsert(
              {
                id: swipe.id,
                event_id: event.id,
                song_id: songId,
                action,
                reason_chips: JSON.stringify(reasonChips),
              },
              { onConflict: "id" }
            )
            .then(() => { });
        }
      },

      getSwipe: (songId) => {
        return get().swipes.find((s) => s.songId === songId);
      },

      getSwipedSongIds: () => {
        return get().swipes.map((s) => s.songId);
      },

      removeSwipe: (songId) => {
        const swipe = get().swipes.find((s) => s.songId === songId);
        set({ swipes: get().swipes.filter((s) => s.songId !== songId) });
        if (supabase && swipe) {
          supabase.from("swipes").delete().eq("id", swipe.id).then(() => { });
        }
      },

      setSwipes: (swipes) => {
        set({ swipes });
      },

      addRequest: (request) => {
        const { event, requests } = get();
        if (!event) return;
        const id = crypto.randomUUID();
        const newRequest = {
          ...request,
          id,
          eventId: event.id,
          createdAt: new Date().toISOString(),
        };
        set({ requests: [...requests, newRequest] });

        // Sync to Supabase
        if (supabase) {
          supabase
            .from("requests")
            .insert({
              id,
              event_id: event.id,
              request_type: request.requestType,
              content: request.content,
              moment_type: request.momentType || null,
            })
            .then(() => { });
        }
      },

      removeRequest: (id) => {
        set({ requests: get().requests.filter((r) => r.id !== id) });
        if (supabase) {
          supabase.from("requests").delete().eq("id", id).then(() => { });
        }
      },

      trackUpsellClick: (upsellId) => {
        const { event, upsellClicks } = get();
        if (!event) return;
        set({
          upsellClicks: [
            ...upsellClicks,
            {
              id: crypto.randomUUID(),
              eventId: event.id,
              upsellId,
              clickedAt: new Date().toISOString(),
            },
          ],
        });
      },

      trackEvent: (eventName, metadata = {}) => {
        set({
          analytics: [
            ...get().analytics,
            { eventName, metadata, createdAt: new Date().toISOString() },
          ],
        });
      },

      setTheme: (theme) => {
        set({ theme });
        if (typeof document !== "undefined") {
          document.documentElement.setAttribute("data-theme", theme);
        }
      },

      reset: () => set(initialState),
    }),
    {
      name: "compakt-event",
    }
  )
);
