"use client";

import { useEffect, useState, useCallback } from "react";
import { useProfileStore } from "@/stores/profileStore";
import {
  BarChart3,
  Users,
  CheckCircle,
  AlertTriangle,
  Clock,
  TrendingUp,
  ArrowDown,
  Loader2,
  RefreshCw,
  Lightbulb,
} from "lucide-react";

interface FunnelStep {
  step: string;
  count: number;
}

interface Breakpoint {
  stage: string;
  entered: number;
  completed: number;
  dropRate: number;
}

interface StageDuration {
  stage: string;
  avgMs: number;
  count: number;
}

interface Stats {
  totalEvents: number;
  coupleEvents: number;
  adminEvents: number;
  uniqueSessions: number;
  completedSessions: number;
  completionRate: number;
  funnel: FunnelStep[];
  breakpoints: Breakpoint[];
  avgStageDuration: StageDuration[];
}

const STAGE_NAMES: Record<string, string> = {
  "0": "פרטי אירוע",
  "1": "שאלות",
  "2": "שירים",
  "3": "בקשות מיוחדות",
  "4": "סיכום",
};

const FUNNEL_NAMES: Record<string, string> = {
  link_open: "פתחו לינק",
  phone_verified: "אימות טלפון",
  session_start: "התחלת שאלון",
  stage_enter_1: "שאלות",
  stage_enter_2: "שירים",
  stage_enter_3: "בקשות",
  stage_enter_4: "סיכום",
  session_complete: "סיום מלא",
};

function formatDuration(ms: number): string {
  if (ms < 60000) return `${Math.round(ms / 1000)} שניות`;
  return `${Math.round(ms / 60000)} דקות`;
}

function getInsights(stats: Stats): string[] {
  const insights: string[] = [];

  if (stats.completionRate < 30 && stats.uniqueSessions > 5) {
    insights.push("שיעור השלמה נמוך — בדקו אם יש יותר מדי שאלות או שירים");
  }

  const worstBreakpoint = stats.breakpoints.reduce(
    (worst, bp) => (bp.dropRate > (worst?.dropRate || 0) ? bp : worst),
    null as Breakpoint | null
  );

  if (worstBreakpoint && worstBreakpoint.dropRate > 40) {
    const stageName = STAGE_NAMES[worstBreakpoint.stage] || `שלב ${worstBreakpoint.stage}`;
    insights.push(
      `נקודת שבירה: ${worstBreakpoint.dropRate}% נושרים ב"${stageName}" — שקלו לקצר או לפשט`
    );
  }

  const slowStage = stats.avgStageDuration.reduce(
    (slowest, sd) => (sd.avgMs > (slowest?.avgMs || 0) ? sd : slowest),
    null as StageDuration | null
  );

  if (slowStage && slowStage.avgMs > 5 * 60 * 1000) {
    const stageName = STAGE_NAMES[slowStage.stage] || `שלב ${slowStage.stage}`;
    insights.push(
      `"${stageName}" לוקח בממוצע ${formatDuration(slowStage.avgMs)} — ארוך מדי?`
    );
  }

  if (stats.uniqueSessions > 0 && stats.completedSessions === 0) {
    insights.push("אף זוג לא סיים את השאלון — בדקו שהשלבים עובדים כמצופה");
  }

  const phoneStep = stats.funnel.find((f) => f.step === "phone_verified");
  const linkStep = stats.funnel.find((f) => f.step === "link_open");
  if (linkStep && phoneStep && linkStep.count > 0) {
    const phoneRate = Math.round((phoneStep.count / linkStep.count) * 100);
    if (phoneRate < 50) {
      insights.push(`רק ${phoneRate}% מאמתים טלפון אחרי פתיחת לינק — שקלו להוסיף הסבר`);
    }
  }

  if (insights.length === 0 && stats.uniqueSessions > 0) {
    insights.push("הכל נראה תקין! המשיכו לעקוב אחרי הנתונים");
  }

  if (stats.uniqueSessions === 0) {
    insights.push("אין נתונים עדיין — שלחו קישורי שאלון לזוגות כדי להתחיל לעקוב");
  }

  return insights;
}

