"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useAdminStore } from "@/stores/adminStore";
import { useProfileStore } from "@/stores/profileStore";
import { useEventsStore, type DJEvent } from "@/stores/eventsStore";
import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  Calendar,
  CheckCircle2,
  Clock3,
  Loader2,
  Mail,
  MapPin,
  MessageCircleWarning,
  Music,
  RefreshCw,
  Sparkles,
  UserRound,
} from "lucide-react";

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

type DashboardAction = {
  id: string;
  title: string;
  detail: string;
  tone: "danger" | "warn" | "info";
  cta: string;
  tab: "couples" | "events" | "profile" | "songs" | "questions";
};

const STAGE_LABELS: Record<number, string> = {
  0: "טרם התחיל",
  1: "מילוי שאלון",
  2: "בחירת שירים",
  3: "בקשות מיוחדות",
  4: "הושלם",
};

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

function formatDateLabel(value?: string | null): string {
  if (!value) return "לא נקבע";
  try {
    return new Date(value).toLocaleDateString("he-IL", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
}

function daysUntil(value?: string | null): number | null {
  if (!value) return null;
  const target = new Date(value).getTime();
  if (Number.isNaN(target)) return null;
  const diff = target - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function getCoupleNames(event: CoupleEvent): string {
  return [event.couple_name_a, event.couple_name_b].filter(Boolean).join(" & ") || "זוג ללא שם";
}

function dispatchAdminTabChange(tab: DashboardAction["tab"]) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("compakt-admin-tab-change", { detail: tab }));
}

function getProfileReadiness(profile: ReturnType<typeof useProfileStore.getState>["profile"]) {
  const checks = [
    { label: "שם עסק", done: Boolean(profile.businessName.trim()) },
    { label: "לינק אישי", done: Boolean(profile.djSlug.trim()) },
    { label: "לוגו או קאבר", done: Boolean(profile.logoUrl || profile.coverUrl) },
    { label: "דרך יצירת קשר", done: Boolean(profile.whatsappNumber || profile.websiteUrl) },
    { label: "טקסט היכרות", done: Boolean(profile.bio || profile.tagline) },
  ];

  const completed = checks.filter((item) => item.done).length;
  const score = Math.round((completed / checks.length) * 100);

  return {
    score,
    checks,
  };
}

function getEventReadiness(event: DJEvent) {
  const missing: string[] = [];
  if (!event.date_time) missing.push("תאריך");
  if (!event.venue) missing.push("מקום");
  if (!event.notes) missing.push("הערות");

  return {
    ready: missing.length === 0,
    missing,
  };
}

function getDashboardErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : "";

  if (message === "Authentication required") {
    return "ההתחברות פגה. רענן את העמוד והתחבר מחדש כדי לראות את פעילות הזוגות.";
  }

  if (message === "Forbidden" || message === "Forbidden: insufficient role" || message === "Forbidden: profile not found") {
    return "אין לך הרשאה לצפות כרגע בפעילות הזוגות.";
  }

  return message || "שגיאה בטעינת נתוני זוגות";
}

