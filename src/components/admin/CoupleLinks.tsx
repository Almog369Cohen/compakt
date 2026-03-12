"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useProfileStore } from "@/stores/profileStore";
import { trackAnalytics } from "@/hooks/useAnalytics";
import { safeCopyText } from "@/lib/clipboard";
import { getSafeOrigin } from "@/lib/utils";
import { resolveSongMedia } from "@/lib/songMedia";
import type { EventRequest, Question, SongSwipe } from "@/lib/types";
import { defaultQuestions } from "@/data/questions";
import { reasonChips as defaultReasonChips } from "@/data/songs";
import {
  Link,
  Plus,
  Copy,
  Check,
  Save,
  Share2,
  Loader2,
  Heart,
  Star,
  PartyPopper,
  Briefcase,
  Music,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  FileText,
  ListMusic,
  ClipboardList,
  MessageSquareText,
  Calendar,
  MapPin,
  Edit3,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { GuestCalculatorAnswer, QuestionOption } from "@/lib/types";

interface CoupleEvent {
  id: string;
  magic_token: string;
  token: string | null;
  event_type: string;
  couple_name_a: string;
  couple_name_b: string;
  event_date: string;
  venue: string;
  current_stage: number;
  phone_number: string | null;
  email?: string | null;
  answerCount: number;
  swipeCount: number;
  requestCount?: number;
  isComplete: boolean;
  created_at: string;
  updated_at?: string | null;
}

interface RawAnswer {
  id: string;
  event_id: string;
  question_id: string;
  answer_value: unknown;
  created_at?: string;
  updated_at?: string;
}

interface DetailEventData {
  event: CoupleEvent;
  answers: RawAnswer[];
  swipes: Array<{
    id: string;
    event_id: string;
    song_id: string;
    action: SongSwipe["action"];
    reason_chips: string[] | string | null;
    created_at?: string;
    updated_at?: string;
  }>;
  requests: Array<{
    id: string;
    event_id: string;
    request_type: EventRequest["requestType"];
    content: string;
    moment_type?: EventRequest["momentType"] | null;
    created_at?: string;
  }>;
  questions: Array<{
    id: string;
    question_he: string;
    question_type: Question["questionType"];
    event_type: Question["eventType"];
    options?: QuestionOption[] | string | null;
    slider_labels?: string[] | string | null;
    sort_order?: number;
  }>;
  songs: Array<{
    id: string;
    title: string;
    artist: string;
    cover_url?: string | null;
    preview_url?: string | null;
    external_link?: string | null;
  }>;
}

type DetailQuestion = DetailEventData["questions"][number];

type DetailTab = "overview" | "answers" | "swipes" | "requests" | "summary";
type SwipeFilter = "all" | "like" | "super_like" | "dislike" | "unsure";
type CrmMeta = {
  notes: string;
  checklist: {
    callCouple: boolean;
    closeTimeline: boolean;
    prepPlaylist: boolean;
  };
};

const EVENT_ICONS: Record<string, React.ReactNode> = {
  wedding: <Heart className="w-4 h-4" />,
  bar_mitzvah: <Star className="w-4 h-4" />,
  private: <PartyPopper className="w-4 h-4" />,
  corporate: <Briefcase className="w-4 h-4" />,
  other: <Music className="w-4 h-4" />,
};

const EVENT_LABELS: Record<string, string> = {
  wedding: "חתונה",
  bar_mitzvah: "בר/בת מצווה",
  private: "אירוע פרטי",
  corporate: "אירוע עסקי",
  other: "אחר",
};

const STAGE_LABELS: Record<number, string> = {
  0: "טרם התחיל",
  1: "שאלות",
  2: "שירים",
  3: "בקשות",
  4: "סיים",
};

const FALLBACK_QUESTION_MAP = new Map<string, DetailQuestion>([
  ...defaultQuestions.map((question): [string, DetailQuestion] => [
    question.id,
    {
      id: question.id,
      question_he: question.questionHe,
      question_type: question.questionType,
      event_type: question.eventType,
      options: question.options,
      slider_labels: question.sliderLabels,
      sort_order: question.sortOrder,
    },
  ]),
  [
    "ethnic_music",
    {
      id: "ethnic_music",
      question_he: "רוצים לשלב גם מוזיקת עדות?",
      question_type: "single_select" as const,
      event_type: "wedding" as const,
      options: [
        { label: "כן", value: "yes" },
        { label: "לא", value: "no" },
      ],
      slider_labels: [],
      sort_order: 10000,
    } as DetailQuestion,
  ],
  [
    "ethnic_music_edah",
    {
      id: "ethnic_music_edah",
      question_he: "מה העדה שלכם?",
      question_type: "text" as const,
      event_type: "wedding" as const,
      options: [],
      slider_labels: [],
      sort_order: 10001,
    } as DetailQuestion,
  ],
]);

function parseAnswerValue(value: unknown): string {
  if (Array.isArray(value)) {
    return value.map((item) => String(item)).join(", ");
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.map((item) => String(item)).join(", ");
      if (parsed && typeof parsed === "object") return JSON.stringify(parsed);
      return String(parsed);
    } catch {
      return value;
    }
  }
  if (value === null || value === undefined) return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function parseMaybeJsonValue(value: unknown): unknown {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function parseQuestionOptions(value: QuestionOption[] | string | null | undefined): QuestionOption[] {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed as QuestionOption[] : [];
  } catch {
    return [];
  }
}

function parseSliderLabels(value: string[] | string | null | undefined): string[] {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map((item) => String(item)) : [];
  } catch {
    return [];
  }
}

function formatGuestCalculatorAnswer(value: GuestCalculatorAnswer): string {
  return `סה״כ ${value.totalGuests} אורחים · ${value.adults} מבוגרים · ${value.youngAdults} צעירים · ${value.children} ילדים`;
}

