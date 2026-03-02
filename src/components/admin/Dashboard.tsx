"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useEventStore } from "@/stores/eventStore";
import { useAdminStore } from "@/stores/adminStore";
import { useProfileStore } from "@/stores/profileStore";
import { motion } from "framer-motion";
import {
  BarChart3,
  Users,
  Music,
  Heart,
  Star,
  XCircle,
  TrendingUp,
  Clock,
  HelpCircle,
  Sparkles,
  Download,
  ListTodo,
  X,
  Plus,
  Trash2,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  RefreshCw,
  Loader2,
  CheckCircle,
} from "lucide-react";

type FixItem = {
  id: string;
  text: string;
  done: boolean;
};

const FIXES_STORAGE_KEY = "compakt.admin.fixes";

interface HealthCheck {
  name: string;
  status: "pass" | "fail" | "warn";
  detail: string;
  count?: number;
}

interface HealthResult {
  healthy: boolean;
  summary: { pass: number; warn: number; fail: number };
  checks: HealthCheck[];
}

export function Dashboard() {
  const event = useEventStore((s) => s.event);
  const swipes = useEventStore((s) => s.swipes);
  const answers = useEventStore((s) => s.answers);
  const requests = useEventStore((s) => s.requests);
  const analytics = useEventStore((s) => s.analytics);
  const upsellClicks = useEventStore((s) => s.upsellClicks);
  const songs = useAdminStore((s) => s.songs);
  const questions = useAdminStore((s) => s.questions);
  const upsells = useAdminStore((s) => s.upsells);
  const profileId = useProfileStore((s) => s.profileId);

  const [showFixes, setShowFixes] = useState(false);
  const [fixes, setFixes] = useState<FixItem[]>([]);
  const [newFixText, setNewFixText] = useState("");

  // DB Health
  const [health, setHealth] = useState<HealthResult | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [showAllChecks, setShowAllChecks] = useState(false);

  const loadHealth = useCallback(async () => {
    setHealthLoading(true);
    try {
      const url = profileId
        ? `/api/admin/db-health?profileId=${profileId}`
        : "/api/admin/db-health";
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) setHealth(data);
    } catch { /* silent */ }
    setHealthLoading(false);
  }, [profileId]);

  useEffect(() => {
    loadHealth();
  }, [loadHealth]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(FIXES_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as FixItem[];
        if (Array.isArray(parsed)) setFixes(parsed);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(FIXES_STORAGE_KEY, JSON.stringify(fixes));
    } catch {
      // ignore
    }
  }, [fixes]);

  const stats = useMemo(() => {
    const likes = swipes.filter((s) => s.action === "like").length;
    const superLikes = swipes.filter((s) => s.action === "super_like").length;
    const dislikes = swipes.filter((s) => s.action === "dislike").length;
    const unsure = swipes.filter((s) => s.action === "unsure").length;
    const totalSwipes = swipes.length;
    const completionRate = event
      ? Math.round(((event.currentStage || 0) / 4) * 100)
      : 0;

    const topReasons = new Map<string, number>();
    swipes
      .filter((s) => s.action === "dislike")
      .forEach((s) =>
        s.reasonChips.forEach((chip) =>
          topReasons.set(chip, (topReasons.get(chip) || 0) + 1)
        )
      );
    const sortedReasons = Array.from(topReasons.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const stageEvents = analytics.filter((a) => a.eventName === "stage_change");

    return {
      likes,
      superLikes,
      dislikes,
      unsure,
      totalSwipes,
      completionRate,
      sortedReasons,
      stageEvents,
      answeredQuestions: answers.length,
      totalRequests: requests.length,
      totalUpsellClicks: upsellClicks.length,
    };
  }, [swipes, event, analytics, answers, requests, upsellClicks]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-brand-blue" />
          דשבורד
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFixes(true)}
            className="btn-secondary text-sm flex items-center gap-1.5 py-2 px-4"
          >
            <ListTodo className="w-4 h-4" />
            תיקונים
          </button>

          {event && (
            <button
              onClick={() => {
                const data = {
                  event,
                  answers,
                  swipes: swipes.map((s) => ({
                    ...s,
                    songTitle: songs.find((song) => song.id === s.songId)?.title,
                    songArtist: songs.find((song) => song.id === s.songId)?.artist,
                  })),
                  requests,
                  upsellClicks,
                  analytics,
                  exportedAt: new Date().toISOString(),
                };
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `compakt-brief-${event.magicToken?.slice(0, 8) || "draft"}.json`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="btn-secondary text-sm flex items-center gap-1.5 py-2 px-4"
            >
              <Download className="w-4 h-4" />
              ייצוא JSON
            </button>
          )}
        </div>
      </div>

      {showFixes && (
        <div
          className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center px-4"
          onClick={() => setShowFixes(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="glass-card w-full max-w-lg p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <ListTodo className="w-5 h-5 text-brand-blue" />
                <h3 className="font-bold">תיקונים</h3>
                <span className="text-xs text-muted">({fixes.filter((f) => !f.done).length} פתוחים)</span>
              </div>
              <button
                onClick={() => setShowFixes(false)}
                className="p-2 rounded-lg text-muted hover:text-foreground transition-colors"
                aria-label="סגור"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex gap-2 mb-4">
              <input
                value={newFixText}
                onChange={(e) => setNewFixText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key !== "Enter") return;
                  const text = newFixText.trim();
                  if (!text) return;
                  setFixes((prev) => [
                    { id: crypto.randomUUID(), text, done: false },
                    ...prev,
                  ]);
                  setNewFixText("");
                }}
                placeholder="הוסף תיקון…"
                className="flex-1 px-3 py-2.5 rounded-xl bg-transparent border border-glass text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-brand-blue transition-colors"
              />
              <button
                onClick={() => {
                  const text = newFixText.trim();
                  if (!text) return;
                  setFixes((prev) => [
                    { id: crypto.randomUUID(), text, done: false },
                    ...prev,
                  ]);
                  setNewFixText("");
                }}
                className="btn-primary text-sm flex items-center gap-1.5 py-2.5 px-4"
              >
                <Plus className="w-4 h-4" />
                הוסף
              </button>
            </div>

            <div className="space-y-2 max-h-[55vh] overflow-auto pr-1">
              {fixes.length === 0 ? (
                <div className="text-sm text-muted text-center py-10">
                  אין תיקונים עדיין
                </div>
              ) : (
                fixes.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 rounded-xl border border-glass"
                  >
                    <input
                      type="checkbox"
                      checked={item.done}
                      onChange={() =>
                        setFixes((prev) =>
                          prev.map((f) =>
                            f.id === item.id ? { ...f, done: !f.done } : f
                          )
                        )
                      }
                      className="w-4 h-4"
                    />
                    <span
                      className={`text-sm flex-1 ${item.done ? "line-through text-muted" : ""}`}
                    >
                      {item.text}
                    </span>
                    <button
                      onClick={() => setFixes((prev) => prev.filter((f) => f.id !== item.id))}
                      className="p-2 rounded-lg text-muted hover:text-accent-danger transition-colors"
                      aria-label="מחק"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {fixes.length > 0 && (
              <div className="flex items-center justify-between mt-4 gap-2">
                <button
                  onClick={() => setFixes((prev) => prev.filter((f) => !f.done))}
                  className="text-xs text-secondary hover:text-foreground transition-colors"
                >
                  נקה שבוצעו
                </button>
                <button
                  onClick={() => {
                    if (!confirm("למחוק את כל הרשימה?")) return;
                    setFixes([]);
                  }}
                  className="text-xs"
                  style={{ color: "var(--accent-danger)" }}
                >
                  מחק הכל
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          icon={<Music className="w-5 h-5" />}
          label="שירים בספרייה"
          value={songs.length}
          color="#059cc0"
        />
        <StatCard
          icon={<HelpCircle className="w-5 h-5" />}
          label="שאלות פעילות"
          value={questions.filter((q) => q.isActive).length}
          color="#03b28c"
        />
        <StatCard
          icon={<Sparkles className="w-5 h-5" />}
          label="שדרוגים"
          value={upsells.filter((u) => u.isActive).length}
          color="#f5c542"
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5" />}
          label="קליקים על שדרוגים"
          value={stats.totalUpsellClicks}
          color="#059cc0"
        />
      </div>

      {/* DB Health Status */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="glass-card p-5"
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-sm flex items-center gap-2">
            {health?.healthy ? (
              <ShieldCheck className="w-4 h-4 text-brand-green" />
            ) : health && !health.healthy ? (
              <ShieldAlert className="w-4 h-4" style={{ color: "var(--accent-danger)" }} />
            ) : (
              <ShieldCheck className="w-4 h-4 text-muted" />
            )}
            בריאות DB
          </h3>
          <button
            onClick={loadHealth}
            disabled={healthLoading}
            className="p-1.5 rounded-lg text-muted hover:text-foreground transition-colors"
            title="רענן"
          >
            {healthLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </button>
        </div>

        {health ? (
          <>
            <div className="flex gap-3 mb-3">
              <span className="flex items-center gap-1 text-xs text-brand-green">
                <CheckCircle className="w-3.5 h-3.5" /> {health.summary.pass} תקין
              </span>
              {health.summary.warn > 0 && (
                <span className="flex items-center gap-1 text-xs" style={{ color: "var(--accent-gold)" }}>
                  <AlertTriangle className="w-3.5 h-3.5" /> {health.summary.warn} אזהרות
                </span>
              )}
              {health.summary.fail > 0 && (
                <span className="flex items-center gap-1 text-xs" style={{ color: "var(--accent-danger)" }}>
                  <ShieldAlert className="w-3.5 h-3.5" /> {health.summary.fail} בעיות
                </span>
              )}
            </div>

            {/* Show failed/warned checks */}
            {health.checks.filter((c) => c.status !== "pass").length > 0 && (
              <div className="space-y-1.5 mb-2">
                {health.checks
                  .filter((c) => c.status !== "pass")
                  .map((c) => (
                    <div
                      key={c.name}
                      className="flex items-start gap-2 text-xs p-2 rounded-lg border border-glass"
                    >
                      {c.status === "fail" ? (
                        <ShieldAlert className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: "var(--accent-danger)" }} />
                      ) : (
                        <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: "var(--accent-gold)" }} />
                      )}
                      <span className="text-secondary">{c.detail}</span>
                    </div>
                  ))}
              </div>
            )}

            {/* Toggle all checks */}
            <button
              onClick={() => setShowAllChecks(!showAllChecks)}
              className="text-xs text-secondary hover:text-foreground transition-colors"
            >
              {showAllChecks ? "הסתר פירוט" : `הצג את כל ${health.checks.length} הבדיקות`}
            </button>

            {showAllChecks && (
              <div className="space-y-1 mt-2">
                {health.checks.map((c) => (
                  <div key={c.name} className="flex items-center gap-2 text-xs">
                    {c.status === "pass" ? (
                      <CheckCircle className="w-3 h-3 text-brand-green shrink-0" />
                    ) : c.status === "fail" ? (
                      <ShieldAlert className="w-3 h-3 shrink-0" style={{ color: "var(--accent-danger)" }} />
                    ) : (
                      <AlertTriangle className="w-3 h-3 shrink-0" style={{ color: "var(--accent-gold)" }} />
                    )}
                    <span className="text-muted">{c.detail}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : healthLoading ? (
          <div className="text-xs text-muted flex items-center gap-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> בודק...
          </div>
        ) : (
          <div className="text-xs text-muted">לא ניתן לטעון בדיקת בריאות</div>
        )}
      </motion.div>

      {/* Current Event */}
      {event ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-5"
        >
          <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-brand-blue" />
            אירוע נוכחי
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
            <div>
              <p className="text-xs text-muted">סוג</p>
              <p className="font-medium text-sm">
                {event.eventType === "wedding"
                  ? "חתונה 💍"
                  : event.eventType === "bar_mitzvah"
                    ? "בר/בת מצווה 🎉"
                    : event.eventType === "private"
                      ? "אירוע פרטי 🎈"
                      : event.eventType === "corporate"
                        ? "עסקי 🏢"
                        : "אחר"}
              </p>
            </div>
            {(event.coupleNameA || event.coupleNameB) && (
              <div>
                <p className="text-xs text-muted">שמות</p>
                <p className="font-medium text-sm">
                  {[event.coupleNameA, event.coupleNameB].filter(Boolean).join(" & ")}
                </p>
              </div>
            )}
            {event.eventDate && (
              <div>
                <p className="text-xs text-muted">תאריך</p>
                <p className="font-medium text-sm">{event.eventDate}</p>
              </div>
            )}
            {event.venue && (
              <div>
                <p className="text-xs text-muted">מקום</p>
                <p className="font-medium text-sm">{event.venue}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-muted">שלב נוכחי</p>
              <p className="font-medium text-sm">
                {event.currentStage}/4 ({stats.completionRate}%)
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2 rounded-full bg-brand-gray/30 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${stats.completionRate}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full rounded-full"
              style={{ background: "linear-gradient(90deg, #059cc0, #03b28c)" }}
            />
          </div>
        </motion.div>
      ) : (
        <div className="glass-card p-8 text-center text-muted text-sm">
          <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
          אין אירוע פעיל כרגע
        </div>
      )}

      {/* Swipe Analytics */}
      {stats.totalSwipes > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-5"
        >
          <h3 className="font-bold text-sm mb-4">סטטיסטיקת שירים</h3>

          <div className="grid grid-cols-4 gap-3 mb-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Heart className="w-4 h-4 text-brand-green" fill="var(--accent-secondary)" />
              </div>
              <p className="text-lg font-bold text-brand-green">{stats.likes}</p>
              <p className="text-xs text-muted">אהבו</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Star className="w-4 h-4" style={{ color: "var(--accent-gold)" }} fill="var(--accent-gold)" />
              </div>
              <p className="text-lg font-bold" style={{ color: "var(--accent-gold)" }}>
                {stats.superLikes}
              </p>
              <p className="text-xs text-muted">!סופר</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <XCircle className="w-4 h-4" style={{ color: "var(--accent-danger)" }} />
              </div>
              <p className="text-lg font-bold" style={{ color: "var(--accent-danger)" }}>
                {stats.dislikes}
              </p>
              <p className="text-xs text-muted">לא אהבו</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <HelpCircle className="w-4 h-4 text-muted" />
              </div>
              <p className="text-lg font-bold text-muted">{stats.unsure}</p>
              <p className="text-xs text-muted">לא בטוח</p>
            </div>
          </div>

          {/* Visual bar */}
          <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
            {stats.likes > 0 && (
              <div
                className="rounded-full"
                style={{
                  width: `${(stats.likes / stats.totalSwipes) * 100}%`,
                  background: "var(--accent-secondary)",
                }}
              />
            )}
            {stats.superLikes > 0 && (
              <div
                className="rounded-full"
                style={{
                  width: `${(stats.superLikes / stats.totalSwipes) * 100}%`,
                  background: "var(--accent-gold)",
                }}
              />
            )}
            {stats.dislikes > 0 && (
              <div
                className="rounded-full"
                style={{
                  width: `${(stats.dislikes / stats.totalSwipes) * 100}%`,
                  background: "var(--accent-danger)",
                }}
              />
            )}
            {stats.unsure > 0 && (
              <div
                className="rounded-full bg-muted"
                style={{
                  width: `${(stats.unsure / stats.totalSwipes) * 100}%`,
                }}
              />
            )}
          </div>
        </motion.div>
      )}

      {/* Top Dislike Reasons */}
      {stats.sortedReasons.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass-card p-5"
        >
          <h3 className="font-bold text-sm mb-3">סיבות דחייה נפוצות</h3>
          <div className="space-y-2">
            {stats.sortedReasons.map(([reason, count]) => (
              <div key={reason} className="flex items-center gap-3">
                <span className="text-sm flex-1">{reason}</span>
                <div className="flex-1 h-2 rounded-full bg-brand-gray/30 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(count / stats.dislikes) * 100}%`,
                      background: "var(--accent-danger)",
                      opacity: 0.7,
                    }}
                  />
                </div>
                <span className="text-xs text-muted w-8 text-left">{count}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Requests Summary */}
      {stats.totalRequests > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-5"
        >
          <h3 className="font-bold text-sm mb-3">בקשות</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <MiniStat label="חופשיות" count={requests.filter((r) => r.requestType === "free_text").length} />
            <MiniStat label="✅ כן" count={requests.filter((r) => r.requestType === "do").length} />
            <MiniStat label="❌ לא" count={requests.filter((r) => r.requestType === "dont").length} />
            <MiniStat label="🔗 לינקים" count={requests.filter((r) => r.requestType === "link").length} />
          </div>
        </motion.div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-card p-4 text-center"
    >
      <div className="flex justify-center mb-2" style={{ color }}>
        {icon}
      </div>
      <p className="text-2xl font-bold" style={{ color }}>
        {value}
      </p>
      <p className="text-xs text-muted">{label}</p>
    </motion.div>
  );
}

function MiniStat({ label, count }: { label: string; count: number }) {
  return (
    <div className="text-center p-2 rounded-xl border border-glass">
      <p className="text-lg font-bold">{count}</p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}
