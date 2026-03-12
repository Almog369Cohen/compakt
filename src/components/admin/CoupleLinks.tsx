"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useProfileStore } from "@/stores/profileStore";
import { trackAnalytics } from "@/hooks/useAnalytics";
import { safeCopyText } from "@/lib/clipboard";
import { getSafeOrigin } from "@/lib/utils";
import type { EventRequest, Question, SongSwipe } from "@/lib/types";
import {
  Link,
  Plus,
  Copy,
  Check,
  Share2,
  Loader2,
  Heart,
  Star,
  PartyPopper,
  Briefcase,
  Music,
  Phone,
  Mail,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  FileText,
  ListMusic,
  ClipboardList,
  MessageSquareText,
  Calendar,
  MapPin,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
    sort_order?: number;
  }>;
  songs: Array<{
    id: string;
    title: string;
    artist: string;
  }>;
}

type DetailTab = "overview" | "answers" | "swipes" | "requests" | "summary";

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

function isEmailContact(value: string | null): boolean {
  return Boolean(value && value.includes("@"));
}

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

  // New link form
  const [showForm, setShowForm] = useState(false);
  const [newNameA, setNewNameA] = useState("");
  const [newNameB, setNewNameB] = useState("");
  const [newType, setNewType] = useState("wedding");
  const [newDate, setNewDate] = useState("");
  const [newVenue, setNewVenue] = useState("");

  const loadEvents = useCallback(async () => {
    if (!profileId) return;
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch("/api/admin/couple-link", { cache: "no-store" });
      const data = await res.json();
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
    try {
      const res = await fetch(`/api/admin/couple-events/${eventId}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "שגיאה בטעינת פרטי אירוע");
      }
      setDetailByEvent((prev) => ({
        ...prev,
        [eventId]: data as DetailEventData,
      }));
    } catch (error) {
      alert(error instanceof Error ? error.message : "שגיאה בטעינת פרטי אירוע");
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
      const data = await res.json();
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
    if (detailByEvent[eventId]) return;
    await loadEventDetail(eventId);
  };

  const setEventTab = (eventId: string, tab: DetailTab) => {
    setActiveTabByEvent((prev) => ({
      ...prev,
      [eventId]: tab,
    }));
  };

  const detailTabs = useMemo(() => ([
    { id: "overview" as const, label: "סקירה", icon: <ClipboardList className="w-3.5 h-3.5" /> },
    { id: "answers" as const, label: "שאלון", icon: <FileText className="w-3.5 h-3.5" /> },
    { id: "swipes" as const, label: "שירים", icon: <ListMusic className="w-3.5 h-3.5" /> },
    { id: "requests" as const, label: "בקשות", icon: <MessageSquareText className="w-3.5 h-3.5" /> },
    { id: "summary" as const, label: "סיכום", icon: <Check className="w-3.5 h-3.5" /> },
  ]), []);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Link className="w-5 h-5 text-brand-blue" />
          קישורי שאלון לזוגות
        </h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary text-xs flex items-center gap-1 px-3 py-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          קישור חדש
        </button>
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
          <p className="text-sm text-muted">
            עדיין אין קישורי שאלון. צרו קישור חדש כדי לשלוח לזוגות
          </p>
        </div>
      )}

      {/* Events List */}
      <div className="space-y-2">
        {events.map((ev) => {
          const isExpanded = expandedId === ev.id;
          const names = [ev.couple_name_a, ev.couple_name_b].filter(Boolean).join(" & ");
          const detail = detailByEvent[ev.id];
          const activeTab = activeTabByEvent[ev.id] || "overview";
          const swipeCounts = detail ? {
            like: detail.swipes.filter((swipe) => swipe.action === "like").length,
            super_like: detail.swipes.filter((swipe) => swipe.action === "super_like").length,
            dislike: detail.swipes.filter((swipe) => swipe.action === "dislike").length,
            unsure: detail.swipes.filter((swipe) => swipe.action === "unsure").length,
          } : null;
          const questionMap = detail
            ? new Map(detail.questions.map((question) => [question.id, question.question_he]))
            : new Map<string, string>();
          const songMap = detail
            ? new Map(detail.songs.map((song) => [song.id, `${song.title} - ${song.artist}`]))
            : new Map<string, string>();

          return (
            <div key={ev.id} className="glass-card overflow-hidden">
              {/* Header row */}
              <button
                onClick={() => {
                  void toggleExpanded(ev.id);
                }}
                className="w-full p-3 flex items-center gap-3 text-right hover:bg-glass/10 transition-colors"
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                  style={{
                    background: ev.isComplete
                      ? "rgba(3,178,140,0.15)"
                      : "rgba(5,156,192,0.15)",
                    color: ev.isComplete ? "#03b28c" : "#059cc0",
                  }}
                >
                  {EVENT_ICONS[ev.event_type] || <Music className="w-4 h-4" />}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">
                    {names || EVENT_LABELS[ev.event_type] || "אירוע"}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted">
                    {ev.event_date && <span>{ev.event_date}</span>}
                    <span>•</span>
                    <span
                      className="font-medium"
                      style={{ color: ev.isComplete ? "#03b28c" : "#059cc0" }}
                    >
                      {STAGE_LABELS[ev.current_stage] || `שלב ${ev.current_stage}`}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {ev.token && <span className="text-[11px] font-mono text-brand-blue">#{ev.token}</span>}
                  <span className="text-xs text-muted">
                    {ev.answerCount} תשובות
                  </span>
                  <span className="text-xs text-muted hidden sm:inline">
                    {ev.requestCount || 0} בקשות
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-muted" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted" />
                  )}
                </div>
              </button>

              {/* Expanded details */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-3 pb-3 border-t border-glass/50 pt-3 space-y-3">
                      <div className="flex items-center gap-2 glass-card p-2 rounded-lg">
                        <code className="text-xs text-brand-blue flex-1 truncate" dir="ltr">
                          {getLink(ev.magic_token)}
                        </code>
                        <button
                          onClick={() => copyLink(ev.magic_token, ev.id)}
                          className="p-1.5 rounded-lg hover:bg-brand-blue/10 transition-colors"
                        >
                          {copiedId === ev.id ? (
                            <Check className="w-3.5 h-3.5 text-brand-green" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 text-brand-blue" />
                          )}
                        </button>
                        <a
                          href={getLink(ev.magic_token)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg hover:bg-brand-blue/10 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-muted" />
                        </a>
                      </div>

                      <button
                        onClick={() => shareWhatsApp(ev.magic_token, ev.couple_name_a, ev.couple_name_b)}
                        className="btn-secondary w-full text-xs flex items-center justify-center gap-2"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        שלחו בוואטסאפ
                      </button>

                      <div className="grid grid-cols-4 gap-2 text-center">
                        <div className="glass-card p-2 rounded-lg">
                          <p className="text-lg font-bold text-brand-blue">{ev.answerCount}</p>
                          <p className="text-xs text-muted">תשובות</p>
                        </div>
                        <div className="glass-card p-2 rounded-lg">
                          <p className="text-lg font-bold text-brand-blue">{ev.swipeCount}</p>
                          <p className="text-xs text-muted">סוויפים</p>
                        </div>
                        <div className="glass-card p-2 rounded-lg">
                          <p className="text-lg font-bold text-brand-blue">{ev.requestCount || 0}</p>
                          <p className="text-xs text-muted">בקשות</p>
                        </div>
                        <div className="glass-card p-2 rounded-lg">
                          <p className="text-lg font-bold" style={{ color: ev.isComplete ? "#03b28c" : "#059cc0" }}>
                            {ev.current_stage}/4
                          </p>
                          <p className="text-xs text-muted">שלב</p>
                        </div>
                      </div>

                      {ev.token && (
                        <p className="text-xs text-muted flex items-center gap-1">
                          <span>מספר אירוע:</span>
                          <span className="font-mono text-brand-blue" dir="ltr">{ev.token}</span>
                        </p>
                      )}

                      {ev.email && (
                        <p className="text-xs text-muted flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          מייל: <span className="font-mono" dir="ltr">{ev.email}</span>
                        </p>
                      )}

                      {ev.phone_number && (
                        <p className="text-xs text-muted flex items-center gap-1">
                          {isEmailContact(ev.phone_number)
                            ? <Mail className="w-3 h-3" />
                            : <Phone className="w-3 h-3" />}
                          {isEmailContact(ev.phone_number) ? "מייל:" : "טלפון:"} <span className="font-mono" dir="ltr">{ev.phone_number}</span>
                        </p>
                      )}

                      <div className="flex flex-wrap gap-2">
                        {detailTabs.map((tab) => (
                          <button
                            key={tab.id}
                            onClick={() => setEventTab(ev.id, tab.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-colors ${activeTab === tab.id ? "bg-brand-blue text-white" : "border border-glass text-muted hover:text-foreground"}`}
                          >
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

                      {detail && activeTab === "overview" && (
                        <div className="grid sm:grid-cols-2 gap-3">
                          <div className="glass-card p-3 space-y-2">
                            <p className="text-xs text-muted flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> נוצר: {formatDateLabel(ev.created_at)}</p>
                            <p className="text-xs text-muted flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> עודכן: {formatDateLabel(ev.updated_at || ev.created_at)}</p>
                            <p className="text-xs text-muted flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> מקום: {ev.venue || "—"}</p>
                            <p className="text-xs text-muted">סוג אירוע: {EVENT_LABELS[ev.event_type] || ev.event_type}</p>
                          </div>
                          <div className="glass-card p-3 space-y-2">
                            <p className="text-sm font-semibold">סטטוס תוכן</p>
                            <p className="text-xs text-muted">שאלון: {ev.answerCount > 0 ? "קיים" : "עדיין לא"}</p>
                            <p className="text-xs text-muted">בחירות שירים: {ev.swipeCount > 0 ? "קיימות" : "עדיין לא"}</p>
                            <p className="text-xs text-muted">בקשות: {(ev.requestCount || 0) > 0 ? "קיימות" : "עדיין לא"}</p>
                          </div>
                        </div>
                      )}

                      {detail && activeTab === "answers" && (
                        <div className="space-y-2">
                          {detail.answers.length === 0 ? (
                            <div className="glass-card p-4 text-sm text-muted text-center">עדיין אין תשובות שאלון</div>
                          ) : (
                            detail.answers.map((answer) => (
                              <div key={answer.id} className="glass-card p-3">
                                <p className="text-sm font-medium mb-1">{questionMap.get(answer.question_id) || answer.question_id}</p>
                                <p className="text-xs text-secondary">{parseAnswerValue(answer.answer_value)}</p>
                              </div>
                            ))
                          )}
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
                          {detail.swipes.length === 0 ? (
                            <div className="glass-card p-4 text-sm text-muted text-center">עדיין אין בחירות שירים</div>
                          ) : (
                            detail.swipes.map((swipe) => (
                              <div key={swipe.id} className="glass-card p-3">
                                <div className="flex items-center justify-between gap-3">
                                  <p className="text-sm font-medium">{songMap.get(swipe.song_id) || swipe.song_id}</p>
                                  <span className="text-xs text-brand-blue">{swipe.action}</span>
                                </div>
                                {parseReasonChips(swipe.reason_chips).length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {parseReasonChips(swipe.reason_chips).map((chip) => (
                                      <span key={`${swipe.id}-${chip}`} className="text-[11px] px-2 py-0.5 rounded-full border border-glass text-muted">
                                        {chip}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      )}

                      {detail && activeTab === "requests" && (
                        <div className="space-y-2">
                          {detail.requests.length === 0 ? (
                            <div className="glass-card p-4 text-sm text-muted text-center">עדיין אין בקשות</div>
                          ) : (
                            detail.requests.map((request) => (
                              <div key={request.id} className="glass-card p-3">
                                <div className="flex items-center justify-between gap-3 mb-1">
                                  <p className="text-sm font-medium">{request.content || "—"}</p>
                                  <span className="text-xs text-brand-blue">{request.request_type}</span>
                                </div>
                                {request.moment_type && (
                                  <p className="text-xs text-muted">רגע באירוע: {request.moment_type}</p>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      )}

                      {detail && activeTab === "summary" && (
                        <div className="glass-card p-4 space-y-2">
                          <p className="text-sm font-semibold">סיכום מהיר לדיג׳יי</p>
                          <p className="text-xs text-muted">הזוג מילא {detail.answers.length} תשובות, סימן {detail.swipes.length} שירים, והשאיר {detail.requests.length} בקשות.</p>
                          <p className="text-xs text-muted">שירי אהבה: {swipeCounts?.like || 0} | סופר אהבה: {swipeCounts?.super_like || 0} | פסילות: {swipeCounts?.dislike || 0}</p>
                          <p className="text-xs text-muted">שלב נוכחי: {STAGE_LABELS[ev.current_stage] || `שלב ${ev.current_stage}`}</p>
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
    </div>
  );
}