function formatAnswerForDisplay(value: unknown, question?: DetailEventData["questions"][number]): string {
  const normalized = parseMaybeJsonValue(value);
  if (!question) return parseAnswerValue(normalized);

  if (question.question_type === "guest_calculator" && normalized && typeof normalized === "object" && !Array.isArray(normalized)) {
    const guestAnswer = normalized as Partial<GuestCalculatorAnswer>;
    if (typeof guestAnswer.totalGuests === "number") {
      return formatGuestCalculatorAnswer({
        totalGuests: guestAnswer.totalGuests ?? 0,
        adults: guestAnswer.adults ?? 0,
        youngAdults: guestAnswer.youngAdults ?? 0,
        children: guestAnswer.children ?? 0,
      });
    }
  }

  const options = parseQuestionOptions(question.options);
  const sliderLabels = parseSliderLabels(question.slider_labels);
  const getOptionLabel = (optionValue: unknown) => {
    const option = options.find((item) => item.value === String(optionValue));
    return option?.label || String(optionValue);
  };

  if (Array.isArray(normalized)) {
    return normalized.map((item) => getOptionLabel(item)).join(" · ");
  }

  if (typeof normalized === "number" && sliderLabels.length > 0) {
    return sliderLabels[normalized - 1] || String(normalized);
  }

  if (typeof normalized === "string" && options.length > 0) {
    return getOptionLabel(normalized);
  }

  return parseAnswerValue(normalized);
}

function getSwipeActionLabel(action: SongSwipe["action"]): string {
  switch (action) {
    case "like":
      return "אהבו";
    case "super_like":
      return "אהבו במיוחד";
    case "dislike":
      return "לא אהבו";
    case "unsure":
      return "לא בטוחים";
    default:
      return action;
  }
}

function getRequestTypeLabel(type: EventRequest["requestType"]): string {
  switch (type) {
    case "do":
      return "כן לעשות";
    case "dont":
      return "לא לעשות";
    case "link":
      return "קישור";
    case "special_moment":
      return "רגע מיוחד";
    case "free_text":
    default:
      return "הערה";
  }
}

function getMomentTypeLabel(type?: EventRequest["momentType"] | null): string {
  switch (type) {
    case "ceremony":
      return "טקס";
    case "glass_break":
      return "שבירת כוס";
    case "first_dance":
      return "ריקוד ראשון";
    case "entrance":
      return "כניסה";
    case "parents":
      return "הורים";
    case "other":
      return "אחר";
    default:
      return "";
  }
}

function getQuestionDisplay(
  questionId: string,
  questionMap: Map<string, DetailQuestion>
): DetailQuestion | undefined {
  return questionMap.get(questionId) || FALLBACK_QUESTION_MAP.get(questionId);
}

function getReasonChipLabel(chip: string) {
  return defaultReasonChips.find((item) => item === chip) || chip;
}

function buildCoupleSnapshot(args: {
  detail?: DetailEventData;
  questionMap: Map<string, DetailQuestion>;
  songMap: Map<string, DetailEventData["songs"][number]>;
}) {
  const { detail, questionMap, songMap } = args;
  if (!detail) {
    return {
      headline: "פתח את הכרטיס כדי לראות את תמונת הזוג",
      likes: [] as string[],
      redFlags: [] as string[],
      mustPlay: [] as string[],
      requests: [] as string[],
    };
  }

  const likes = detail.answers
    .map((answer) => formatAnswerForDisplay(answer.answer_value, getQuestionDisplay(answer.question_id, questionMap)))
    .filter(Boolean)
    .slice(0, 3);

  const redFlags = detail.requests
    .filter((request) => request.request_type === "dont")
    .map((request) => request.content)
    .filter(Boolean)
    .slice(0, 3);

  const mustPlay = detail.swipes
    .filter((swipe) => swipe.action === "super_like" || swipe.action === "like")
    .map((swipe) => {
      const song = songMap.get(swipe.song_id);
      return song ? `${song.title} - ${song.artist}` : "";
    })
    .filter(Boolean)
    .slice(0, 3);

  const requests = detail.requests
    .filter((request) => request.request_type !== "dont")
    .map((request) => request.content)
    .filter(Boolean)
    .slice(0, 3);

  const headline = likes.length > 0
    ? `מה חשוב להם: ${likes.slice(0, 2).join(" · ")}`
    : mustPlay.length > 0
      ? `שירים בולטים: ${mustPlay.slice(0, 2).join(" · ")}`
      : requests.length > 0
        ? `בקשות עיקריות: ${requests.slice(0, 2).join(" · ")}`
        : "עדיין אין מספיק תוכן כדי לזהות העדפות";

  return { headline, likes, redFlags, mustPlay, requests };
}

function parseReasonChips(value: string[] | string | null): string[] {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map((item) => String(item)) : [];
  } catch {
    return [value];
  }
}

function formatDateLabel(value?: string | null): string {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString("he-IL");
  } catch {
    return value;
  }
}

function toTimestamp(value?: string | null): number {
  if (!value) return Number.POSITIVE_INFINITY;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? Number.POSITIVE_INFINITY : time;
}

function isPastEvent(value?: string | null): boolean {
  if (!value) return false;
  const time = new Date(value).getTime();
  if (Number.isNaN(time)) return false;
  return time < Date.now();
}

async function parseJsonResponse<T>(res: Response): Promise<T> {
  const text = await res.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(
      text.startsWith("<!DOCTYPE") || text.startsWith("<html")
        ? "תגובת שרת לא תקינה. ה-API החזיר HTML במקום JSON"
        : text || "תגובה לא תקינה מהשרת"
    );
  }
}

function getLoadErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : "";

  if (message === "Authentication required") {
    return "ההתחברות פגה. רענן את העמוד והתחבר מחדש כדי לראות את קישורי הזוגות.";
  }

  if (message === "Forbidden: insufficient role" || message === "Forbidden: profile not found") {
    return "אין לך הרשאה לצפות בקישורי הזוגות בחשבון הזה.";
  }

  return message || "שגיאה בטעינת קישורי שאלון";
}

