"use client";

import { useEffect, useState } from "react";
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

const STATUS_OPTIONS: { value: DJEvent["status"]; label: string; color: string }[] = [
  { value: "upcoming", label: "קרוב", color: "#059cc0" },
  { value: "confirmed", label: "מאושר", color: "#03b28c" },
  { value: "completed", label: "הושלם", color: "#8b5cf6" },
  { value: "cancelled", label: "בוטל", color: "#ef4444" },
];

export function EventsManager() {
  const profileId = useProfileStore((s) => s.profileId);
  const userId = useAdminStore((s) => s.userId);
  const { events, loading, error, loadEvents, createEvent, updateEvent, deleteEvent, addScreenshot, removeScreenshot } =
    useEventsStore();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<DJEvent>>({});
  const [creating, setCreating] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);

  useEffect(() => {
    if (profileId) loadEvents(profileId);
  }, [profileId, loadEvents]);

  const handleSync = async (direction: "pull" | "push" | "both") => {
    if (!userId) return;
    setSyncing(true);
    setSyncMsg(null);
    try {
      const res = await fetch("/api/gcal/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, direction }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSyncMsg(`שגיאה: ${data.error || "סנכרון נכשל"}`);
      } else {
        setSyncMsg(`סונכרן! ${data.pulled || 0} נמשכו, ${data.pushed || 0} נדחפו`);
        if (profileId) loadEvents(profileId);
      }
    } catch {
      setSyncMsg("שגיאה בסנכרון");
    }
    setSyncing(false);
    setTimeout(() => setSyncMsg(null), 4000);
  };

  const handleConnectGCal = () => {
    if (!userId) return;
    window.location.href = `/api/gcal/connect?userId=${userId}`;
  };

  const handleCreate = async () => {
    if (!profileId) return;
    setCreating(true);
    const newEvent = await createEvent(profileId, {
      name: "אירוע חדש",
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
    if (!confirm("למחוק את האירוע?")) return;
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
    if (!dateStr) return "לא נקבע";
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
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Calendar className="w-5 h-5 text-brand-blue" />
          ניהול אירועים
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={handleConnectGCal}
            disabled={!userId}
            className="btn-secondary text-sm flex items-center gap-2 py-2.5 px-4"
            title="חברו את Google Calendar"
          >
            <Link className="w-4 h-4" />
            <span className="hidden sm:inline">חבר Google Calendar</span>
          </button>
          <button
            onClick={() => handleSync("both")}
            disabled={syncing || !userId}
            className={`btn-secondary text-sm flex items-center gap-2 py-2.5 px-4 ${syncing ? "opacity-70" : ""}`}
            title="סנכרן עם Google Calendar"
          >
            {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            <span className="hidden sm:inline">{syncing ? "מסנכרן..." : "סנכרן"}</span>
          </button>
          <button
            onClick={handleCreate}
            disabled={creating || !profileId}
            className={`btn-primary text-sm flex items-center gap-2 py-2.5 px-5 ${creating ? "opacity-70" : ""}`}
          >
            <Plus className="w-4 h-4" />
            {creating ? "יוצר..." : "אירוע חדש"}
          </button>
        </div>
      </div>

      {syncMsg && (
        <div className="glass-card p-3 text-sm text-center text-secondary">
          {syncMsg}
        </div>
      )}

      {error && (
        <div className="glass-card p-3 text-sm" style={{ color: "var(--accent-danger)" }}>
          {error}
        </div>
      )}

      {!profileId && (
        <div className="glass-card p-5 text-center text-sm text-muted">
          צריך לשמור פרופיל קודם כדי לנהל אירועים
        </div>
      )}

      {loading && (
        <div className="glass-card p-5 text-center text-sm text-muted animate-pulse">
          טוען אירועים...
        </div>
      )}

      {/* Upcoming Events */}
      {upcomingEvents.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-secondary">אירועים קרובים ({upcomingEvents.length})</h3>
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
            />
          ))}
        </div>
      )}

      {/* Past Events */}
      {pastEvents.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-secondary">אירועים שהסתיימו ({pastEvents.length})</h3>
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
            />
          ))}
        </div>
      )}

      {!loading && profileId && events.length === 0 && (
        <div className="glass-card p-8 text-center space-y-3">
          <Calendar className="w-10 h-10 text-muted mx-auto" />
          <p className="text-sm text-muted">אין אירועים עדיין</p>
          <p className="text-xs text-muted">לחצו &quot;אירוע חדש&quot; כדי להוסיף את האירוע הראשון</p>
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
              title="ערוך"
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
            {userId ? (
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
            ) : (
              <p className="text-xs text-muted">התחברו עם אימייל כדי להעלות תמונות</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
