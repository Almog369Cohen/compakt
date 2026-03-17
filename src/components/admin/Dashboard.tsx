"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useAdminStore } from "@/stores/adminStore";
import { useProfileStore } from "@/stores/profileStore";
import { useEventsStore, type DJEvent } from "@/stores/eventsStore";
import { usePricingStore } from "@/stores/pricingStore";
import { TrialBanner } from "@/components/pricing/TrialBanner";
import { UsageLimitsWarning } from "@/components/pricing/UsageLimitsWarning";
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
import { useTranslation } from "@/lib/i18n";

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


async function parseJsonResponse<T>(res: Response): Promise<T> {
  const text = await res.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(
      text.startsWith("<!DOCTYPE") || text.startsWith("<html")
        ? "dashboard.errors.invalidResponse"
        : text || "dashboard.errors.invalidServerResponse"
    );
  }
}

function formatDateLabel(value?: string | null, t?: (key: string) => string): string {
  if (!value) return t ? t("dashboard.dates.notSet") : "לא נקבע";
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

function getCoupleNames(event: CoupleEvent, t?: (key: string) => string): string {
  return [event.couple_name_a, event.couple_name_b].filter(Boolean).join(" & ") || (t ? t("dashboard.coupleNames.unnamed") : "זוג ללא שם");
}

function dispatchAdminTabChange(tab: DashboardAction["tab"]) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("compakt-admin-tab-change", { detail: tab }));
}

function getProfileReadiness(profile: ReturnType<typeof useProfileStore.getState>["profile"], t: (key: string) => string) {
  const checks = [
    { label: t("dashboard.profileReadiness.businessName"), done: Boolean(profile.businessName.trim()) },
    { label: t("dashboard.profileReadiness.djSlug"), done: Boolean(profile.djSlug.trim()) },
    { label: t("dashboard.profileReadiness.logoOrCover"), done: Boolean(profile.logoUrl || profile.coverUrl) },
    { label: t("dashboard.profileReadiness.contact"), done: Boolean(profile.whatsappNumber || profile.websiteUrl) },
    { label: t("dashboard.profileReadiness.bio"), done: Boolean(profile.bio || profile.tagline) },
  ];

  const completed = checks.filter((item) => item.done).length;
  const score = Math.round((completed / checks.length) * 100);

  return {
    score,
    checks,
  };
}

function getEventReadiness(event: DJEvent, t: (key: string) => string) {
  const missing: string[] = [];
  if (!event.date_time) missing.push(t("dashboard.eventReadiness.date"));
  if (!event.venue) missing.push(t("dashboard.eventReadiness.venue"));
  if (!event.notes) missing.push(t("dashboard.eventReadiness.notes"));

  return {
    ready: missing.length === 0,
    missing,
  };
}

function getDashboardErrorMessage(error: unknown, t: (key: string) => string): string {
  const message = error instanceof Error ? error.message : "";

  if (message === "Authentication required") {
    return t("dashboard.errors.authExpired");
  }

  if (message === "Forbidden" || message === "Forbidden: insufficient role" || message === "Forbidden: profile not found") {
    return t("dashboard.errors.forbidden");
  }

  return message || t("dashboard.errors.defaultError");
}

