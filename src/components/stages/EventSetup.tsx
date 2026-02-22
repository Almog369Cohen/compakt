"use client";

import { useState } from "react";
import { useEventStore } from "@/stores/eventStore";
import { motion, AnimatePresence } from "framer-motion";
import { Music, PartyPopper, Briefcase, Star, Heart, Copy, Check, Share2 } from "lucide-react";
import type { EventType } from "@/lib/types";

const eventTypes: { type: EventType; label: string; icon: React.ReactNode }[] = [
  { type: "wedding", label: "חתונה", icon: <Heart className="w-6 h-6" /> },
  { type: "bar_mitzvah", label: "בר/בת מצווה", icon: <Star className="w-6 h-6" /> },
  { type: "private", label: "אירוע פרטי", icon: <PartyPopper className="w-6 h-6" /> },
  { type: "corporate", label: "אירוע עסקי", icon: <Briefcase className="w-6 h-6" /> },
  { type: "other", label: "אחר", icon: <Music className="w-6 h-6" /> },
];

export function EventSetup() {
  const event = useEventStore((s) => s.event);
  const createEvent = useEventStore((s) => s.createEvent);
  const updateEvent = useEventStore((s) => s.updateEvent);
  const setStage = useEventStore((s) => s.setStage);
  const trackEvent = useEventStore((s) => s.trackEvent);

  const [selectedType, setSelectedType] = useState<EventType>(event?.eventType || "wedding");
  const [coupleNameA, setCoupleNameA] = useState(event?.coupleNameA || "");
  const [coupleNameB, setCoupleNameB] = useState(event?.coupleNameB || "");
  const [eventDate, setEventDate] = useState(event?.eventDate || "");
  const [venue, setVenue] = useState(event?.venue || "");
  const [showLink, setShowLink] = useState(false);
  const [copied, setCopied] = useState(false);
  const [magicToken, setMagicToken] = useState(event?.magicToken || "");

  const handleStart = () => {
    if (event) {
      updateEvent({
        eventType: selectedType,
        coupleNameA,
        coupleNameB,
        eventDate: eventDate || undefined,
        venue: venue || undefined,
      });
      setStage(1);
      trackEvent("stage_complete", { stage: 0 });
    } else {
      const token = createEvent({
        eventType: selectedType,
        coupleNameA: coupleNameA || undefined,
        coupleNameB: coupleNameB || undefined,
        eventDate: eventDate || undefined,
        venue: venue || undefined,
      });
      setMagicToken(token);
      setShowLink(true);
      trackEvent("event_created", { eventType: selectedType });
    }
  };

  const handleContinue = () => {
    setStage(1);
    trackEvent("stage_complete", { stage: 0 });
  };

  const copyLink = () => {
    const url = `${window.location.origin}?token=${magicToken}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareWhatsApp = () => {
    const url = `${window.location.origin}?token=${magicToken}`;
    const text = `🎵 הצטרפו למסע המוזיקלי שלנו!\n${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md mx-auto"
    >
      <AnimatePresence mode="wait">
        {!showLink ? (
          <motion.div
            key="form"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="glass-card p-6 sm:p-8"
          >
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
                className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
                style={{ background: "linear-gradient(135deg, #059cc0, #03b28c)" }}
              >
                <Music className="w-8 h-8 text-white" />
              </motion.div>
              <h1 className="text-2xl font-bold mb-2">Compakt</h1>
              <p className="text-secondary text-sm">!בואו ניצור את האירוע שלכם</p>
            </div>

            <div className="space-y-6">
              {/* Event Type */}
              <div>
                <label className="block text-sm font-medium mb-3">סוג האירוע</label>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {eventTypes.map((et) => (
                    <button
                      key={et.type}
                      onClick={() => setSelectedType(et.type)}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${
                        selectedType === et.type
                          ? "border-brand-blue bg-brand-blue/10 text-brand-blue"
                          : "border-glass text-secondary hover:border-brand-blue/50"
                      }`}
                    >
                      {et.icon}
                      <span className="text-xs font-medium">{et.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Names */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-muted mb-1">שם ראשון</label>
                  <input
                    type="text"
                    value={coupleNameA}
                    onChange={(e) => setCoupleNameA(e.target.value)}
                    placeholder="דנה"
                    className="w-full px-3 py-2.5 rounded-xl bg-transparent border border-glass text-foreground placeholder:text-muted text-sm focus:outline-none focus:border-brand-blue transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted mb-1">שם שני</label>
                  <input
                    type="text"
                    value={coupleNameB}
                    onChange={(e) => setCoupleNameB(e.target.value)}
                    placeholder="אלון"
                    className="w-full px-3 py-2.5 rounded-xl bg-transparent border border-glass text-foreground placeholder:text-muted text-sm focus:outline-none focus:border-brand-blue transition-colors"
                  />
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs text-muted mb-1">תאריך (אופציונלי)</label>
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-transparent border border-glass text-foreground text-sm focus:outline-none focus:border-brand-blue transition-colors"
                />
              </div>

              {/* Venue */}
              <div>
                <label className="block text-xs text-muted mb-1">אולם / מקום (אופציונלי)</label>
                <input
                  type="text"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  placeholder="שם האולם או העיר"
                  className="w-full px-3 py-2.5 rounded-xl bg-transparent border border-glass text-foreground placeholder:text-muted text-sm focus:outline-none focus:border-brand-blue transition-colors"
                />
              </div>

              <button
                onClick={handleStart}
                className="btn-primary w-full text-base"
              >
                ← יאללה מתחילים
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="link"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="glass-card p-6 sm:p-8 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.1 }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
              style={{ background: "linear-gradient(135deg, #03b28c, #059cc0)" }}
            >
              <Check className="w-8 h-8 text-white" />
            </motion.div>

            <h2 className="text-xl font-bold mb-2">!האירוע נוצר</h2>
            <p className="text-secondary text-sm mb-6">
              שמרו את הלינק הזה כדי לחזור בכל זמן
            </p>

            <div className="glass-card p-3 rounded-xl mb-4 flex items-center gap-2">
              <code className="text-xs text-brand-blue flex-1 truncate" dir="ltr">
                {typeof window !== "undefined"
                  ? `${window.location.origin}?token=${magicToken}`
                  : `...?token=${magicToken}`}
              </code>
              <button
                onClick={copyLink}
                className="p-2 rounded-lg hover:bg-brand-blue/10 transition-colors"
                aria-label="העתק לינק"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-brand-green" />
                ) : (
                  <Copy className="w-4 h-4 text-brand-blue" />
                )}
              </button>
            </div>

            <button
              onClick={shareWhatsApp}
              className="btn-secondary w-full mb-3 flex items-center justify-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              שתפו בוואטסאפ
            </button>

            <button
              onClick={handleContinue}
              className="btn-primary w-full text-base"
            >
              ← בואו נתחיל
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
