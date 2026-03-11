import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  EventData,
  EventType,
  QuestionAnswer,
  SongSwipe,
  EventRequest,
  UpsellClick,
  ThemeMode,
  SwipeAction,
} from "@/lib/types";
import { generateEventNumber, generateMagicToken } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

interface AnalyticsEvent {
  eventName: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

type EventRow = {
  id: string;
  magic_token: string;
  token: string;
  event_type: EventType;
  couple_name_a: string | null;
  couple_name_b: string | null;
  event_date: string | null;
  venue: string | null;
  dj_id: string | null;
  current_stage: number | null;
  created_at: string;
};

function isUuidLike(value: string | undefined): boolean {
  if (!value) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
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
  createEventAsync: (data: Partial<EventData>) => Promise<string>;
  loadEvent: (token: string) => boolean;
  loadEventAsync: (token: string) => Promise<boolean>;
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
        const eventNumber = data.eventNumber || generateEventNumber();
        const event: EventData = {
          id: crypto.randomUUID(),
          magicToken: token,
          eventNumber,
          eventType: data.eventType || "wedding",
          eventDate: data.eventDate,
          venue: data.venue,
          city: data.city,
          coupleNameA: data.coupleNameA,
          coupleNameB: data.coupleNameB,
          djId: data.djId,
          currentStage: 0,
          theme: "night",
          createdAt: new Date().toISOString(),
        };
        set({ event, answers: [], swipes: [], requests: [], upsellClicks: [], analytics: [] });

        // Sync to Supabase in background
        if (supabase) {
          const row: Record<string, unknown> = {
            id: event.id,
            magic_token: token,
            token: eventNumber,
            event_type: event.eventType,
            couple_name_a: event.coupleNameA || "",
            couple_name_b: event.coupleNameB || "",
            event_date: event.eventDate || "",
            venue: event.venue || "",
            current_stage: 0,
          };
          if (isUuidLike(data.djId)) row.dj_id = data.djId;
          supabase
            .from("events")
            .insert(row)
            .then(({ error }: { error: { message: string } | null }) => {
              if (error) {
                const message = error.message.includes("events_dj_id_fkey")
                  ? "Selected DJ was not found while saving event."
                  : error.message;
                console.error("[DB Write] events.insert failed:", message);
              }
            });
        }

        return token;
      },

      createEventAsync: async (data) => {
        const token = generateMagicToken();
        const eventNumber = data.eventNumber || generateEventNumber();
        const event: EventData = {
          id: crypto.randomUUID(),
          magicToken: token,
          eventNumber,
          eventType: data.eventType || "wedding",
          eventDate: data.eventDate,
          venue: data.venue,
          city: data.city,
          coupleNameA: data.coupleNameA,
          coupleNameB: data.coupleNameB,
          contactEmail: data.contactEmail,
          contactPhone: data.contactPhone,
          djId: data.djId,
          currentStage: 0,
          theme: "night",
          createdAt: new Date().toISOString(),
        };
        set({ event, answers: [], swipes: [], requests: [], upsellClicks: [], analytics: [] });

        if (supabase) {
          const row: Record<string, unknown> = {
            id: event.id,
            magic_token: token,
            token: eventNumber,
            event_type: event.eventType,
            couple_name_a: event.coupleNameA || "",
            couple_name_b: event.coupleNameB || "",
            event_date: event.eventDate || "",
            venue: event.venue || "",
            phone_number: event.contactPhone || "",
            current_stage: 0,
          };
          if (isUuidLike(data.djId)) row.dj_id = data.djId;
          const { error } = await supabase
            .from("events")
            .insert(row);
          if (error) {
            const message = error.message.includes("events_dj_id_fkey")
              ? "הדיג׳יי שנבחר לא נמצא. רעננו את הדף ובחרו שוב."
              : error.message;
            console.error("[DB Write] events.insert failed:", message);
            set({ event: null, answers: [], swipes: [], requests: [], upsellClicks: [], analytics: [] });
            throw new Error(message || "יצירת האירוע נכשלה");
          }
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
            .then(({ data }: { data: EventRow | null }) => {
              if (data) {
                set({
                  event: {
                    id: data.id,
                    magicToken: data.magic_token,
                    eventNumber: data.token,
                    eventType: data.event_type,
                    coupleNameA: data.couple_name_a || undefined,
                    coupleNameB: data.couple_name_b || undefined,
                    eventDate: data.event_date || undefined,
                    venue: data.venue || undefined,
                    djId: data.dj_id || undefined,
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

      loadEventAsync: async (token) => {
        const { event } = get();
        if (event?.magicToken === token) return true;
        if (!supabase) return false;

        const { data } = await supabase
          .from("events")
          .select("*")
          .eq("magic_token", token)
          .single();

        if (!data) return false;

        const row = data as EventRow;
        set({
          event: {
            id: row.id,
            magicToken: row.magic_token,
            eventNumber: row.token,
            eventType: row.event_type,
            coupleNameA: row.couple_name_a || undefined,
            coupleNameB: row.couple_name_b || undefined,
            eventDate: row.event_date || undefined,
            venue: row.venue || undefined,
            djId: row.dj_id || undefined,
            currentStage: row.current_stage ?? 0,
            theme: "night",
            createdAt: row.created_at,
          },
        });

        return true;
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
          supabase.from("events").update({ current_stage: stage }).eq("id", event.id).then(({ error }: { error: { message: string } | null }) => {
            if (error) console.error("[DB Write] events.update stage failed:", error.message);
          });
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
            .then(({ error }: { error: { message: string } | null }) => {
              if (error) console.error("[DB Write] answers.upsert failed:", error.message);
            });
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
            .then(({ error }: { error: { message: string } | null }) => {
              if (error) console.error("[DB Write] swipes.upsert failed:", error.message);
            });
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
          supabase.from("swipes").delete().eq("id", swipe.id).then(({ error }: { error: { message: string } | null }) => {
            if (error) console.error("[DB Write] swipes.delete failed:", error.message);
          });
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
            .then(({ error }: { error: { message: string } | null }) => {
              if (error) console.error("[DB Write] requests.insert failed:", error.message);
            });
        }
      },

      removeRequest: (id) => {
        set({ requests: get().requests.filter((r) => r.id !== id) });
        if (supabase) {
          supabase.from("requests").delete().eq("id", id).then(({ error }: { error: { message: string } | null }) => {
            if (error) console.error("[DB Write] requests.delete failed:", error.message);
          });
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
