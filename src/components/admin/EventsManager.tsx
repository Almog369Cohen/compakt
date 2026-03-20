"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  MapPin,
  Clock,
  FileText,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  RefreshCw,
  Link,
  Loader2,
} from "lucide-react";
import { useEventsStore, type DJEvent } from "@/stores/eventsStore";
import { useProfileStore } from "@/stores/profileStore";
import { ImageUploader } from "@/components/ui/ImageUploader";
import { useAdminStore } from "@/stores/adminStore";
import type { FeatureKey } from "@/lib/access";
import { useTranslation } from "@/lib/i18n";
import { useMemo } from "react";

type AdminAccess = {
  isActive: boolean;
  features: Record<FeatureKey, boolean>;
};


export function EventsManager() {
  const { t } = useTranslation("admin");
  const profileId = useProfileStore((s) => s.profileId);
  const userId = useAdminStore((s) => s.userId);

  const STATUS_OPTIONS = useMemo(() => [
    { value: "upcoming" as const, label: t("events.status.upcoming"), color: "#059cc0" },
    { value: "confirmed" as const, label: t("events.status.confirmed"), color: "#03b28c" },
    { value: "completed" as const, label: t("events.status.completed"), color: "#8b5cf6" },
    { value: "cancelled" as const, label: t("events.status.cancelled"), color: "#ef4444" },
  ], [t]);
  const router = useRouter();
  const { events, loading, error, loadEvents, createEvent, updateEvent, deleteEvent, addScreenshot, removeScreenshot } =
    useEventsStore();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<DJEvent>>({});
  const [creating, setCreating] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const [access, setAccess] = useState<AdminAccess | null>(null);

  useEffect(() => {
    if (profileId) loadEvents(profileId);
  }, [profileId, loadEvents]);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/admin/access", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) {
          setAccess(data.access || null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAccess(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const canUseGoogleCalendar = Boolean(access?.isActive && access?.features?.google_calendar_sync);
  const canUseImageUploads = Boolean(access?.isActive && access?.features?.image_uploads);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const gcal = params.get("gcal");
    const reason = params.get("reason");

    if (!gcal) return;

    if (gcal === "success") {
      setSyncMsg(t("events.gcal.success"));
    } else {
      const reasonMap: Record<string, string> = {
        missing_params: t("events.gcal.errors.missing_params"),
        not_configured: t("events.gcal.errors.not_configured"),
        token_exchange: t("events.gcal.errors.token_exchange"),
        save_failed: t("events.gcal.errors.save_failed"),
        unknown: t("events.gcal.errors.unknown"),
        state_mismatch: t("events.gcal.errors.state_mismatch"),
      };
      setSyncMsg(`${t("common.error")}: ${reasonMap[reason || ""] || t("events.gcal.errors.default")}`);
    }

    params.delete("gcal");
    params.delete("reason");
    const nextUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ""}`;
    router.replace(nextUrl);
  }, [router]);

  const handleSync = async (direction: "pull" | "push" | "both") => {
    if (!canUseGoogleCalendar) {
      setSyncMsg(t("events.gcal.notAvailable"));
      return;
    }

    setSyncing(true);
    setSyncMsg(null);
    try {
      const res = await fetch("/api/gcal/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ direction }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSyncMsg(`${t("common.error")}: ${data.error || t("events.gcal.errors.syncFailed")}`);
      } else {
        setSyncMsg(t("events.gcal.syncSuccess", { pulled: String(data.pulled || 0), pushed: String(data.pushed || 0) }));
        if (profileId) loadEvents(profileId);
      }
    } catch {
      setSyncMsg(t("events.gcal.errors.syncError"));
    }
    setSyncing(false);
    setTimeout(() => setSyncMsg(null), 4000);
  };

  const handleConnectGCal = () => {
    if (!canUseGoogleCalendar) {
      setSyncMsg(t("events.gcal.notAvailable"));
      return;
    }

    window.location.href = "/api/gcal/connect";
  };

  const handleCreate = async () => {
    if (!profileId) return;
    setCreating(true);
    const newEvent = await createEvent(profileId, {
      name: t("events.actions.newEvent"),
      status: "upcoming",
    });
    setCreating(false);
    if (newEvent) {
      setEditingId(newEvent.id);
      setExpandedId(newEvent.id);
      setDraft({
        name: newEvent.name,
        date_time: newEvent.date_time,
        venue: newEvent.venue,
        status: newEvent.status,
        notes: newEvent.notes,
      });
    }
  };

  const handleEdit = (event: DJEvent) => {
    setEditingId(event.id);
    setExpandedId(event.id);
    setDraft({
      name: event.name,
      date_time: event.date_time,
      venue: event.venue,
      status: event.status,
      notes: event.notes,
    });
  };

  const handleSave = async () => {
    if (!editingId) return;
    await updateEvent(editingId, draft);
    setEditingId(null);
    setDraft({});
  };

  const handleCancel = () => {
    setEditingId(null);
    setDraft({});
  };

  const handleDelete = async (eventId: string) => {
    if (!confirm(t("events.actions.deleteConfirm"))) return;
    await deleteEvent(eventId);
    if (editingId === eventId) {
      setEditingId(null);
      setDraft({});
    }
    if (expandedId === eventId) setExpandedId(null);
  };

  const handleScreenshotUpload = async (eventId: string, urls: string[]) => {
    const event = events.find((e) => e.id === eventId);
    if (!event) return;
    const existingUrls = event.screenshots.map((s) => s.image_url);
    const newUrls = urls.filter((u) => !existingUrls.includes(u));
    for (const url of newUrls) {
      await addScreenshot(eventId, url);
    }
  };

  const handleScreenshotRemove = async (eventId: string, urls: string[]) => {
    const event = events.find((e) => e.id === eventId);
    if (!event) return;
    const removedScreenshots = event.screenshots.filter(
      (s) => !urls.includes(s.image_url)
    );
    for (const ss of removedScreenshots) {
      await removeScreenshot(ss.id);
    }
  };

  const inputClass =
    "w-full px-3 py-2.5 rounded-xl bg-transparent border border-glass text-sm focus:outline-none focus:border-brand-blue transition-colors";

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return t("events.dateNotSet");
    try {
      return new Date(dateStr).toLocaleDateString("he-IL", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  const upcomingEvents = events.filter((e) => e.status === "upcoming" || e.status === "confirmed");
  const pastEvents = events.filter((e) => e.status === "completed" || e.status === "cancelled");

  return (
    <div className="space-y-6">
      <div className="rounded-[24px] border border-white/10 bg-[rgba(12,16,24,0.72)] backdrop-blur-xl shadow-[0_16px_36px_rgba(0,0,0,0.16)] p-4 md:p-5">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] text-secondary">
              <Calendar className="w-3.5 h-3.5 text-brand-blue" />
              {t("events.title")}
            </div>
            <div>
              <h2 className="text-xl font-bold">{t("events.subtitle")}</h2>
              <p className="text-sm text-secondary mt-1 max-w-3xl leading-6">
                {t("events.description")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleConnectGCal}
              disabled={!userId || !canUseGoogleCalendar}
              className={`btn-secondary text-sm flex items-center gap-2 py-2.5 px-4 ${!canUseGoogleCalendar ? "opacity-50 cursor-not-allowed" : ""}`}
              title={canUseGoogleCalendar ? t("events.gcal.connectTitle") : t("events.gcal.proFeature")}
            >
              <Link className="w-4 h-4" />
              <span className="hidden sm:inline">{t("events.actions.connectGCal")}</span>
            </button>
            <button
              onClick={() => handleSync("both")}
              disabled={syncing || !userId || !canUseGoogleCalendar}
              className={`btn-secondary text-sm flex items-center gap-2 py-2.5 px-4 ${syncing || !canUseGoogleCalendar ? "opacity-70" : ""}`}
              title={canUseGoogleCalendar ? t("events.gcal.syncTitle") : t("events.gcal.proFeature")}
            >
              {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              <span className="hidden sm:inline">{syncing ? t("events.actions.syncing") : t("events.actions.sync")}</span>
            </button>
            <button
              onClick={handleCreate}
              disabled={creating || !profileId}
              className={`btn-primary text-sm flex items-center gap-2 py-2.5 px-5 ${creating ? "opacity-70" : ""}`}
            >
              <Plus className="w-4 h-4" />
              {creating ? t("events.actions.creating") : t("events.actions.newEvent")}
            </button>
          </div>
        </div>
      </div>

      {syncMsg && (
        <div className="glass-card p-3 text-sm text-center text-secondary">
          {syncMsg}
        </div>
      )}

      {!canUseGoogleCalendar && (
        <div className="glass-card p-3 text-sm text-muted">
          {t("events.gcal.notIncluded")}
        </div>
      )}

      {!canUseImageUploads && (
        <div className="glass-card p-3 text-sm text-muted">
          {t("events.uploads.notIncluded")}
        </div>
      )}

      {error && (
        <div className="glass-card p-3 text-sm" style={{ color: "var(--accent-danger)" }}>
          {error}
        </div>
      )}

      {!profileId && (
        <div className="glass-card p-5 text-center text-sm text-muted">
          {t("events.empty.needProfile")}
        </div>
      )}

      {loading && (
        <div className="glass-card p-5 text-center text-sm text-muted animate-pulse">
          {t("events.loading")}
        </div>
      )}

      {/* Upcoming Events */}
      {upcomingEvents.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-secondary">{t("events.sections.upcoming", { count: String(upcomingEvents.length) })}</h3>
          {upcomingEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              isEditing={editingId === event.id}
              isExpanded={expandedId === event.id}
              draft={editingId === event.id ? draft : {}}
              userId={userId}
              inputClass={inputClass}
              formatDate={formatDate}
              onToggleExpand={() => setExpandedId(expandedId === event.id ? null : event.id)}
              onEdit={() => handleEdit(event)}
              onSave={handleSave}
              onCancel={handleCancel}
              onDelete={() => handleDelete(event.id)}
              onDraftChange={setDraft}
              onScreenshotUpload={(urls) => handleScreenshotUpload(event.id, urls)}
              onScreenshotRemove={(urls) => handleScreenshotRemove(event.id, urls)}
              canUseImageUploads={canUseImageUploads}
              t={t}
              STATUS_OPTIONS={STATUS_OPTIONS}
            />
          ))}
        </div>
      )}

      {/* Past Events */}
      {pastEvents.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-secondary">{t("events.sections.past", { count: String(pastEvents.length) })}</h3>
          {pastEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              isEditing={editingId === event.id}
              isExpanded={expandedId === event.id}
              draft={editingId === event.id ? draft : {}}
              userId={userId}
              inputClass={inputClass}
              formatDate={formatDate}
              onToggleExpand={() => setExpandedId(expandedId === event.id ? null : event.id)}
              onEdit={() => handleEdit(event)}
              onSave={handleSave}
              onCancel={handleCancel}
              onDelete={() => handleDelete(event.id)}
              onDraftChange={setDraft}
              onScreenshotUpload={(urls) => handleScreenshotUpload(event.id, urls)}
              onScreenshotRemove={(urls) => handleScreenshotRemove(event.id, urls)}
              canUseImageUploads={canUseImageUploads}
              t={t}
              STATUS_OPTIONS={STATUS_OPTIONS}
            />
          ))}
        </div>
      )}

      {!loading && profileId && events.length === 0 && (
        <div className="glass-card p-8 text-center space-y-3">
          <Calendar className="w-10 h-10 text-muted mx-auto" />
          <p className="text-sm text-muted">{t("events.empty.noEvents")}</p>
          <p className="text-xs text-secondary">{t("events.empty.noEventsDetail")}</p>
        </div>
      )}
    </div>
  );
}

/* ── Event Card Sub-Component ── */

interface EventCardProps {
  event: DJEvent;
  isEditing: boolean;
  isExpanded: boolean;
  draft: Partial<DJEvent>;
  userId: string | null;
  inputClass: string;
  formatDate: (d: string | null) => string;
  onToggleExpand: () => void;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete: () => void;
  onDraftChange: (d: Partial<DJEvent>) => void;
  onScreenshotUpload: (urls: string[]) => void;
  onScreenshotRemove: (urls: string[]) => void;
  canUseImageUploads: boolean;
  t: (key: string) => string;
  STATUS_OPTIONS: Array<{ value: DJEvent["status"]; label: string; color: string }>;
}

function EventCard({
  event,
  isEditing,
  isExpanded,
  draft,
  userId,
  inputClass,
  formatDate,
  onToggleExpand,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  onDraftChange,
  onScreenshotUpload,
  onScreenshotRemove,
  canUseImageUploads,
  t,
  STATUS_OPTIONS,
}: EventCardProps) {
  const statusOption = STATUS_OPTIONS.find((s) => s.value === event.status);

  const screenshotUrls = event.screenshots.map((s) => s.image_url);

  return (
    <div className="glass-card overflow-hidden">
      {/* Header row */}
      <div
        className="flex items-center gap-3 p-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
        onClick={onToggleExpand}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold truncate">{event.name}</h4>
            <span
              className="text-[10px] font-medium px-2 py-0.5 rounded-full"
              style={{ background: `${statusOption?.color}20`, color: statusOption?.color }}
            >
              {statusOption?.label}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted mt-1">
            {event.date_time && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDate(event.date_time)}
              </span>
            )}
            {event.venue && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {event.venue}
              </span>
            )}
            {event.screenshots.length > 0 && (
              <span className="flex items-center gap-1">
                <ImageIcon className="w-3 h-3" />
                {event.screenshots.length}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {!isEditing && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-white/5 transition-colors"
              title={t("events.actions.edit")}
            >
              <Edit3 className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1.5 rounded-lg text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
            title="מחק"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-muted" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted" />
          )}
        </div>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="border-t border-glass p-4 space-y-4">
          {isEditing ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-muted mb-1 font-medium">שם האירוע</label>
                  <input
                    type="text"
                    value={draft.name ?? event.name}
                    onChange={(e) => onDraftChange({ ...draft, name: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted mb-1 font-medium">תאריך ושעה</label>
                  <input
                    type="datetime-local"
                    value={draft.date_time ? draft.date_time.slice(0, 16) : (event.date_time?.slice(0, 16) ?? "")}
                    onChange={(e) => onDraftChange({ ...draft, date_time: e.target.value ? new Date(e.target.value).toISOString() : null })}
                    className={inputClass}
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted mb-1 font-medium">מקום</label>
                  <input
                    type="text"
                    value={draft.venue ?? event.venue}
                    onChange={(e) => onDraftChange({ ...draft, venue: e.target.value })}
                    placeholder="שם המקום / אולם"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted mb-1 font-medium">סטטוס</label>
                  <select
                    value={draft.status ?? event.status}
                    onChange={(e) => onDraftChange({ ...draft, status: e.target.value as DJEvent["status"] })}
                    className={inputClass}
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs text-muted mb-1 font-medium">
                  <FileText className="w-3 h-3 inline ml-1" />
                  הערות
                </label>
                <textarea
                  value={draft.notes ?? event.notes}
                  onChange={(e) => onDraftChange({ ...draft, notes: e.target.value })}
                  placeholder="הערות לאירוע..."
                  className={`${inputClass} min-h-[60px] resize-y`}
                  rows={2}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={onCancel} className="btn-secondary text-sm flex items-center gap-1 px-4 py-2">
                  <X className="w-3.5 h-3.5" />
                  ביטול
                </button>
                <button onClick={onSave} className="btn-primary text-sm flex items-center gap-1 px-4 py-2">
                  <Check className="w-3.5 h-3.5" />
                  שמור
                </button>
              </div>
            </>
          ) : (
            <>
              {event.notes && (
                <div className="text-xs text-secondary leading-relaxed">
                  <FileText className="w-3 h-3 inline ml-1 text-muted" />
                  {event.notes}
                </div>
              )}
            </>
          )}

          {/* WhatsApp Screenshots */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-secondary flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-brand-blue" />
              צילומי מסך וואטסאפ (הוכחה חברתית)
            </h4>
            {userId && canUseImageUploads ? (
              <ImageUploader
                images={screenshotUrls}
                onChange={(newUrls) => {
                  // Find added and removed
                  const added = newUrls.filter((u) => !screenshotUrls.includes(u));
                  if (added.length > 0) onScreenshotUpload(newUrls);

                  const removedUrls = screenshotUrls.filter((u) => !newUrls.includes(u));
                  if (removedUrls.length > 0) onScreenshotRemove(newUrls);
                }}
                userId={userId}
                maxImages={20}
                folder="screenshots"
              />
            ) : userId ? (
              <p className="text-xs text-muted">העלאת תמונות לא זמינה לחשבון הזה</p>
            ) : (
              <p className="text-xs text-muted">התחברו עם אימייל כדי להעלות תמונות</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