export function AnalyticsDashboard() {
  const profileId = useProfileStore((s) => s.profileId);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    if (!profileId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/analytics/track?djId=${profileId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStats(data.stats);
    } catch (e) {
      setError(e instanceof Error ? e.message : "שגיאה בטעינת נתונים");
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-brand-blue" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card p-4 text-sm" style={{ color: "var(--accent-danger)" }}>
        {error}
      </div>
    );
  }

  if (!stats) return null;

  const insights = getInsights(stats);
  const maxFunnel = Math.max(...stats.funnel.map((f) => f.count), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-brand-blue" />
          אנליטיקות
        </h2>
        <button
          onClick={loadStats}
          disabled={loading}
          className="text-xs text-muted hover:text-brand-blue transition-colors flex items-center gap-1"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
          רענון
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KPICard
          icon={<Users className="w-4 h-4" />}
          label="זוגות"
          value={stats.uniqueSessions}
          color="#059cc0"
        />
        <KPICard
          icon={<CheckCircle className="w-4 h-4" />}
          label="השלימו"
          value={stats.completedSessions}
          color="#03b28c"
        />
        <KPICard
          icon={<TrendingUp className="w-4 h-4" />}
          label="% השלמה"
          value={`${stats.completionRate}%`}
          color="#8b5cf6"
        />
        <KPICard
          icon={<BarChart3 className="w-4 h-4" />}
          label="אירועים כוללים"
          value={stats.totalEvents}
          color="#f59e0b"
        />
      </div>

      {/* Funnel */}
      <div className="glass-card p-4">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <ArrowDown className="w-4 h-4 text-brand-blue" />
          משפך המרה
        </h3>
        <div className="space-y-2">
          {stats.funnel.map((step, i) => {
            const prevCount = i > 0 ? stats.funnel[i - 1].count : step.count;
            const dropPct =
              prevCount > 0 && i > 0
                ? Math.round(((prevCount - step.count) / prevCount) * 100)
                : 0;

            return (
              <div key={step.step} className="flex items-center gap-3">
                <span className="text-xs text-muted w-24 text-left truncate">
                  {FUNNEL_NAMES[step.step] || step.step}
                </span>
                <div className="flex-1 h-6 bg-glass/30 rounded-lg overflow-hidden relative">
                  <div
                    className="h-full rounded-lg transition-all duration-500"
                    style={{
                      width: `${maxFunnel > 0 ? (step.count / maxFunnel) * 100 : 0}%`,
                      background: `linear-gradient(90deg, #059cc0, #03b28c)`,
                      minWidth: step.count > 0 ? "2rem" : 0,
                    }}
                  />
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold">
                    {step.count}
                  </span>
                </div>
                {dropPct > 0 && (
                  <span className="text-xs w-12 text-left" style={{ color: dropPct > 30 ? "var(--accent-danger)" : "var(--text-muted)" }}>
                    -{dropPct}%
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Breakpoints */}
      {stats.breakpoints.length > 0 && (
        <div className="glass-card p-4">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            נקודות שבירה
          </h3>
          <div className="space-y-2">
            {stats.breakpoints.map((bp) => (
              <div key={bp.stage} className="flex items-center justify-between text-sm">
                <span>{STAGE_NAMES[bp.stage] || `שלב ${bp.stage}`}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted">{bp.entered} נכנסו</span>
                  <span className="text-xs text-muted">{bp.completed} סיימו</span>
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{
                      background: bp.dropRate > 40 ? "rgba(239,68,68,0.15)" : "rgba(3,178,140,0.15)",
                      color: bp.dropRate > 40 ? "#ef4444" : "#03b28c",
                    }}
                  >
                    {bp.dropRate}% נשירה
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Average Stage Duration */}
      {stats.avgStageDuration.length > 0 && (
        <div className="glass-card p-4">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-brand-blue" />
            זמן ממוצע לשלב
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {stats.avgStageDuration.map((sd) => (
              <div key={sd.stage} className="glass-card p-3 text-center">
                <p className="text-xs text-muted mb-1">
                  {STAGE_NAMES[sd.stage] || `שלב ${sd.stage}`}
                </p>
                <p className="text-lg font-bold text-brand-blue">
                  {formatDuration(sd.avgMs)}
                </p>
                <p className="text-xs text-muted">{sd.count} מדגמים</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Insights & Suggestions */}
      <div className="glass-card p-4">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-amber-400" />
          תובנות והצעות לשיפור
        </h3>
        <ul className="space-y-2">
          {insights.map((insight, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-secondary">
              <span className="text-brand-blue mt-0.5">•</span>
              {insight}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function KPICard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="glass-card p-3 text-center">
      <div
        className="inline-flex items-center justify-center w-8 h-8 rounded-full mb-1"
        style={{ background: `${color}20`, color }}
      >
        {icon}
      </div>
      <p className="text-xl font-bold">{value}</p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}