export function Dashboard() {
  const profileId = useProfileStore((s) => s.profileId);
  const profile = useProfileStore((s) => s.profile);
  const songs = useAdminStore((s) => s.songs);
  const questions = useAdminStore((s) => s.questions);
  const { events, loading: eventsLoading, error: eventsError, loadEvents } = useEventsStore();

  const [coupleEvents, setCoupleEvents] = useState<CoupleEvent[]>([]);
  const [couplesLoading, setCouplesLoading] = useState(false);
  const [couplesError, setCouplesError] = useState<string | null>(null);

  const loadCoupleEvents = useCallback(async () => {
    if (!profileId) return;
    setCouplesLoading(true);
    setCouplesError(null);
    try {
      const res = await fetch("/api/admin/couple-link", { cache: "no-store" });
      const data = await parseJsonResponse<{ events?: CoupleEvent[]; error?: string }>(res);
      if (!res.ok) {
        throw new Error(data.error || "שגיאה בטעינת נתוני זוגות");
      }
      setCoupleEvents(Array.isArray(data.events) ? data.events : []);
    } catch (error) {
      setCoupleEvents([]);
      setCouplesError(getDashboardErrorMessage(error));
    } finally {
      setCouplesLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    if (!profileId) return;
    void loadCoupleEvents();
  }, [loadCoupleEvents, profileId]);

  useEffect(() => {
    if (profileId) {
      void loadEvents(profileId);
    }
  }, [loadEvents, profileId]);

  const profileReadiness = useMemo(() => getProfileReadiness(profile), [profile]);
  const activeQuestions = useMemo(() => questions.filter((question) => question.isActive).length, [questions]);
  const activeSongs = useMemo(() => songs.filter((song) => song.isActive).length, [songs]);

  const dashboardData = useMemo(() => {
    const now = Date.now();
    const sortedCoupleEvents = [...coupleEvents].sort((a, b) => {
      const first = a.event_date ? new Date(a.event_date).getTime() : Number.POSITIVE_INFINITY;
      const second = b.event_date ? new Date(b.event_date).getTime() : Number.POSITIVE_INFINITY;
      return first - second;
    });

    const incompleteCouples = sortedCoupleEvents.filter((event) => !event.isComplete);
    const completedCouples = sortedCoupleEvents.filter((event) => event.isComplete);
    const resumedCouples = incompleteCouples.filter((event) => event.current_stage > 0);
    const missingContact = sortedCoupleEvents.filter((event) => !event.email && !event.phone_number);
    const waitingForSongs = incompleteCouples.filter((event) => event.current_stage === 1 && event.answerCount > 0);
    const recentCoupleActivity = [...sortedCoupleEvents]
      .sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime())
      .slice(0, 5);
    const upcomingCouples = sortedCoupleEvents.filter((event) => {
      if (!event.event_date) return true;
      const target = new Date(event.event_date).getTime();
      return Number.isNaN(target) ? true : target >= now;
    }).slice(0, 4);

    const upcomingEvents = [...events]
      .filter((event) => event.status === "upcoming" || event.status === "confirmed")
      .sort((a, b) => {
        const first = a.date_time ? new Date(a.date_time).getTime() : Number.POSITIVE_INFINITY;
        const second = b.date_time ? new Date(b.date_time).getTime() : Number.POSITIVE_INFINITY;
        return first - second;
      });

    const nextWeekEvents = upcomingEvents.filter((event) => {
      const target = event.date_time ? new Date(event.date_time).getTime() : null;
      if (!target || Number.isNaN(target)) return false;
      const diff = target - now;
      return diff >= 0 && diff <= 1000 * 60 * 60 * 24 * 7;
    });

    const eventsMissingSetup = upcomingEvents.filter((event) => !getEventReadiness(event).ready);

    const readinessItems = [
      { label: "פרופיל DJ", done: profileReadiness.score >= 80, detail: `${profileReadiness.score}% הושלם`, tab: "profile" as const },
      { label: "שאלון מוכן", done: activeQuestions >= 5, detail: `${activeQuestions} שאלות פעילות`, tab: "questions" as const },
      { label: "ספריית שירים", done: activeSongs >= 10, detail: `${activeSongs} שירים פעילים`, tab: "songs" as const },
      { label: "אירועים קרובים", done: nextWeekEvents.length > 0, detail: nextWeekEvents.length > 0 ? `${nextWeekEvents.length} אירועים בשבוע הקרוב` : "עדיין אין אירועים קרובים", tab: "events" as const },
    ];

    const attentionItems: DashboardAction[] = [];

    if (resumedCouples.length > 0) {
      const couple = resumedCouples[0];
      attentionItems.push({
        id: "resume-couple",
        title: "יש זוגות שהתחילו ולא סיימו",
        detail: `${getCoupleNames(couple)} כרגע ב-${STAGE_LABELS[couple.current_stage] || "תהליך פעיל"}`,
        tone: "warn",
        cta: "פתח שאלונים",
        tab: "couples",
      });
    }

    if (missingContact.length > 0) {
      const couple = missingContact[0];
      attentionItems.push({
        id: "missing-contact",
        title: "יש זוגות בלי פרטי קשר ברורים",
        detail: `${getCoupleNames(couple)} ללא מייל או מספר טלפון מזוהה`,
        tone: "danger",
        cta: "בדוק שאלונים",
        tab: "couples",
      });
    }

    if (eventsMissingSetup.length > 0) {
      const upcoming = eventsMissingSetup[0];
      const readiness = getEventReadiness(upcoming);
      attentionItems.push({
        id: "missing-event-setup",
        title: "יש אירועים קרובים שעדיין לא מוכנים",
        detail: `${upcoming.name} חסר: ${readiness.missing.join(", ")}`,
        tone: "warn",
        cta: "פתח אירועים",
        tab: "events",
      });
    }

    if (profileReadiness.score < 80) {
      attentionItems.push({
        id: "profile-readiness",
        title: "הפרופיל עדיין לא שלם",
        detail: `כדאי להשלים עוד ${100 - profileReadiness.score}% כדי להיראות מקצועי יותר`,
        tone: "info",
        cta: "השלם פרופיל",
        tab: "profile",
      });
    }

    if (activeSongs < 10 || activeQuestions < 5) {
      attentionItems.push({
        id: "setup-readiness",
        title: "המערכת עוד לא מוכנה לגמרי לקבל זוגות",
        detail: `ספרייה: ${activeSongs} שירים, שאלון: ${activeQuestions} שאלות`,
        tone: "info",
        cta: "בדוק הגדרות",
        tab: activeSongs < 10 ? "songs" : "questions",
      });
    }

    return {
      incompleteCouples,
      completedCouples,
      waitingForSongs,
      recentCoupleActivity,
      upcomingEvents,
      upcomingCouples,
      nextWeekEvents,
      readinessItems,
      attentionItems: attentionItems.slice(0, 4),
    };
  }, [activeQuestions, activeSongs, coupleEvents, events, profileReadiness.score]);

  const summaryLine = useMemo(() => {
    const pieces: string[] = [];
    if (dashboardData.attentionItems.length > 0) {
      pieces.push(`${dashboardData.attentionItems.length} דברים מחכים לטיפול`);
    }
    if (dashboardData.nextWeekEvents.length > 0) {
      pieces.push(`${dashboardData.nextWeekEvents.length} אירועים בשבוע הקרוב`);
    }
    if (dashboardData.incompleteCouples.length > 0) {
      pieces.push(`${dashboardData.incompleteCouples.length} שאלונים בתהליך`);
    }
    if (pieces.length === 0) {
      return "המערכת שקטה כרגע. זה זמן טוב לסדר אירועים, פרופיל וספריית שירים.";
    }
    return pieces.join(" · ");
  }, [dashboardData.attentionItems.length, dashboardData.incompleteCouples.length, dashboardData.nextWeekEvents.length]);

  const launchChecklist = useMemo(
    () => [
      {
        label: "להשלים פרופיל DJ",
        done: profileReadiness.score >= 80,
        detail: profileReadiness.score >= 80 ? "הפרופיל כבר נראה מוכן לפרסום" : "השלם שם עסק, טקסט היכרות ודרך יצירת קשר",
        tab: "profile" as const,
      },
      {
        label: "להכין שאלון",
        done: activeQuestions >= 5,
        detail: activeQuestions >= 5 ? `${activeQuestions} שאלות פעילות מוכנות` : "הוסף לפחות 5 שאלות פעילות לפני שליחה לזוגות",
        tab: "questions" as const,
      },
      {
        label: "לבנות ספריית שירים",
        done: activeSongs >= 10,
        detail: activeSongs >= 10 ? `${activeSongs} שירים פעילים זמינים לזוגות` : "הוסף שירים בסיסיים כדי שהזוגות יתחילו לסמן העדפות",
        tab: "songs" as const,
      },
      {
        label: "לשלוח שאלון לזוג ראשון",
        done: coupleEvents.length > 0,
        detail: coupleEvents.length > 0 ? `${coupleEvents.length} זוגות כבר קיבלו שאלון` : "צור קישור לשאלון הזוגות ושלח אותו ללקוח הראשון",
        tab: "couples" as const,
      },
    ],
    [activeQuestions, activeSongs, coupleEvents.length, profileReadiness.score]
  );

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-[24px] border border-white/10 bg-[rgba(12,16,24,0.72)] backdrop-blur-xl shadow-[0_16px_36px_rgba(0,0,0,0.18)] p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] text-muted">
              <BarChart3 className="w-3.5 h-3.5 text-brand-blue" />
              מרכז הבקרה שלך
            </div>
            <div>
              <h2 className="text-2xl font-bold">דשבורד DJ</h2>
              <p className="text-sm text-secondary mt-1">{summaryLine}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <QuickActionButton label="שאלונים" onClick={() => dispatchAdminTabChange("couples")} />
            <QuickActionButton label="אירועים" onClick={() => dispatchAdminTabChange("events")} />
            <QuickActionButton label="פרופיל" onClick={() => dispatchAdminTabChange("profile")} />
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <MetricCard label="שאלונים בתהליך" value={dashboardData.incompleteCouples.length} sublabel="דורשים מעקב" tone="brand" />
        <MetricCard label="השלימו מלא" value={dashboardData.completedCouples.length} sublabel="זוגות שסיימו" tone="success" />
        <MetricCard label="אירועים קרובים" value={dashboardData.nextWeekEvents.length} sublabel="7 ימים קדימה" tone="warn" />
        <MetricCard label="מוכנות מערכת" value={`${Math.round((profileReadiness.score + Math.min(activeSongs * 5, 100) + Math.min(activeQuestions * 10, 100)) / 3)}%`} sublabel="פרופיל, שירים ושאלון" tone="neutral" />
      </div>

      <SectionCard title="צ׳ק ליסט השקה מהיר" subtitle="המסלול הקצר ביותר ל-DJ חדש לפני שליחה ללקוחות">
        <div className="grid md:grid-cols-2 gap-3">
          {launchChecklist.map((item) => (
            <button
              key={item.label}
              onClick={() => dispatchAdminTabChange(item.tab)}
              className="w-full rounded-[18px] border border-white/10 bg-white/[0.03] px-4 py-3 text-right hover:bg-white/[0.05] transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{item.label}</p>
                  <p className="text-xs text-secondary mt-1 leading-5">{item.detail}</p>
                </div>
                <span className={`inline-flex px-2.5 py-1 rounded-full border text-[11px] shrink-0 ${item.done ? "border-brand-green/20 bg-brand-green/10 text-brand-green" : "border-white/10 bg-black/15 text-muted"}`}>
                  {item.done ? "מוכן" : "השלם"}
                </span>
              </div>
            </button>
          ))}
        </div>
      </SectionCard>

      <div className="grid xl:grid-cols-[1.1fr_0.9fr] gap-4">
        <SectionCard
          title="דורש טיפול עכשיו"
          subtitle="רק מה שבאמת צריך ממך פעולה"
          action={(
            <button onClick={loadCoupleEvents} className="p-2 rounded-xl text-muted hover:text-foreground transition-colors" aria-label="רענן">
              <RefreshCw className={`w-4 h-4 ${couplesLoading ? "animate-spin" : ""}`} />
            </button>
          )}
        >
          {!profileId ? (
            <LoadingState label="טוען את סביבת הזוגות שלך..." />
          ) : couplesLoading && dashboardData.attentionItems.length === 0 ? (
            <LoadingState label="טוען משימות..." />
          ) : dashboardData.attentionItems.length === 0 ? (
            <EmptyState icon={<CheckCircle2 className="w-5 h-5 text-brand-green" />} title="אין משהו דחוף כרגע" detail="כל הזוגות והאירועים במצב יציב כרגע." />
          ) : (
            <div className="space-y-2.5">
              {dashboardData.attentionItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => dispatchAdminTabChange(item.tab)}
                  className="w-full rounded-[18px] border border-white/10 bg-white/[0.03] px-4 py-3 text-right hover:bg-white/[0.05] transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`inline-flex w-2.5 h-2.5 rounded-full ${item.tone === "danger" ? "bg-[var(--accent-danger)]" : item.tone === "warn" ? "bg-[var(--accent-gold)]" : "bg-brand-blue"}`} />
                        <p className="text-sm font-semibold">{item.title}</p>
                      </div>
                      <p className="text-xs text-secondary leading-5">{item.detail}</p>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[11px] text-brand-blue whitespace-nowrap">
                      {item.cta}
                      <ArrowLeft className="w-3 h-3" />
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="מוכנות והגדרות" subtitle="מה חסר כדי להרגיש מוכן לעבודה">
          <div className="space-y-2.5">
            {dashboardData.readinessItems.map((item) => (
              <button
                key={item.label}
                onClick={() => dispatchAdminTabChange(item.tab)}
                className="w-full rounded-[18px] border border-white/10 bg-white/[0.03] px-4 py-3 text-right hover:bg-white/[0.05] transition-colors"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{item.label}</p>
                    <p className="text-xs text-secondary mt-1">{item.detail}</p>
                  </div>
                  <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${item.done ? "border-brand-green/20 bg-brand-green/10 text-brand-green" : "border-white/10 bg-black/15 text-muted"}`}>
                    {item.done ? "מוכן" : "חסר"}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="grid xl:grid-cols-[1.05fr_0.95fr] gap-4">
        <SectionCard title="אירועים קרובים" subtitle="הקרובים ביותר ללוח הזמנים שלך">
          {eventsLoading ? (
            <LoadingState label="טוען אירועים..." />
          ) : eventsError ? (
            <EmptyState icon={<AlertTriangle className="w-5 h-5" style={{ color: "var(--accent-danger)" }} />} title="לא הצלחנו לטעון אירועים" detail={eventsError} />
          ) : dashboardData.upcomingEvents.length === 0 ? (
            <EmptyState icon={<Calendar className="w-5 h-5 text-muted" />} title="אין אירועים קרובים" detail="כדאי ליצור אירוע חדש כדי להתחיל לנהל את הלו״ז שלך." />
          ) : (
            <div className="space-y-2.5">
              {dashboardData.upcomingEvents.slice(0, 4).map((event) => {
                const readiness = getEventReadiness(event);
                const days = daysUntil(event.date_time);
                return (
                  <button
                    key={event.id}
                    onClick={() => dispatchAdminTabChange("events")}
                    className="w-full rounded-[18px] border border-white/10 bg-white/[0.03] px-4 py-3 text-right hover:bg-white/[0.05] transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold">{event.name}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[11px] text-secondary">
                          <span className="inline-flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDateLabel(event.date_time)}</span>
                          <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" />{event.venue || "מקום לא הוגדר"}</span>
                        </div>
                        {!readiness.ready && (
                          <p className="text-[11px] mt-2" style={{ color: "var(--accent-gold)" }}>
                            חסר: {readiness.missing.join(", ")}
                          </p>
                        )}
                      </div>
                      <div className="text-left shrink-0">
                        <p className="text-[11px] text-muted">{days === null ? "ללא תאריך" : days <= 0 ? "היום" : `עוד ${days} ימים`}</p>
                        <span className={`inline-flex mt-2 px-2.5 py-1 rounded-full border text-[11px] ${readiness.ready ? "border-brand-green/20 bg-brand-green/10 text-brand-green" : "border-white/10 bg-black/15 text-muted"}`}>
                          {readiness.ready ? "מוכן" : "צריך בדיקה"}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </SectionCard>

        <SectionCard title="הזוגות הקרובים שלך" subtitle="מי דורש היכרות מהירה לפני כולם">
          {!profileId ? (
            <LoadingState label="טוען את סביבת הזוגות שלך..." />
          ) : couplesLoading ? (
            <LoadingState label="טוען זוגות קרובים..." />
          ) : couplesError ? (
            <EmptyState icon={<AlertTriangle className="w-5 h-5" style={{ color: "var(--accent-danger)" }} />} title="לא הצלחנו לטעון זוגות קרובים" detail={couplesError} />
          ) : dashboardData.upcomingCouples.length === 0 ? (
            <EmptyState icon={<UserRound className="w-5 h-5 text-muted" />} title="אין זוגות קרובים כרגע" detail="ברגע שייכנסו זוגות עם תאריך קרוב הם יופיעו כאן." />
          ) : (
            <div className="space-y-2">
              {dashboardData.upcomingCouples.map((event) => (
                <button
                  key={event.id}
                  onClick={() => dispatchAdminTabChange("couples")}
                  className="w-full rounded-[16px] border border-white/10 bg-white/[0.03] px-3.5 py-3 text-right hover:bg-white/[0.05] transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold">{getCoupleNames(event)}</p>
                        {event.token ? <span className="text-[11px] font-mono text-brand-blue">#{event.token}</span> : null}
                      </div>
                      <p className="text-[11px] text-secondary mt-1.5 leading-5">
                        {formatDateLabel(event.event_date)} · {event.venue || "מקום לא הוגדר"}
                      </p>
                      <p className="text-[11px] text-muted mt-1.5 leading-5">
                        {STAGE_LABELS[event.current_stage] || "בתהליך"} · {event.answerCount} תשובות · {event.swipeCount} שירים · {event.requestCount || 0} בקשות
                      </p>
                    </div>
                    <span className={`inline-flex px-2.5 py-1 rounded-full border text-[11px] ${event.isComplete ? "border-brand-green/20 bg-brand-green/10 text-brand-green" : "border-white/10 bg-black/15 text-muted"}`}>
                      {event.isComplete ? "הושלם" : "בתהליך"}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      <div className="grid xl:grid-cols-[1fr_1fr] gap-4">
        <SectionCard title="פעילות אחרונה של זוגות" subtitle="מי נכנס, המשיך או סיים לאחרונה">
          {!profileId ? (
            <LoadingState label="טוען את סביבת הזוגות שלך..." />
          ) : couplesLoading ? (
            <LoadingState label="טוען פעילות..." />
          ) : couplesError ? (
            <EmptyState icon={<AlertTriangle className="w-5 h-5" style={{ color: "var(--accent-danger)" }} />} title="לא הצלחנו לטעון פעילות זוגות" detail={couplesError} />
          ) : dashboardData.recentCoupleActivity.length === 0 ? (
            <EmptyState icon={<UserRound className="w-5 h-5 text-muted" />} title="עדיין אין פעילות זוגות" detail="ברגע שזוגות יתחילו להיכנס, הפעילות תופיע כאן." />
          ) : (
            <div className="space-y-2.5">
              {dashboardData.recentCoupleActivity.map((event) => (
                <button
                  key={event.id}
                  onClick={() => dispatchAdminTabChange("couples")}
                  className="w-full rounded-[18px] border border-white/10 bg-white/[0.03] px-4 py-3 text-right hover:bg-white/[0.05] transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{getCoupleNames(event)}</p>
                      <p className="text-xs text-secondary mt-1">
                        {STAGE_LABELS[event.current_stage] || "בתהליך"} · {event.answerCount} תשובות · {event.swipeCount} שירים · {event.requestCount || 0} בקשות
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2 text-[11px] text-muted">
                        {event.token ? <span>#{event.token}</span> : null}
                        {event.email ? <span className="inline-flex items-center gap-1"><Mail className="w-3 h-3" />{event.email}</span> : null}
                      </div>
                    </div>
                    <div className="text-left shrink-0">
                      <span className={`inline-flex px-2.5 py-1 rounded-full border text-[11px] ${event.isComplete ? "border-brand-green/20 bg-brand-green/10 text-brand-green" : "border-white/10 bg-black/15 text-muted"}`}>
                        {event.isComplete ? "הושלם" : "בתהליך"}
                      </span>
                      <p className="text-[10px] text-muted mt-2">{formatDateLabel(event.updated_at || event.created_at)}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="סיכום חכם" subtitle="כמה מספרים שבאמת עוזרים לעבוד">
          <div className="grid grid-cols-2 gap-3">
            <InsightCard title="זוגות באמצע הדרך" value={dashboardData.incompleteCouples.length} detail="עדיין לא סיימו את התהליך" icon={<Clock3 className="w-4 h-4 text-brand-blue" />} />
            <InsightCard title="ממתינים לשירים" value={dashboardData.waitingForSongs.length} detail="מילאו שאלון אבל עוד לא בחרו שירים" icon={<Music className="w-4 h-4 text-brand-blue" />} />
            <InsightCard title="שלמו מלא" value={dashboardData.completedCouples.length} detail="מוכנים לעבור על החומר" icon={<CheckCircle2 className="w-4 h-4 text-brand-green" />} />
            <InsightCard title="איכות מקצועית" value={`${profileReadiness.score}%`} detail="מוכנות הפרופיל שלך כלפי לקוחות" icon={<Sparkles className="w-4 h-4" style={{ color: "var(--accent-gold)" }} />} />
          </div>
        </SectionCard>

        <SectionCard
          title="עזרה ופידבק"
          subtitle="כאן נוסיף דיווח בעיות והערות ישירות למערכת"
          action={(
            <button className="inline-flex items-center gap-1 text-[11px] text-brand-blue">
              בקרוב
            </button>
          )}
        >
          <div className="rounded-[18px] border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl border border-white/10 bg-black/15 flex items-center justify-center shrink-0">
                <MessageCircleWarning className="w-4.5 h-4.5 text-brand-blue" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold">דווח בעיה / שלח הערה</p>
                <p className="text-xs text-secondary mt-1 leading-5">
                  בשלב הבא נוסיף כאן טופס קצר שיאפשר לך לדווח ישירות על באגים, תקלות או רעיונות — ובהמשך נחבר אותו לאייג׳נט שיטפל בדיווחים.
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <span className="text-[11px] px-2.5 py-1 rounded-full border border-white/10 bg-black/15 text-muted">בעיה טכנית</span>
                  <span className="text-[11px] px-2.5 py-1 rounded-full border border-white/10 bg-black/15 text-muted">רעיון לשיפור</span>
                  <span className="text-[11px] px-2.5 py-1 rounded-full border border-white/10 bg-black/15 text-muted">פידבק מהשטח</span>
                </div>
              </div>
            </div>
          </div>
        </SectionCard>
      </div>
    </div >
  );
}

function QuickActionButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-2 text-sm text-secondary hover:text-foreground hover:bg-white/[0.05] transition-colors"
    >
      {label}
    </button>
  );
}

function SectionCard({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-[24px] border border-white/10 bg-[rgba(12,16,24,0.72)] backdrop-blur-xl shadow-[0_16px_36px_rgba(0,0,0,0.16)] p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base font-bold">{title}</h3>
          <p className="text-xs text-secondary mt-1">{subtitle}</p>
        </div>
        {action}
      </div>
      {children}
    </motion.div>
  );
}

function MetricCard({
  label,
  value,
  sublabel,
  tone,
}: {
  label: string;
  value: number | string;
  sublabel: string;
  tone: "brand" | "success" | "warn" | "neutral";
}) {
  const toneClass =
    tone === "success"
      ? "text-brand-green"
      : tone === "warn"
        ? "text-[var(--accent-gold)]"
        : tone === "neutral"
          ? "text-foreground"
          : "text-brand-blue";

  return (
    <div className="rounded-[20px] border border-white/10 bg-[rgba(12,16,24,0.68)] backdrop-blur-xl p-4 shadow-[0_10px_24px_rgba(0,0,0,0.14)]">
      <p className="text-xs text-muted">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${toneClass}`}>{value}</p>
      <p className="text-[11px] text-secondary mt-1">{sublabel}</p>
    </div>
  );
}

function InsightCard({
  title,
  value,
  detail,
  icon,
}: {
  title: string;
  value: number | string;
  detail: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-[18px] border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold">{title}</p>
        {icon}
      </div>
      <p className="text-2xl font-bold mt-3">{value}</p>
      <p className="text-[11px] text-secondary mt-1 leading-5">{detail}</p>
    </div>
  );
}

function LoadingState({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center py-10 text-sm text-muted gap-2">
      <Loader2 className="w-4 h-4 animate-spin text-brand-blue" />
      {label}
    </div>
  );
}

function EmptyState({
  icon,
  title,
  detail,
}: {
  icon: React.ReactNode;
  title: string;
  detail: string;
}) {
  return (
    <div className="rounded-[18px] border border-dashed border-white/10 bg-white/[0.02] p-6 text-center">
      <div className="flex justify-center mb-2">{icon}</div>
      <p className="text-sm font-medium">{title}</p>
      <p className="text-xs text-secondary mt-2 leading-5">{detail}</p>
    </div>
  );
}