export function Dashboard() {
  const { t } = useTranslation("admin");
  const profileId = useProfileStore((s) => s.profileId);
  const profile = useProfileStore((s) => s.profile);
  const songs = useAdminStore((s) => s.songs);
  const questions = useAdminStore((s) => s.questions);
  const loadPricingInfo = usePricingStore((s) => s.loadPricingInfo);
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
        throw new Error(data.error || t("dashboard.errors.loadCouplesFailed"));
      }
      setCoupleEvents(Array.isArray(data.events) ? data.events : []);
    } catch (error) {
      setCoupleEvents([]);
      setCouplesError(getDashboardErrorMessage(error, t));
    } finally {
      setCouplesLoading(false);
    }
  }, [profileId, t]);

  useEffect(() => {
    if (!profileId) return;
    void loadCoupleEvents();
  }, [loadCoupleEvents, profileId]);

  useEffect(() => {
    if (profileId) {
      void loadEvents(profileId);
    }
  }, [loadEvents, profileId]);

  const profileReadiness = useMemo(() => getProfileReadiness(profile, t), [profile, t]);
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

    const eventsMissingSetup = upcomingEvents.filter((event) => !getEventReadiness(event, t).ready);

    const readinessItems = [
      { label: t("dashboard.readinessItems.djProfile"), done: profileReadiness.score >= 80, detail: `${profileReadiness.score}% ${t("dashboard.readinessItems.completed")}`, tab: "profile" as const },
      { label: t("dashboard.readinessItems.questionnaire"), done: activeQuestions >= 5, detail: `${activeQuestions} ${t("dashboard.readinessItems.activeQuestions")}`, tab: "questions" as const },
      { label: t("dashboard.readinessItems.songLibrary"), done: activeSongs >= 10, detail: `${activeSongs} ${t("dashboard.readinessItems.activeSongs")}`, tab: "songs" as const },
      { label: t("dashboard.readinessItems.upcomingEvents"), done: nextWeekEvents.length > 0, detail: nextWeekEvents.length > 0 ? `${nextWeekEvents.length} ${t("dashboard.readinessItems.eventsThisWeek")}` : t("dashboard.readinessItems.noUpcomingEvents"), tab: "events" as const },
    ];

    const attentionItems: DashboardAction[] = [];

    if (resumedCouples.length > 0) {
      const couple = resumedCouples[0];
      attentionItems.push({
        id: "resume-couple",
        title: t("dashboard.attention.resumeCouple"),
        detail: `${getCoupleNames(couple, t)} ${t("dashboard.attention.resumeCoupleDetail")}${t(`dashboard.stages.${couple.current_stage}`) || t("dashboard.stages.1")}`,
        tone: "warn",
        cta: t("dashboard.attention.openQuestionnaires"),
        tab: "couples",
      });
    }

    if (missingContact.length > 0) {
      const couple = missingContact[0];
      attentionItems.push({
        id: "missing-contact",
        title: t("dashboard.attention.missingContact"),
        detail: `${getCoupleNames(couple, t)} ${t("dashboard.attention.missingContactDetail")}`,
        tone: "danger",
        cta: t("dashboard.attention.checkQuestionnaires"),
        tab: "couples",
      });
    }

    if (eventsMissingSetup.length > 0) {
      const upcoming = eventsMissingSetup[0];
      const readiness = getEventReadiness(upcoming, t);
      attentionItems.push({
        id: "missing-event-setup",
        title: t("dashboard.attention.missingEventSetup"),
        detail: `${upcoming.name} ${t("dashboard.attention.missingEventSetupDetail")} ${readiness.missing.join(", ")}`,
        tone: "warn",
        cta: t("dashboard.attention.openEvents"),
        tab: "events",
      });
    }

    if (profileReadiness.score < 80) {
      attentionItems.push({
        id: "profile-readiness",
        title: t("dashboard.attention.profileReadiness"),
        detail: t("dashboard.attention.profileReadinessDetail", { percent: String(100 - profileReadiness.score) }),
        tone: "info",
        cta: t("dashboard.attention.complete"),
        tab: "profile",
      });
    }

    if (activeSongs < 10 || activeQuestions < 5) {
      attentionItems.push({
        id: "setup-readiness",
        title: t("dashboard.attention.setupReadiness"),
        detail: t("dashboard.attention.setupReadinessDetail", { songs: String(activeSongs), questions: String(activeQuestions) }),
        tone: "info",
        cta: t("dashboard.attention.complete"),
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
      pieces.push(t("dashboard.summary.itemsWaiting", { count: String(dashboardData.attentionItems.length) }));
    }
    if (dashboardData.nextWeekEvents.length > 0) {
      pieces.push(t("dashboard.summary.eventsNextWeek", { count: String(dashboardData.nextWeekEvents.length) }));
    }
    if (dashboardData.incompleteCouples.length > 0) {
      pieces.push(t("dashboard.summary.questionnairesInProgress", { count: String(dashboardData.incompleteCouples.length) }));
    }
    if (pieces.length === 0) {
      return t("dashboard.summary.allQuiet");
    }
    return pieces.join(" · ");
  }, [dashboardData.attentionItems.length, dashboardData.incompleteCouples.length, dashboardData.nextWeekEvents.length, t]);

  const launchChecklist = useMemo(
    () => [
      {
        label: t("dashboard.launchChecklist.completeProfile"),
        done: profileReadiness.score >= 80,
        detail: profileReadiness.score >= 80 ? t("dashboard.launchChecklist.profileReady") : t("dashboard.launchChecklist.profileIncomplete"),
        tab: "profile" as const,
      },
      {
        label: t("dashboard.launchChecklist.prepareQuestionnaire"),
        done: activeQuestions >= 5,
        detail: activeQuestions >= 5 ? t("dashboard.launchChecklist.questionsReady", { count: String(activeQuestions) }) : t("dashboard.launchChecklist.questionsNeeded"),
        tab: "questions" as const,
      },
      {
        label: t("dashboard.launchChecklist.buildSongLibrary"),
        done: activeSongs >= 10,
        detail: activeSongs >= 10 ? t("dashboard.launchChecklist.songsReady", { count: String(activeSongs) }) : t("dashboard.launchChecklist.songsNeeded"),
        tab: "songs" as const,
      },
      {
        label: t("dashboard.launchChecklist.sendFirstQuestionnaire"),
        done: coupleEvents.length > 0,
        detail: coupleEvents.length > 0 ? t("dashboard.launchChecklist.couplesReceived", { count: String(coupleEvents.length) }) : t("dashboard.launchChecklist.createFirstLink"),
        tab: "couples" as const,
      },
    ],
    [profileReadiness.score, activeQuestions, activeSongs, coupleEvents.length, t]
  );

  useEffect(() => {
    if (profileId) {
      loadPricingInfo(profileId);
    }
  }, [profileId, loadPricingInfo]);

  const handleUpgrade = () => {
    // TODO: Open upgrade modal or redirect to pricing page
    console.log("Upgrade clicked");
  };

  return (
    <div className="space-y-6">
      {/* Trial Banner */}
      <TrialBanner onUpgrade={handleUpgrade} />

      {/* Usage Limits Warning */}
      <UsageLimitsWarning onUpgrade={handleUpgrade} />
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-dashboard-border bg-gradient-to-br from-slate-900/90 to-slate-950/95 backdrop-blur-2xl shadow-2xl p-6 md:p-8">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-dashboard-border bg-white/[0.04] px-3.5 py-1.5 text-xs font-medium text-muted">
              <BarChart3 className="w-4 h-4 text-brand-blue" />
              {t("dashboard.sections.controlCenter")}
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{t("dashboard.sections.dashboard")}</h1>
              <p className="text-base text-secondary mt-2 leading-relaxed max-w-2xl">{summaryLine}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <QuickActionButton label={t("dashboard.quickActions.questionnaires")} onClick={() => dispatchAdminTabChange("couples")} />
            <QuickActionButton label={t("dashboard.quickActions.events")} onClick={() => dispatchAdminTabChange("events")} />
            <QuickActionButton label={t("dashboard.quickActions.profile")} onClick={() => dispatchAdminTabChange("profile")} />
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard label={t("dashboard.metrics.questionnairesInProgress")} value={dashboardData.incompleteCouples.length} sublabel={t("dashboard.metrics.requireFollowup")} tone="brand" />
        <MetricCard label={t("dashboard.metrics.completedFull")} value={dashboardData.completedCouples.length} sublabel={t("dashboard.metrics.couplesFinished")} tone="success" />
        <MetricCard label={t("dashboard.metrics.upcomingEvents")} value={dashboardData.nextWeekEvents.length} sublabel={t("dashboard.metrics.sevenDaysAhead")} tone="warn" />
        <MetricCard label={t("dashboard.metrics.systemReadiness")} value={`${Math.round((profileReadiness.score + Math.min(activeSongs * 5, 100) + Math.min(activeQuestions * 10, 100)) / 3)}%`} sublabel={t("dashboard.metrics.profileSongsQuestions")} tone="neutral" />
      </div>

      <SectionCard title={t("dashboard.launchChecklist.title")} subtitle={t("dashboard.launchChecklist.subtitle")}>
        <div className="grid md:grid-cols-2 gap-4">
          {launchChecklist.map((item) => (
            <button
              key={item.label}
              onClick={() => dispatchAdminTabChange(item.tab)}
              className="group w-full rounded-2xl border border-dashboard-border bg-dashboard-card-secondary hover:bg-dashboard-card-hover hover:border-dashboard-border-hover px-5 py-4 text-right transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-base font-semibold text-white">{item.label}</p>
                  <p className="text-sm text-secondary mt-2 leading-relaxed">{item.detail}</p>
                </div>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 text-sm font-semibold shrink-0 ${item.done ? "border-accent-success/50 bg-accent-success/15 text-accent-success" : "border-dashboard-border bg-white/[0.05] text-muted"}`}>
                  {item.done && <CheckCircle2 className="w-3.5 h-3.5" />}
                  {item.done ? t("dashboard.launchChecklist.ready") : t("dashboard.launchChecklist.complete")}
                </span>
              </div>
            </button>
          ))}
        </div>
      </SectionCard>

      <div className="grid xl:grid-cols-[1.1fr_0.9fr] gap-5">
        <SectionCard
          title={t("dashboard.sections.needsAttention")}
          subtitle={t("dashboard.sections.needsAttentionSubtitle")}
          action={(
            <button onClick={loadCoupleEvents} className="p-2 rounded-xl text-muted hover:text-foreground transition-colors" aria-label={t("dashboard.sections.refresh")}>
              <RefreshCw className={`w-4 h-4 ${couplesLoading ? "animate-spin" : ""}`} />
            </button>
          )}
        >
          {!profileId ? (
            <LoadingState label="טוען את סביבת הזוגות שלך..." />
          ) : couplesLoading && dashboardData.attentionItems.length === 0 ? (
            <LoadingState label="טוען משימות..." />
          ) : dashboardData.attentionItems.length === 0 ? (
            <EmptyState icon={<CheckCircle2 className="w-5 h-5 text-brand-green" />} title="הכול בסדר" detail="אין משהו דחוף כרגע — הכול זורם." />
          ) : (
            <div className="space-y-3">
              {dashboardData.attentionItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => dispatchAdminTabChange(item.tab)}
                  className="group w-full rounded-2xl border border-dashboard-border bg-dashboard-card-secondary hover:bg-dashboard-card-hover hover:border-dashboard-border-hover px-5 py-4 text-right transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-2 h-2 rounded-full ${item.tone === "danger" ? "bg-accent-danger" : item.tone === "warn" ? "bg-accent-warning" : "bg-brand-blue"}`} style={{ boxShadow: `0 0 8px ${item.tone === "danger" ? "var(--accent-danger)" : item.tone === "warn" ? "var(--accent-warning)" : "var(--accent-primary)"}50` }} />
                        <p className="text-base font-semibold text-white">{item.title}</p>
                      </div>
                      <p className="text-sm text-secondary leading-relaxed">{item.detail}</p>
                    </div>
                    <span className={`inline-flex items-center gap-2 text-sm font-medium whitespace-nowrap ${item.tone === "danger" ? "text-accent-danger" : item.tone === "warn" ? "text-accent-warning" : "text-brand-blue"}`}>
                      {item.cta}
                      <ArrowLeft className="w-4 h-4" />
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="מוכנות והגדרות" subtitle="מה חסר כדי להרגיש מוכן לעבודה">
          <div className="space-y-3">
            {dashboardData.readinessItems.map((item) => (
              <button
                key={item.label}
                onClick={() => dispatchAdminTabChange(item.tab)}
                className="group w-full rounded-2xl border border-dashboard-border bg-dashboard-card-secondary hover:bg-dashboard-card-hover hover:border-dashboard-border-hover px-5 py-4 text-right transition-all"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-base font-semibold text-white">{item.label}</p>
                    <p className="text-sm text-secondary mt-2 leading-relaxed">{item.detail}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 text-sm font-semibold ${item.done ? "border-accent-success/50 bg-accent-success/15 text-accent-success" : "border-dashboard-border bg-white/[0.05] text-muted"}`}>
                    {item.done && <CheckCircle2 className="w-3.5 h-3.5" />}
                    {item.done ? "מוכן" : "חסר"}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="grid xl:grid-cols-[1.05fr_0.95fr] gap-5">
        <SectionCard title="אירועים קרובים" subtitle="הקרובים ביותר ללוח הזמנים שלך">
          {eventsLoading ? (
            <LoadingState label="טוען אירועים..." />
          ) : eventsError ? (
            <EmptyState icon={<AlertTriangle className="w-5 h-5" style={{ color: "var(--accent-danger)" }} />} title="לא הצלחנו לטעון אירועים" detail={eventsError} />
          ) : dashboardData.upcomingEvents.length === 0 ? (
            <EmptyState icon={<Calendar className="w-5 h-5 text-muted" />} title="עוד אין אירועים בלו״ז" detail="צרו אירוע חדש כדי להתחיל לנהל את הלו״ז." />
          ) : (
            <div className="space-y-3">
              {dashboardData.upcomingEvents.slice(0, 4).map((event) => {
                const readiness = getEventReadiness(event, t);
                const days = daysUntil(event.date_time);
                return (
                  <button
                    key={event.id}
                    onClick={() => dispatchAdminTabChange("events")}
                    className="group w-full rounded-2xl border border-dashboard-border bg-dashboard-card-secondary hover:bg-dashboard-card-hover hover:border-dashboard-border-hover px-5 py-4 text-right transition-all"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-base font-semibold text-white">{event.name}</p>
                        <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-secondary">
                          <span className="inline-flex items-center gap-1.5"><Calendar className="w-4 h-4" />{formatDateLabel(event.date_time)}</span>
                          <span className="inline-flex items-center gap-1.5"><MapPin className="w-4 h-4" />{event.venue || "מקום לא הוגדר"}</span>
                        </div>
                        {!readiness.ready && (
                          <p className="text-sm mt-2 text-accent-warning">
                            חסר: {readiness.missing.join(", ")}
                          </p>
                        )}
                      </div>
                      <div className="text-left shrink-0">
                        <p className="text-sm text-muted mb-2">{days === null ? "ללא תאריך" : days <= 0 ? "היום" : `עוד ${days} ימים`}</p>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 text-sm font-semibold ${readiness.ready ? "border-accent-success/50 bg-accent-success/15 text-accent-success" : "border-dashboard-border bg-white/[0.05] text-muted"}`}>
                          {readiness.ready && <CheckCircle2 className="w-3.5 h-3.5" />}
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
            <EmptyState icon={<UserRound className="w-5 h-5 text-muted" />} title="עוד אין זוגות קרובים" detail="ברגע שייכנסו זוגות עם תאריך קרוב, הם יופיעו כאן." />
          ) : (
            <div className="space-y-3">
              {dashboardData.upcomingCouples.map((event) => (
                <button
                  key={event.id}
                  onClick={() => dispatchAdminTabChange("couples")}
                  className="group w-full rounded-2xl border border-dashboard-border bg-dashboard-card-secondary hover:bg-dashboard-card-hover hover:border-dashboard-border-hover px-4 py-4 text-right transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-base font-semibold text-white">{getCoupleNames(event)}</p>
                        {event.token ? <span className="text-sm font-mono text-brand-blue">#{event.token}</span> : null}
                      </div>
                      <p className="text-sm text-secondary mt-2 leading-relaxed">
                        {formatDateLabel(event.event_date)} · {event.venue || "מקום לא הוגדר"}
                      </p>
                      <p className="text-sm text-muted mt-1.5 leading-relaxed">
                        {t(`dashboard.stages.${event.current_stage}`) || t("dashboard.stages.1")} · {event.answerCount} תשובות · {event.swipeCount} שירים · {event.requestCount || 0} בקשות
                      </p>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 text-sm font-semibold ${event.isComplete ? "border-accent-success/50 bg-accent-success/15 text-accent-success" : "border-dashboard-border bg-white/[0.05] text-muted"}`}>
                      {event.isComplete && <CheckCircle2 className="w-3.5 h-3.5" />}
                      {event.isComplete ? "הושלם" : "בתהליך"}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      <div className="grid xl:grid-cols-[1fr_1fr] gap-5">
        <SectionCard title="פעילות אחרונה של זוגות" subtitle="מי נכנס, המשיך או סיים לאחרונה">
          {!profileId ? (
            <LoadingState label="טוען את סביבת הזוגות שלך..." />
          ) : couplesLoading ? (
            <LoadingState label="טוען פעילות..." />
          ) : couplesError ? (
            <EmptyState icon={<AlertTriangle className="w-5 h-5" style={{ color: "var(--accent-danger)" }} />} title="לא הצלחנו לטעון פעילות זוגות" detail={couplesError} />
          ) : dashboardData.recentCoupleActivity.length === 0 ? (
            <EmptyState icon={<UserRound className="w-5 h-5 text-muted" />} title="עוד אין פעילות" detail="ברגע שזוגות יתחילו להיכנס, הפעילות תופיע כאן." />
          ) : (
            <div className="space-y-3">
              {dashboardData.recentCoupleActivity.map((event) => (
                <button
                  key={event.id}
                  onClick={() => dispatchAdminTabChange("couples")}
                  className="group w-full rounded-2xl border border-dashboard-border bg-dashboard-card-secondary hover:bg-dashboard-card-hover hover:border-dashboard-border-hover px-5 py-4 text-right transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-base font-semibold text-white">{getCoupleNames(event)}</p>
                      <p className="text-sm text-secondary mt-2 leading-relaxed">
                        {t(`dashboard.stages.${event.current_stage}`) || t("dashboard.stages.1")} · {event.answerCount} תשובות · {event.swipeCount} שירים · {event.requestCount || 0} בקשות
                      </p>
                      <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted">
                        {event.token ? <span>#{event.token}</span> : null}
                        {event.email ? <span className="inline-flex items-center gap-1.5"><Mail className="w-4 h-4" />{event.email}</span> : null}
                      </div>
                    </div>
                    <div className="text-left shrink-0">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 text-sm font-semibold ${event.isComplete ? "border-accent-success/50 bg-accent-success/15 text-accent-success" : "border-dashboard-border bg-white/[0.05] text-muted"}`}>
                        {event.isComplete && <CheckCircle2 className="w-3.5 h-3.5" />}
                        {event.isComplete ? "הושלם" : "בתהליך"}
                      </span>
                      <p className="text-xs text-muted mt-2">{formatDateLabel(event.updated_at || event.created_at)}</p>
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
      className="inline-flex items-center gap-2 rounded-full border border-dashboard-border bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-secondary hover:text-foreground hover:bg-white/[0.08] hover:border-dashboard-border-hover transition-all"
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
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-dashboard-border bg-dashboard-card backdrop-blur-2xl shadow-2xl p-6">
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <h2 className="text-xl font-bold tracking-tight">{title}</h2>
          <p className="text-sm text-secondary mt-2 leading-relaxed">{subtitle}</p>
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
      ? "text-accent-success"
      : tone === "warn"
        ? "text-accent-warning"
        : tone === "neutral"
          ? "text-foreground"
          : "text-brand-blue";

  return (
    <div className="group rounded-2xl border border-dashboard-border bg-dashboard-card backdrop-blur-xl p-5 hover:bg-dashboard-card-hover hover:border-dashboard-border-hover transition-all shadow-xl">
      <p className="text-sm font-medium text-muted mb-3">{label}</p>
      <p className={`text-4xl md:text-5xl font-bold tracking-tight mb-2 ${toneClass}`}>{value}</p>
      <p className="text-sm text-secondary leading-relaxed">{sublabel}</p>
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
    <div className="group rounded-2xl border border-dashboard-border bg-dashboard-card-secondary hover:bg-dashboard-card-hover hover:border-dashboard-border-hover p-5 transition-all">
      <div className="flex items-center justify-between gap-3 mb-3">
        <p className="text-sm font-semibold text-white">{title}</p>
        <div className="opacity-80">{icon}</div>
      </div>
      <p className="text-3xl font-bold tracking-tight mb-2">{value}</p>
      <p className="text-sm text-secondary leading-relaxed">{detail}</p>
    </div>
  );
}

function LoadingState({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center py-12 text-base text-secondary gap-3">
      <Loader2 className="w-5 h-5 animate-spin text-brand-blue" />
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
    <div className="rounded-2xl border-2 border-dashed border-dashboard-border bg-dashboard-card-secondary/40 p-8 text-center">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/5 mb-4">
        {icon}
      </div>
      <p className="text-base font-semibold text-white mb-2">{title}</p>
      <p className="text-sm text-secondary leading-relaxed max-w-md mx-auto">{detail}</p>
    </div>
  );
}
