import { create } from "zustand";

export interface DJEvent {
  id: string;
  dj_id: string;
  name: string;
  date_time: string | null;
  venue: string;
  status: "upcoming" | "confirmed" | "completed" | "cancelled";
  notes: string;
  google_event_id: string | null;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
  screenshots: EventScreenshot[];
}

export interface EventScreenshot {
  id: string;
  event_id: string;
  image_url: string;
  sort_order: number;
  created_at: string;
}

interface EventsStore {
  events: DJEvent[];
  loading: boolean;
  error: string | null;
  loadEvents: (profileId: string) => Promise<void>;
  createEvent: (profileId: string, event: Partial<DJEvent>) => Promise<DJEvent | null>;
  updateEvent: (eventId: string, patch: Partial<DJEvent>) => Promise<void>;
  deleteEvent: (eventId: string) => Promise<void>;
  addScreenshot: (eventId: string, imageUrl: string) => Promise<void>;
  removeScreenshot: (screenshotId: string) => Promise<void>;
  reorderScreenshots: (eventId: string, screenshotIds: string[]) => Promise<void>;
}

export const useEventsStore = create<EventsStore>()((set, get) => ({
  events: [],
  loading: false,
  error: null,

  loadEvents: async (profileId: string) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`/api/admin/events?profileId=${profileId}`);
      const json = await res.json();

      if (json.warning) console.warn(json.warning);
      if (!res.ok) throw new Error(json.error || "שגיאה בטעינת אירועים");

      set({ events: json.events || [], loading: false });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : "שגיאה בטעינת אירועים", loading: false });
    }
  },

  createEvent: async (profileId: string, event: Partial<DJEvent>) => {
    set({ error: null });
    try {
      const res = await fetch("/api/admin/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", profileId, data: event }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "שגיאה ביצירת אירוע");

      const newEvent: DJEvent = json.event;
      set({ events: [newEvent, ...get().events] });
      return newEvent;
    } catch (e) {
      set({ error: e instanceof Error ? e.message : "שגיאה ביצירת אירוע" });
      return null;
    }
  },

  updateEvent: async (eventId: string, patch: Partial<DJEvent>) => {
    set({ error: null });
    try {
      const res = await fetch("/api/admin/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update", eventId, data: patch }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "שגיאה בעדכון אירוע");

      set({
        events: get().events.map((e) =>
          e.id === eventId ? { ...e, ...patch, updated_at: new Date().toISOString() } : e
        ),
      });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : "שגיאה בעדכון אירוע" });
    }
  },

  deleteEvent: async (eventId: string) => {
    set({ error: null });
    try {
      const res = await fetch("/api/admin/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", eventId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "שגיאה במחיקת אירוע");

      set({ events: get().events.filter((e) => e.id !== eventId) });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : "שגיאה במחיקת אירוע" });
    }
  },

  addScreenshot: async (eventId: string, imageUrl: string) => {
    set({ error: null });
    const event = get().events.find((e) => e.id === eventId);
    const sortOrder = event ? event.screenshots.length : 0;

    try {
      const res = await fetch("/api/admin/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_screenshot",
          eventId,
          data: { image_url: imageUrl, sort_order: sortOrder },
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "שגיאה בהוספת צילום מסך");

      set({
        events: get().events.map((e) =>
          e.id === eventId ? { ...e, screenshots: [...e.screenshots, json.screenshot] } : e
        ),
      });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : "שגיאה בהוספת צילום מסך" });
    }
  },

  removeScreenshot: async (screenshotId: string) => {
    set({ error: null });
    try {
      const res = await fetch("/api/admin/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "remove_screenshot",
          data: { screenshot_id: screenshotId },
        }),
      });
      const json = await res.json();
      if (!res.ok) console.warn("Failed to delete screenshot:", json.error);
    } catch {
      // silent
    }

    set({
      events: get().events.map((e) => ({
        ...e,
        screenshots: e.screenshots.filter((s) => s.id !== screenshotId),
      })),
    });
  },

  reorderScreenshots: async (eventId: string, screenshotIds: string[]) => {
    // Update local state immediately
    set({
      events: get().events.map((e) => {
        if (e.id !== eventId) return e;
        const sorted = screenshotIds
          .map((id) => e.screenshots.find((s) => s.id === id))
          .filter(Boolean) as EventScreenshot[];
        return { ...e, screenshots: sorted };
      }),
    });

    // Fire-and-forget DB updates
    for (let i = 0; i < screenshotIds.length; i++) {
      fetch("/api/admin/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_screenshot_order",
          data: { screenshot_id: screenshotIds[i], sort_order: i },
        }),
      }).catch(() => { });
    }
  },
}));