export function CoupleLinks() {
  const profileId = useProfileStore((s) => s.profileId);
  const djSlug = useProfileStore((s) => s.profile.djSlug);
  const [events, setEvents] = useState<CoupleEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeTabByEvent, setActiveTabByEvent] = useState<Record<string, DetailTab>>({});
  const [detailByEvent, setDetailByEvent] = useState<Record<string, DetailEventData>>({});
  const [detailLoadingId, setDetailLoadingId] = useState<string | null>(null);
  const [detailErrorByEvent, setDetailErrorByEvent] = useState<Record<string, string>>({});
  const [expandedSwipeId, setExpandedSwipeId] = useState<string | null>(null);
  const [swipeFilterByEvent, setSwipeFilterByEvent] = useState<Record<string, SwipeFilter>>({});
  const [crmByEvent, setCrmByEvent] = useState<Record<string, CrmMeta>>({});
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  const [scheduleDraft, setScheduleDraft] = useState<Record<string, { event_date: string; venue: string }>>({});

  // New link form
  const [showForm, setShowForm] = useState(false);
  const [newNameA, setNewNameA] = useState("");
  const [newNameB, setNewNameB] = useState("");
  const [newType, setNewType] = useState("wedding");
  const [newDate, setNewDate] = useState("");
  const [newVenue, setNewVenue] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem("compakt-couple-crm");
      if (!raw) return;
      const parsed = JSON.parse(raw) as Record<string, CrmMeta>;
      setCrmByEvent(parsed);
    } catch {
      return;
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("compakt-couple-crm", JSON.stringify(crmByEvent));
  }, [crmByEvent]);

  const loadEvents = useCallback(async () => {
    if (!profileId) return;
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch("/api/admin/couple-link", { cache: "no-store" });
      const data = await parseJsonResponse<{ events?: CoupleEvent[]; error?: string }>(res);
      if (!res.ok) {
        throw new Error(data.error || "שגיאה בטעינת קישורי שאלון");
      }
      setEvents(data.events || []);
    } catch (error) {
      setEvents([]);
      setLoadError(getLoadErrorMessage(error));
    }
    setLoading(false);
  }, [profileId]);

  useEffect(() => {
    if (!profileId) return;
    void loadEvents();
  }, [loadEvents, profileId]);

  const loadEventDetail = useCallback(async (eventId: string) => {
    setDetailLoadingId(eventId);
    setDetailErrorByEvent((prev) => ({ ...prev, [eventId]: "" }));
    try {
      const res = await fetch("/api/admin/couple-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "get_event_detail",
          eventId,
        }),
        cache: "no-store",
      });
      const data = await parseJsonResponse<DetailEventData & { error?: string }>(res);
      if (!res.ok) {
        throw new Error(data.error || "שגיאה בטעינת פרטי אירוע");
      }
      setDetailByEvent((prev) => ({
        ...prev,
        [eventId]: data as DetailEventData,
      }));
    } catch (error) {
      setDetailErrorByEvent((prev) => ({
        ...prev,
        [eventId]: error instanceof Error ? error.message : "שגיאה בטעינת פרטי אירוע",
      }));
    } finally {
      setDetailLoadingId((current) => (current === eventId ? null : current));
    }
  }, []);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const res = await fetch("/api/admin/couple-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventType: newType,
          coupleNameA: newNameA,
          coupleNameB: newNameB,
          eventDate: newDate,
          venue: newVenue,
        }),
      });
      const data = await parseJsonResponse<{ error?: string }>(res);
      if (res.ok) {
        trackAnalytics("couple_link_created", {
          category: "admin",
          djId: profileId,
          metadata: { eventType: newType },
        });
        setShowForm(false);
        setNewNameA("");
        setNewNameB("");
        setNewDate("");
        setNewVenue("");
        loadEvents();
      } else {
        alert(data.error || "שגיאה ביצירת קישור");
      }
    } catch {
      alert("שגיאה ביצירת קישור");
    };
    setCreating(false);
  };

  const updateCrmMeta = (eventId: string, patch: Partial<CrmMeta>) => {
    setCrmByEvent((prev) => ({
      ...prev,
      [eventId]: {
        notes: prev[eventId]?.notes || "",
        checklist: prev[eventId]?.checklist || {
          callCouple: false,
          closeTimeline: false,
          prepPlaylist: false,
        },
        ...patch,
      },
    }));
  };

  const toggleChecklist = (eventId: string, key: keyof CrmMeta["checklist"]) => {
    const current = crmByEvent[eventId]?.checklist || {
      callCouple: false,
      closeTimeline: false,
      prepPlaylist: false,
    };
    updateCrmMeta(eventId, {
      checklist: {
        ...current,
        [key]: !current[key],
      },
    });
  };

  const handleScheduleSave = async (eventId: string) => {
    const current = scheduleDraft[eventId];
    if (!current) return;
    const res = await fetch("/api/admin/couple-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "update_event_meta",
        eventId,
        eventDate: current.event_date,
        venue: current.venue,
      }),
    });
    const data = await parseJsonResponse<{ error?: string }>(res);
    if (!res.ok) {
      alert(data.error || "שגיאה בעדכון האירוע");
      return;
    }
    setEvents((prev) => prev.map((item) => item.id === eventId ? { ...item, event_date: current.event_date, venue: current.venue } : item));
    setEditingScheduleId((currentId) => currentId === eventId ? null : currentId);
  };

  const getLink = (token: string) => (
    djSlug
      ? `${getSafeOrigin()}/dj/${djSlug}?token=${token}`
      : `${getSafeOrigin()}/?token=${token}`
  );

  const copyLink = async (token: string, eventId: string) => {
    const copiedOk = await safeCopyText(getLink(token));
    if (!copiedOk) return;
    setCopiedId(eventId);
    trackAnalytics("couple_link_copied", {
      category: "admin",
      djId: profileId || undefined,
    });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const shareWhatsApp = (token: string, nameA: string, nameB: string) => {
    const eventNumber = events.find((event) => event.magic_token === token)?.token;
    const names = [nameA, nameB].filter(Boolean).join(" & ");
    const greeting = names ? `שלום ${names}!` : "שלום!";
    const eventNumberLine = eventNumber ? `מספר האירוע שלכם: ${eventNumber}\n` : "";
    const text = `${greeting} 🎵\nהכנתי לכם שאלון מוזיקלי לאירוע — מלאו אותו ונדייק את הפלייליסט.\n${eventNumberLine}${getLink(token)}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
    trackAnalytics("couple_link_shared_whatsapp", {
      category: "admin",
      djId: profileId || undefined,
    });
  };

  const toggleExpanded = async (eventId: string) => {
    const willExpand = expandedId !== eventId;
    setExpandedId(willExpand ? eventId : null);
    if (!willExpand) return;
    setActiveTabByEvent((prev) => ({
      ...prev,
      [eventId]: prev[eventId] || "overview",
    }));
  };

  const setEventTab = async (eventId: string, tab: DetailTab) => {
    setActiveTabByEvent((prev) => ({
      ...prev,
      [eventId]: tab,
    }));
    if (tab === "overview" || detailByEvent[eventId]) return;
    await loadEventDetail(eventId);
  };

  const detailTabs = useMemo(() => ([
    { id: "overview" as const, label: "סקירה", icon: <ClipboardList className="w-3.5 h-3.5" /> },
    { id: "answers" as const, label: "שאלון", icon: <FileText className="w-3.5 h-3.5" /> },
    { id: "swipes" as const, label: "שירים", icon: <ListMusic className="w-3.5 h-3.5" /> },
    { id: "requests" as const, label: "בקשות", icon: <MessageSquareText className="w-3.5 h-3.5" /> },
    { id: "summary" as const, label: "סיכום", icon: <Check className="w-3.5 h-3.5" /> },
  ]), []);

  const sortedEvents = useMemo(
    () => [...events].sort((a, b) => toTimestamp(a.event_date) - toTimestamp(b.event_date)),
    [events]
  );
  const upcomingEvents = useMemo(() => sortedEvents.filter((event) => !isPastEvent(event.event_date)), [sortedEvents]);
  const pastEvents = useMemo(() => sortedEvents.filter((event) => isPastEvent(event.event_date)).reverse(), [sortedEvents]);

  return (
    <div className="space-y-4">
      <div className="rounded-[24px] border border-white/10 bg-[rgba(12,16,24,0.72)] backdrop-blur-xl shadow-[0_16px_36px_rgba(0,0,0,0.16)] p-4 md:p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] text-secondary">
              <Link className="w-3.5 h-3.5 text-brand-blue" />
              שאלוני זוגות
            </div>
            <div>
              <h2 className="text-xl font-bold">שאלוני זוגות והעדפות מוזיקליות</h2>
              <p className="text-sm text-secondary mt-1 max-w-3xl leading-6">
                כאן מנהלים את עולם הזוגות: שולחים קישור, רואים מה הם אהבו, מה פסלו, אילו בקשות השאירו, ומה צריך לסגור מולם לפני האירוע.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-primary text-xs flex items-center gap-1 px-3 py-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            קישור חדש
          </button>
        </div>
      </div>

      {/* Create Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="glass-card p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={newNameA}
                  onChange={(e) => setNewNameA(e.target.value)}
                  placeholder="שם ראשון"
                  className="px-3 py-2 rounded-xl bg-transparent border border-glass text-sm focus:outline-none focus:border-brand-blue"
                />
                <input
                  type="text"
                  value={newNameB}
                  onChange={(e) => setNewNameB(e.target.value)}
                  placeholder="שם שני"
                  className="px-3 py-2 rounded-xl bg-transparent border border-glass text-sm focus:outline-none focus:border-brand-blue"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-transparent border border-glass text-sm focus:outline-none focus:border-brand-blue"
                >
                  <option value="wedding">חתונה</option>
                  <option value="bar_mitzvah">בר/בת מצווה</option>
                  <option value="private">אירוע פרטי</option>
                  <option value="corporate">עסקי</option>
                  <option value="other">אחר</option>
                </select>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-transparent border border-glass text-sm focus:outline-none focus:border-brand-blue"
                />
                <input
                  type="text"
                  value={newVenue}
                  onChange={(e) => setNewVenue(e.target.value)}
                  placeholder="אולם/מקום"
                  className="px-3 py-2 rounded-xl bg-transparent border border-glass text-sm focus:outline-none focus:border-brand-blue"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowForm(false)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-glass text-muted"
                >
                  ביטול
                </button>
                <button
                  onClick={handleCreate}
                  disabled={creating}
                  className="btn-primary text-xs px-4 py-1.5 flex items-center gap-1"
                >
                  {creating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                  צור קישור
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading */}
      {!profileId && (
        <div className="glass-card p-4 text-center">
          <p className="text-sm text-muted">טוען את סביבת הזוגות שלך...</p>
        </div>
      )}

      {profileId && loading && events.length === 0 && (
        <div className="flex justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-brand-blue" />
        </div>
      )}

      {loadError && (
        <div className="glass-card p-4 text-center">
          <p className="text-sm" style={{ color: "var(--accent-danger)" }}>
            {loadError}
          </p>
        </div>
      )}

      {/* Empty State */}
      {!loading && !loadError && events.length === 0 && (
        <div className="glass-card p-8 text-center">
          <Link className="w-10 h-10 text-muted mx-auto mb-3" />
          <p className="text-sm text-muted">עדיין אין שאלוני זוגות פעילים</p>
          <p className="text-xs text-secondary mt-2">צרו קישור חדש כדי לשלוח לזוג הראשון, לאסוף העדפות ולבנות עליו את ה-CRM המוזיקלי שלכם.</p>
        </div>
      )}

      {!!upcomingEvents.length && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-secondary">אירועים קרובים</h3>
            <span className="text-xs text-muted">{upcomingEvents.length} אירועים</span>
          </div>
          {upcomingEvents.map((ev) => {
            const isExpanded = expandedId === ev.id;
            const names = [ev.couple_name_a, ev.couple_name_b].filter(Boolean).join(" & ");
            const detail = detailByEvent[ev.id];
            const detailError = detailErrorByEvent[ev.id];
            const activeTab = activeTabByEvent[ev.id] || "overview";
            const swipeCounts = detail ? {
              like: detail.swipes.filter((swipe) => swipe.action === "like").length,
              super_like: detail.swipes.filter((swipe) => swipe.action === "super_like").length,
              dislike: detail.swipes.filter((swipe) => swipe.action === "dislike").length,
              unsure: detail.swipes.filter((swipe) => swipe.action === "unsure").length,
            } : null;
            const questionMap = detail ? new Map(detail.questions.map((question) => [question.id, question])) : new Map<string, DetailEventData["questions"][number]>();
            const songMap = detail ? new Map(detail.songs.map((song) => [song.id, song])) : new Map<string, DetailEventData["songs"][number]>();
            const snapshot = buildCoupleSnapshot({ detail, questionMap, songMap });
            const swipeFilter = swipeFilterByEvent[ev.id] || "all";
            const filteredSwipes = detail ? detail.swipes.filter((swipe) => swipeFilter === "all" ? true : swipe.action === swipeFilter) : [];
            const crm = crmByEvent[ev.id] || {
              notes: "",
              checklist: {
                callCouple: false,
                closeTimeline: false,
                prepPlaylist: false,
              },
            };
            const completedChecklist = Object.values(crm.checklist).filter(Boolean).length;
            const currentScheduleDraft = scheduleDraft[ev.id] || { event_date: ev.event_date || "", venue: ev.venue || "" };

            return (
              <div key={ev.id} className="glass-card overflow-hidden">
                <button
                  onClick={() => {
                    void toggleExpanded(ev.id);
                  }}
                  className="w-full px-3 py-2.5 text-right hover:bg-glass/10 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                      style={{
                        background: ev.isComplete ? "rgba(3,178,140,0.15)" : "rgba(5,156,192,0.15)",
                        color: ev.isComplete ? "#03b28c" : "#059cc0",
                      }}
                    >
                      {EVENT_ICONS[ev.event_type] || <Music className="w-4 h-4" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold truncate">{names || EVENT_LABELS[ev.event_type] || "אירוע"}</p>
                        {ev.token && <span className="text-[11px] font-mono text-brand-blue">#{ev.token}</span>}
                        <span className="text-[11px] px-2 py-0.5 rounded-full border border-white/10 bg-white/[0.03] text-muted">
                          {STAGE_LABELS[ev.current_stage] || `שלב ${ev.current_stage}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap text-[11px] text-muted mt-1">
                        <span>{ev.event_date ? formatDateLabel(ev.event_date) : "ללא תאריך"}</span>
                        <span>•</span>
                        <span>{ev.venue || "מקום לא הוגדר"}</span>
                        <span>•</span>
                        <span>{ev.answerCount} תשובות</span>
                        <span>•</span>
                        <span>{ev.swipeCount} שירים</span>
                      </div>
                      <p className="text-xs text-secondary mt-2 line-clamp-2">{snapshot.headline}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] text-muted hidden sm:inline">{completedChecklist}/3 משימות</span>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-muted" /> : <ChevronDown className="w-4 h-4 text-muted" />}
                  </div>
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="px-3 pb-3 border-t border-glass/50 pt-3 space-y-2.5">
                        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-2">
                          <div className="glass-card p-3 space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-semibold">הכר את הזוג</p>
                              <span className="text-[11px] text-muted">בלחיצה אחת</span>
                            </div>
                            <p className="text-xs text-secondary leading-5">{snapshot.headline}</p>
                            <div className="grid sm:grid-cols-2 gap-2 text-[11px]">
                              <div className="rounded-xl border border-glass px-2.5 py-2">
                                <p className="text-muted mb-1">אוהבים</p>
                                <p className="leading-5">{snapshot.likes.length > 0 ? snapshot.likes.join(" · ") : "עדיין לא זוהה"}</p>
                              </div>
                              <div className="rounded-xl border border-glass px-2.5 py-2">
                                <p className="text-muted mb-1">קוים אדומים</p>
                                <p className="leading-5">{snapshot.redFlags.length > 0 ? snapshot.redFlags.join(" · ") : "אין עדיין"}</p>
                              </div>
                              <div className="rounded-xl border border-glass px-2.5 py-2">
                                <p className="text-muted mb-1">שירים בולטים</p>
                                <p className="leading-5">{snapshot.mustPlay.length > 0 ? snapshot.mustPlay.join(" · ") : "אין עדיין"}</p>
                              </div>
                              <div className="rounded-xl border border-glass px-2.5 py-2">
                                <p className="text-muted mb-1">בקשות חשובות</p>
                                <p className="leading-5">{snapshot.requests.length > 0 ? snapshot.requests.join(" · ") : "אין עדיין"}</p>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center gap-2 glass-card p-2 rounded-lg">
                              <code className="text-xs text-brand-blue flex-1 truncate" dir="ltr">{getLink(ev.magic_token)}</code>
                              <button onClick={() => copyLink(ev.magic_token, ev.id)} className="p-1.5 rounded-lg hover:bg-brand-blue/10 transition-colors">
                                {copiedId === ev.id ? <Check className="w-3.5 h-3.5 text-brand-green" /> : <Copy className="w-3.5 h-3.5 text-brand-blue" />}
                              </button>
                              <a href={getLink(ev.magic_token)} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg hover:bg-brand-blue/10 transition-colors">
                                <ExternalLink className="w-3.5 h-3.5 text-muted" />
                              </a>
                            </div>

                            <button onClick={() => shareWhatsApp(ev.magic_token, ev.couple_name_a, ev.couple_name_b)} className="btn-secondary w-full text-xs flex items-center justify-center gap-2">
                              <Share2 className="w-3.5 h-3.5" />
                              שלחו בוואטסאפ
                            </button>

                            <div className="grid grid-cols-4 gap-2 text-center">
                              <div className="glass-card p-2 rounded-lg"><p className="text-lg font-bold text-brand-blue">{ev.answerCount}</p><p className="text-xs text-muted">תשובות</p></div>
                              <div className="glass-card p-2 rounded-lg"><p className="text-lg font-bold text-brand-blue">{ev.swipeCount}</p><p className="text-xs text-muted">סוויפים</p></div>
                              <div className="glass-card p-2 rounded-lg"><p className="text-lg font-bold text-brand-blue">{ev.requestCount || 0}</p><p className="text-xs text-muted">בקשות</p></div>
                              <div className="glass-card p-2 rounded-lg"><p className="text-lg font-bold text-brand-blue">{completedChecklist}/3</p><p className="text-xs text-muted">משימות</p></div>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {detailTabs.map((tab) => (
                            <button key={tab.id} onClick={() => setEventTab(ev.id, tab.id)} className={`px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-colors ${activeTab === tab.id ? "bg-brand-blue text-white" : "border border-glass text-muted hover:text-foreground"}`}>
                              {tab.icon}
                              {tab.label}
                            </button>
                          ))}
                        </div>

                        {detailLoadingId === ev.id && !detail ? (
                          <div className="glass-card p-6 text-center text-sm text-muted">
                            <Loader2 className="w-4 h-4 animate-spin mx-auto mb-2 text-brand-blue" />
                            טוען פרטי אירוע...
                          </div>
                        ) : null}

                        {detailError && activeTab !== "overview" ? (
                          <div className="glass-card p-4 text-sm text-center" style={{ color: "var(--accent-danger)" }}>
                            {detailError}
                          </div>
                        ) : null}

                        {detail && activeTab === "overview" && (
                          <div className="space-y-3">
                            <div className="grid sm:grid-cols-2 gap-3">
                              <div className="glass-card p-3 space-y-2">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="text-sm font-semibold">תפעול האירוע</p>
                                  <button
                                    onClick={() => {
                                      setEditingScheduleId((current) => current === ev.id ? null : ev.id);
                                      setScheduleDraft((prev) => ({
                                        ...prev,
                                        [ev.id]: {
                                          event_date: prev[ev.id]?.event_date ?? ev.event_date ?? "",
                                          venue: prev[ev.id]?.venue ?? ev.venue ?? "",
                                        },
                                      }));
                                    }}
                                    className="text-xs text-brand-blue inline-flex items-center gap-1"
                                  >
                                    <Edit3 className="w-3 h-3" />
                                    שינוי תאריך
                                  </button>
                                </div>
                                {editingScheduleId === ev.id ? (
                                  <div className="space-y-2">
                                    <input
                                      type="datetime-local"
                                      value={currentScheduleDraft.event_date ? currentScheduleDraft.event_date.slice(0, 16) : ""}
                                      onChange={(e) => setScheduleDraft((prev) => ({ ...prev, [ev.id]: { ...currentScheduleDraft, event_date: e.target.value ? new Date(e.target.value).toISOString() : "" } }))}
                                      className="w-full px-3 py-2 rounded-xl bg-transparent border border-glass text-sm"
                                      dir="ltr"
                                    />
                                    <input
                                      type="text"
                                      value={currentScheduleDraft.venue}
                                      onChange={(e) => setScheduleDraft((prev) => ({ ...prev, [ev.id]: { ...currentScheduleDraft, venue: e.target.value } }))}
                                      placeholder="מקום האירוע"
                                      className="w-full px-3 py-2 rounded-xl bg-transparent border border-glass text-sm"
                                    />
                                    <button onClick={() => void handleScheduleSave(ev.id)} className="btn-primary text-xs inline-flex items-center gap-1">
                                      <Save className="w-3 h-3" />
                                      שמור תאריך
                                    </button>
                                  </div>
                                ) : (
                                  <>
                                    <p className="text-xs text-muted flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> תאריך: {formatDateLabel(ev.event_date)}</p>
                                    <p className="text-xs text-muted flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> מקום: {ev.venue || "—"}</p>
                                    <p className="text-xs text-muted">נוצר: {formatDateLabel(ev.created_at)}</p>
                                    <p className="text-xs text-muted">עודכן: {formatDateLabel(ev.updated_at || ev.created_at)}</p>
                                  </>
                                )}
                              </div>
                              <div className="glass-card p-3 space-y-2">
                                <p className="text-sm font-semibold">סקירה חכמה</p>
                                <p className="text-xs text-muted">שאלון: {ev.answerCount > 0 ? "יש תוכן" : "עדיין ריק"}</p>
                                <p className="text-xs text-muted">שירים: {ev.swipeCount > 0 ? "יש בחירות" : "עוד לא התחילו"}</p>
                                <p className="text-xs text-muted">בקשות: {(ev.requestCount || 0) > 0 ? "יש בקשות מיוחדות" : "אין בקשות עדיין"}</p>
                                <p className="text-xs text-muted">השלב הבא: {ev.current_stage <= 1 ? "לעודד מילוי שאלון" : ev.current_stage === 2 ? "לעבור על בחירות שירים" : ev.current_stage === 3 ? "לסגור בקשות מיוחדות" : "מוכן לסיכום אחרון"}</p>
                              </div>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-3">
                              <div className="glass-card p-3 space-y-2">
                                <p className="text-sm font-semibold">Checklist לדיג׳יי</p>
                                <button onClick={() => toggleChecklist(ev.id, "callCouple")} className="w-full text-right text-xs rounded-xl border border-glass px-3 py-2">
                                  {crm.checklist.callCouple ? "☑" : "☐"} לתאם שיחת זוג
                                </button>
                                <button onClick={() => toggleChecklist(ev.id, "closeTimeline")} className="w-full text-right text-xs rounded-xl border border-glass px-3 py-2">
                                  {crm.checklist.closeTimeline ? "☑" : "☐"} לסגור לו״ז ורגעים חשובים
                                </button>
                                <button onClick={() => toggleChecklist(ev.id, "prepPlaylist")} className="w-full text-right text-xs rounded-xl border border-glass px-3 py-2">
                                  {crm.checklist.prepPlaylist ? "☑" : "☐"} להכין playlist final
                                </button>
                              </div>
                              <div className="glass-card p-3 space-y-2">
                                <p className="text-sm font-semibold">הערות פנימיות</p>
                                <textarea
                                  value={crm.notes}
                                  onChange={(e) => updateCrmMeta(ev.id, { notes: e.target.value })}
                                  placeholder="נקודות, רגישויות, follow-up, תזכורות..."
                                  className="w-full min-h-[112px] resize-y rounded-xl border border-glass bg-transparent px-3 py-2 text-sm"
                                />
                              </div>
                            </div>

                            <div className="glass-card p-3 space-y-2">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-sm font-semibold">יומן / סנכרון</p>
                                <span className="text-[11px] rounded-full border border-white/10 bg-white/[0.03] px-2 py-1 text-muted">בקרוב</span>
                              </div>
                              <p className="text-xs text-muted leading-5">
                                כאן יופיע סטטוס חיבור היומן של הדיג׳יי, יצירת event אוטומטי, והתראות אם תאריך האירוע השתנה או לא סונכרן.
                              </p>
                              <div className="inline-flex items-center gap-1 text-[11px] text-brand-blue">
                                <Sparkles className="w-3 h-3" />
                                מוכן לשלב Google Calendar sync
                              </div>
                            </div>
                          </div>
                        )}

                        {detail && activeTab === "answers" && (
                          <div className="space-y-2">
                            {detail.answers.length === 0 ? <div className="glass-card p-4 text-sm text-muted text-center">עדיין אין תשובות שאלון</div> : detail.answers.map((answer) => (
                              <div key={answer.id} className="glass-card p-3">
                                <p className="text-sm font-medium mb-1">{getQuestionDisplay(answer.question_id, questionMap)?.question_he || "שאלה ללא כותרת"}</p>
                                <p className="text-xs text-secondary">{formatAnswerForDisplay(answer.answer_value, getQuestionDisplay(answer.question_id, questionMap))}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {detail && activeTab === "swipes" && (
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              <div className="glass-card p-2 text-center"><p className="text-lg font-bold text-brand-blue">{swipeCounts?.like || 0}</p><p className="text-xs text-muted">אהבו</p></div>
                              <div className="glass-card p-2 text-center"><p className="text-lg font-bold text-brand-blue">{swipeCounts?.super_like || 0}</p><p className="text-xs text-muted">סופר</p></div>
                              <div className="glass-card p-2 text-center"><p className="text-lg font-bold text-brand-blue">{swipeCounts?.dislike || 0}</p><p className="text-xs text-muted">לא אהבו</p></div>
                              <div className="glass-card p-2 text-center"><p className="text-lg font-bold text-brand-blue">{swipeCounts?.unsure || 0}</p><p className="text-xs text-muted">לא בטוחים</p></div>
                            </div>

                            <div className="glass-card p-3 space-y-3">
                              <div className="flex items-center justify-between gap-3 flex-wrap">
                                <p className="text-sm font-semibold">סקירה מהירה לשירים</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {[
                                    { id: "all" as const, label: `הכול (${detail.swipes.length})` },
                                    { id: "super_like" as const, label: `חובה (${swipeCounts?.super_like || 0})` },
                                    { id: "like" as const, label: `אהבו (${swipeCounts?.like || 0})` },
                                    { id: "dislike" as const, label: `לא אהבו (${swipeCounts?.dislike || 0})` },
                                    { id: "unsure" as const, label: `מתלבטים (${swipeCounts?.unsure || 0})` },
                                  ].map((filter) => (
                                    <button
                                      key={filter.id}
                                      onClick={() => setSwipeFilterByEvent((prev) => ({ ...prev, [ev.id]: filter.id }))}
                                      className={`px-2.5 py-1 rounded-full text-[11px] border transition-colors ${swipeFilter === filter.id ? "border-brand-blue bg-brand-blue/10 text-brand-blue" : "border-glass text-muted hover:text-foreground"}`}
                                    >
                                      {filter.label}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              <div className="grid sm:grid-cols-2 gap-2 text-[11px]">
                                <div className="rounded-xl border border-glass px-3 py-2">
                                  <p className="text-muted mb-1">Top אהובים</p>
                                  <p className="leading-5">
                                    {detail.swipes
                                      .filter((swipe) => swipe.action === "super_like" || swipe.action === "like")
                                      .slice(0, 3)
                                      .map((swipe) => songMap.get(swipe.song_id)?.title || "שיר שלא זוהה")
                                      .join(" · ") || "אין עדיין"}
                                  </p>
                                </div>
                                <div className="rounded-xl border border-glass px-3 py-2">
                                  <p className="text-muted mb-1">Top פסילות</p>
                                  <p className="leading-5">
                                    {detail.swipes
                                      .filter((swipe) => swipe.action === "dislike")
                                      .slice(0, 3)
                                      .map((swipe) => {
                                        const reasons = parseReasonChips(swipe.reason_chips).map((chip) => getReasonChipLabel(chip)).join(", ");
                                        const title = songMap.get(swipe.song_id)?.title || "שיר שלא זוהה";
                                        return reasons ? `${title} (${reasons})` : title;
                                      })
                                      .join(" · ") || "אין עדיין"}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {detail.swipes.length === 0 ? <div className="glass-card p-4 text-sm text-muted text-center">עדיין אין בחירות שירים</div> : filteredSwipes.length === 0 ? (
                              <div className="glass-card p-4 text-sm text-muted text-center">אין שירים בקטגוריה שבחרת</div>
                            ) : filteredSwipes.map((swipe) => {
                              const song = songMap.get(swipe.song_id);
                              const media = resolveSongMedia(song?.preview_url, song?.external_link);
                              const reasons = parseReasonChips(swipe.reason_chips);
                              const isExpanded = expandedSwipeId === swipe.id;
                              return (
                                <div key={swipe.id} className="glass-card p-3 space-y-2">
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                      <p className="text-sm font-medium">{song ? `${song.title} - ${song.artist}` : "שיר שלא זוהה"}</p>
                                      <p className="text-[11px] text-muted mt-1">
                                        {swipe.action === "dislike"
                                          ? "הזוג פסל את השיר הזה"
                                          : swipe.action === "super_like"
                                            ? "הזוג סימן את השיר הזה כחובה"
                                            : swipe.action === "like"
                                              ? "הזוג אהב את השיר הזה"
                                              : "הזוג עדיין מתלבט על השיר הזה"}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                      <span className={`text-xs px-2 py-1 rounded-full border ${swipe.action === "dislike" ? "border-[var(--accent-danger)]/20 text-[var(--accent-danger)] bg-[rgba(255,68,102,0.08)]" : swipe.action === "super_like" ? "border-[var(--accent-gold)]/20 text-[var(--accent-gold)] bg-[rgba(245,197,66,0.08)]" : "border-brand-blue/20 text-brand-blue bg-brand-blue/10"}`}>
                                        {getSwipeActionLabel(swipe.action)}
                                      </span>
                                      <button
                                        onClick={() => setExpandedSwipeId((current) => current === swipe.id ? null : swipe.id)}
                                        className="p-1 rounded-lg hover:bg-white/5 transition-colors"
                                      >
                                        {isExpanded ? <ChevronUp className="w-4 h-4 text-muted" /> : <ChevronDown className="w-4 h-4 text-muted" />}
                                      </button>
                                    </div>
                                  </div>

                                  {reasons.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                      {reasons.map((chip) => <span key={`${swipe.id}-${chip}`} className="text-[11px] px-2 py-0.5 rounded-full border border-glass text-muted">{getReasonChipLabel(chip)}</span>)}
                                    </div>
                                  )}

                                  {isExpanded && (
                                    <div className="rounded-2xl border border-glass p-3 space-y-3 bg-white/[0.02]">
                                      <div className="flex items-center justify-between gap-3">
                                        <p className="text-xs text-secondary">
                                          {media.canPlayInline ? `נגן פנימי: ${media.sourceLabel}` : media.helperText}
                                        </p>
                                        {media.externalUrl ? (
                                          <a
                                            href={media.externalUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-brand-blue inline-flex items-center gap-1"
                                          >
                                            <ExternalLink className="w-3.5 h-3.5" />
                                            פתח מקור
                                          </a>
                                        ) : null}
                                      </div>

                                      {media.type === "audio_file" && media.inlineUrl ? (
                                        <audio controls preload="none" className="w-full">
                                          <source src={media.inlineUrl} />
                                        </audio>
                                      ) : null}

                                      {media.type === "youtube" && media.youtubeId ? (
                                        <div className="overflow-hidden rounded-xl border border-glass aspect-video">
                                          <iframe
                                            src={`https://www.youtube.com/embed/${media.youtubeId}`}
                                            title={song ? `${song.title} preview` : "song preview"}
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                            className="w-full h-full"
                                          />
                                        </div>
                                      ) : null}

                                      {!media.canPlayInline && !media.externalUrl ? (
                                        <p className="text-xs text-muted">אין פריוויו זמין לשיר הזה כרגע.</p>
                                      ) : null}

                                      {swipe.action === "dislike" && (
                                        <div className="rounded-xl border border-[var(--accent-danger)]/20 bg-[rgba(255,68,102,0.06)] px-3 py-2">
                                          <p className="text-xs font-medium" style={{ color: "var(--accent-danger)" }}>למה הם לא אהבו?</p>
                                          <p className="text-xs text-secondary mt-1">
                                            {reasons.length > 0 ? reasons.map((chip) => getReasonChipLabel(chip)).join(" · ") : "לא הוזנה סיבה ספציפית"}
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {detail && activeTab === "requests" && (
                          <div className="space-y-2">
                            {detail.requests.length === 0 ? <div className="glass-card p-4 text-sm text-muted text-center">עדיין אין בקשות</div> : detail.requests.map((request) => (
                              <div key={request.id} className="glass-card p-3">
                                <div className="flex items-center justify-between gap-3 mb-1">
                                  <p className="text-sm font-medium">{request.content || "—"}</p>
                                  <span className="text-xs text-brand-blue">{getRequestTypeLabel(request.request_type)}</span>
                                </div>
                                {request.moment_type && <p className="text-xs text-muted">רגע באירוע: {getMomentTypeLabel(request.moment_type)}</p>}
                              </div>
                            ))}
                          </div>
                        )}

                        {detail && activeTab === "summary" && (
                          <div className="glass-card p-4 space-y-2">
                            <p className="text-sm font-semibold">סיכום מהיר לדיג׳יי</p>
                            <p className="text-xs text-muted">הזוג מילא {detail.answers.length} תשובות, סימן {detail.swipes.length} שירים, והשאיר {detail.requests.length} בקשות.</p>
                            <p className="text-xs text-muted">שירי אהבה: {swipeCounts?.like || 0} | סופר אהבה: {swipeCounts?.super_like || 0} | פסילות: {swipeCounts?.dislike || 0}</p>
                            {detail.answers.length > 0 && (
                              <p className="text-xs text-muted">
                                תובנה מהשאלון: {detail.answers.slice(0, 2).map((answer) => formatAnswerForDisplay(answer.answer_value, getQuestionDisplay(answer.question_id, questionMap))).filter(Boolean).join(" · ")}
                              </p>
                            )}
                            <p className="text-xs text-muted">הערות פנימיות: {crm.notes.trim() ? crm.notes : "אין עדיין"}</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}

      {!!pastEvents.length && (
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-secondary">אירועים שעברו</h3>
            <span className="text-xs text-muted">{pastEvents.length} אירועים</span>
          </div>
          <div className="space-y-2">
            {pastEvents.map((ev) => {
              const names = [ev.couple_name_a, ev.couple_name_b].filter(Boolean).join(" & ");
              return (
                <div key={ev.id} className="glass-card p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{names || EVENT_LABELS[ev.event_type] || "אירוע"}</p>
                      <p className="text-xs text-muted mt-1">{formatDateLabel(ev.event_date)} · {ev.venue || "ללא מקום"}</p>
                    </div>
                    <button
                      onClick={() => {
                        setExpandedId(ev.id);
                        setEditingScheduleId(ev.id);
                        setScheduleDraft((prev) => ({
                          ...prev,
                          [ev.id]: {
                            event_date: ev.event_date || "",
                            venue: ev.venue || "",
                          },
                        }));
                      }}
                      className="text-xs text-brand-blue inline-flex items-center gap-1 shrink-0"
                    >
                      <Edit3 className="w-3 h-3" />
                      שנה תאריך
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
