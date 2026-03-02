"use client";

import { useEffect, useState, useCallback } from "react";
import { useProfileStore } from "@/stores/profileStore";
import { useAdminStore } from "@/stores/adminStore";
import { trackAnalytics } from "@/hooks/useAnalytics";
import { getSafeOrigin } from "@/lib/utils";
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
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CoupleEvent {
  id: string;
  magic_token: string;
  event_type: string;
  couple_name_a: string;
  couple_name_b: string;
  event_date: string;
  venue: string;
  current_stage: number;
  phone_number: string | null;
  answerCount: number;
  swipeCount: number;
  isComplete: boolean;
  created_at: string;
}

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

export function CoupleLinks() {
  const profileId = useProfileStore((s) => s.profileId);
  const userId = useAdminStore((s) => s.userId);
  const [events, setEvents] = useState<CoupleEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
    try {
      const res = await fetch(`/api/admin/couple-link?profileId=${profileId}`);
      const data = await res.json();
      if (res.ok) setEvents(data.events || []);
    } catch {
      // silent
    }
    setLoading(false);
  }, [profileId]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const handleCreate = async () => {
    if (!profileId) return;
    setCreating(true);
    try {
      const res = await fetch("/api/admin/couple-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId,
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
    }
    setCreating(false);
  };

  const getLink = (token: string) => `${getSafeOrigin()}/?token=${token}`;

  const copyLink = (token: string, eventId: string) => {
    navigator.clipboard.writeText(getLink(token));
    setCopiedId(eventId);
    trackAnalytics("couple_link_copied", {
      category: "admin",
      djId: profileId || undefined,
    });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const shareWhatsApp = (token: string, nameA: string, nameB: string) => {
    const names = [nameA, nameB].filter(Boolean).join(" & ");
    const greeting = names ? `שלום ${names}!` : "שלום!";
    const text = `${greeting} 🎵\nהכנתי לכם שאלון מוזיקלי לאירוע — מלאו אותו ונדייק את הפלייליסט:\n${getLink(token)}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
    trackAnalytics("couple_link_shared_whatsapp", {
      category: "admin",
      djId: profileId || undefined,
    });
  };

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
      {loading && events.length === 0 && (
        <div className="flex justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-brand-blue" />
        </div>
      )}

      {/* Empty State */}
      {!loading && events.length === 0 && (
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

          return (
            <div key={ev.id} className="glass-card overflow-hidden">
              {/* Header row */}
              <button
                onClick={() => setExpandedId(isExpanded ? null : ev.id)}
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
                  {ev.phone_number && (
                    <Phone className="w-3.5 h-3.5 text-brand-green" />
                  )}
                  <span className="text-xs text-muted">
                    {ev.answerCount} תשובות
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
                      {/* Link */}
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

                      {/* Share button */}
                      <button
                        onClick={() => shareWhatsApp(ev.magic_token, ev.couple_name_a, ev.couple_name_b)}
                        className="btn-secondary w-full text-xs flex items-center justify-center gap-2"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        שלחו בוואטסאפ
                      </button>

                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="glass-card p-2 rounded-lg">
                          <p className="text-lg font-bold text-brand-blue">{ev.answerCount}</p>
                          <p className="text-xs text-muted">תשובות</p>
                        </div>
                        <div className="glass-card p-2 rounded-lg">
                          <p className="text-lg font-bold text-brand-blue">{ev.swipeCount}</p>
                          <p className="text-xs text-muted">סוויפים</p>
                        </div>
                        <div className="glass-card p-2 rounded-lg">
                          <p className="text-lg font-bold" style={{ color: ev.isComplete ? "#03b28c" : "#059cc0" }}>
                            {ev.current_stage}/4
                          </p>
                          <p className="text-xs text-muted">שלב</p>
                        </div>
                      </div>

                      {/* Phone */}
                      {ev.phone_number && (
                        <p className="text-xs text-muted flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          טלפון: <span className="font-mono" dir="ltr">{ev.phone_number}</span>
                        </p>
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
