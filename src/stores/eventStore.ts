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
        return token;
      },

      loadEvent: (token) => {
        const { event } = get();
        return event?.magicToken === token;
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
      },

      getSwipe: (songId) => {
        return get().swipes.find((s) => s.songId === songId);
      },

      getSwipedSongIds: () => {
        return get().swipes.map((s) => s.songId);
      },

      removeSwipe: (songId) => {
        set({ swipes: get().swipes.filter((s) => s.songId !== songId) });
      },

      setSwipes: (swipes) => {
        set({ swipes });
      },

      addRequest: (request) => {
        const { event, requests } = get();
        if (!event) return;
        set({
          requests: [
            ...requests,
            {
              ...request,
              id: crypto.randomUUID(),
              eventId: event.id,
              createdAt: new Date().toISOString(),
            },
          ],
        });
      },

      removeRequest: (id) => {
        set({ requests: get().requests.filter((r) => r.id !== id) });
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
