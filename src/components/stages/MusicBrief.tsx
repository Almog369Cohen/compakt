"use client";

import { useMemo, useRef, useEffect } from "react";
import { useEventStore } from "@/stores/eventStore";
import { useAdminStore } from "@/stores/adminStore";
import { motion, AnimatePresence } from "framer-motion";
import {
  Download,
  Share2,
  Heart,
  Star,
  XCircle,
  Music,
  Users,
  Zap,
  Link as LinkIcon,
  Copy,
  Check,
} from "lucide-react";
import { useState } from "react";
import { formatDate } from "@/lib/utils";

const CELEBRATION_EMOJIS = ["🎉", "🎵", "🎶", "✨", "💫", "🎧", "🎤", "💃", "🕺", "🌟"];

function CelebrationParticle({ emoji, delay, x }: { emoji: string; delay: number; x: number }) {
  return (
    <motion.div
      initial={{ y: 0, x, opacity: 1, scale: 1 }}
      animate={{ y: -300, opacity: 0, scale: 0.5, rotate: Math.random() * 360 }}
      transition={{ duration: 2 + Math.random(), delay, ease: "easeOut" }}
      className="fixed bottom-0 text-2xl pointer-events-none z-50"
      style={{ left: `${x}%` }}
    >
      {emoji}
    </motion.div>
  );
}

export function MusicBrief() {
  const event = useEventStore((s) => s.event);
  const swipes = useEventStore((s) => s.swipes);
  const answers = useEventStore((s) => s.answers);
  const requests = useEventStore((s) => s.requests);
  const briefRef = useRef<HTMLDivElement>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [showCelebration, setShowCelebration] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowCelebration(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  const adminSongs = useAdminStore((s) => s.songs);
  const adminQuestions = useAdminStore((s) => s.questions);

  const songMap = useMemo(() => {
    const map = new Map<string, (typeof adminSongs)[0]>();
    adminSongs.forEach((s) => map.set(s.id, s));
    return map;
  }, [adminSongs]);

  const superLiked = useMemo(
    () =>
      swipes
        .filter((s) => s.action === "super_like")
        .map((s) => songMap.get(s.songId))
        .filter(Boolean),
    [swipes, songMap]
  );

  const liked = useMemo(
    () =>
      swipes
        .filter((s) => s.action === "like")
        .map((s) => songMap.get(s.songId))
        .filter(Boolean),
    [swipes, songMap]
  );

  const disliked = useMemo(
    () =>
      swipes
        .filter((s) => s.action === "dislike")
        .map((s) => songMap.get(s.songId))
        .filter(Boolean),
    [swipes, songMap]
  );

  const dislikeReasons = useMemo(() => {
    const reasons = new Map<string, number>();
    swipes
      .filter((s) => s.action === "dislike")
      .forEach((s) => {
        s.reasonChips.forEach((chip) => {
          reasons.set(chip, (reasons.get(chip) || 0) + 1);
        });
      });
    return Array.from(reasons.entries()).sort((a, b) => b[1] - a[1]);
  }, [swipes]);

  const questionAnswerPairs = useMemo(() => {
    return answers.map((a) => {
      const question = adminQuestions.find((q) => q.id === a.questionId);
      let displayValue = "";
      if (Array.isArray(a.answerValue)) {
        displayValue = a.answerValue
          .map((v) => {
            const opt = question?.options?.find((o) => o.value === v);
            return opt?.label || v;
          })
          .join(", ");
      } else if (typeof a.answerValue === "number") {
        const labels = question?.sliderLabels;
        displayValue = labels?.[a.answerValue - (question?.sliderMin || 1)] || String(a.answerValue);
      } else {
        const opt = question?.options?.find((o) => o.value === a.answerValue);
        displayValue = opt?.label || a.answerValue;
      }
      return {
        question: question?.questionHe || "",
        answer: displayValue,
      };
    });
  }, [answers, adminQuestions]);

  const doRequests = requests.filter((r) => r.requestType === "do");
  const dontRequests = requests.filter((r) => r.requestType === "dont");
  const freeRequests = requests.filter((r) => r.requestType === "free_text");
  const linkRequests = requests.filter((r) => r.requestType === "link");
  const momentRequests = requests.filter((r) => r.requestType === "special_moment");

  const eventTitle = useMemo(() => {
    const names = [event?.coupleNameA, event?.coupleNameB].filter(Boolean).join(" & ");
    const typeLabels: Record<string, string> = {
      wedding: "חתונת",
      bar_mitzvah: "בר/בת מצווה",
      private: "אירוע פרטי",
      corporate: "אירוע עסקי",
      other: "אירוע",
    };
    const label = typeLabels[event?.eventType || "wedding"] || "אירוע";
    return names ? `${label} ${names}` : label;
  }, [event]);

  const handleCopyLink = () => {
    const url = `${window.location.origin}?token=${event?.magicToken}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleDownloadPDF = async () => {
    if (!briefRef.current) return;
    try {
      const html2pdf = (await import("html2pdf.js")).default;
      html2pdf()
        .set({
          margin: [10, 10],
          filename: `music-brief-${event?.magicToken?.slice(0, 8) || "draft"}.pdf`,
          image: { type: "jpeg", quality: 0.95 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        })
        .from(briefRef.current)
        .save();
    } catch {
      alert("ייצוא PDF נכשל (לעיתים קורה בדפדפנים במובייל). אפשר להשתמש ב'העתק סיכום' ולשלוח בוואטסאפ.");
    }
  };

  const buildTextSummary = () => {
    const lines: string[] = [];
    lines.push(`🎵 Music Brief — ${eventTitle}`);
    if (event?.eventDate) lines.push(`📅 ${event.eventDate}`);
    if (event?.venue) lines.push(`📍 ${event.venue}`);
    lines.push("");

    if (superLiked.length > 0) {
      lines.push("⭐ חובה:");
      superLiked.forEach((s) => s && lines.push(`  • ${s.title} — ${s.artist}`));
      lines.push("");
    }
    if (liked.length > 0) {
      lines.push(`💚 אהבנו (${liked.length}):`);
      liked.slice(0, 8).forEach((s) => s && lines.push(`  • ${s.title} — ${s.artist}`));
      if (liked.length > 8) lines.push(`  ...ועוד ${liked.length - 8}`);
      lines.push("");
    }
    if (doRequests.length > 0) {
      lines.push("✅ כן בבקשה:");
      doRequests.forEach((r) => lines.push(`  • ${r.content}`));
      lines.push("");
    }
    if (dontRequests.length > 0) {
      lines.push("❌ בלי:");
      dontRequests.forEach((r) => lines.push(`  • ${r.content}`));
      lines.push("");
    }
    const url = `${window.location.origin}?token=${event?.magicToken}`;
    lines.push(`🔗 ${url}`);
    return lines.join("\n");
  };

  const handleShareWhatsApp = () => {
    const text = buildTextSummary();
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleCopyText = async () => {
    const text = buildTextSummary();
    await navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const isEmpty = swipes.length === 0 && answers.length === 0 && requests.length === 0;

  return (
    <div className="w-full max-w-lg mx-auto space-y-4">
      {/* Celebration Particles */}
      <AnimatePresence>
        {showCelebration &&
          Array.from({ length: 15 }).map((_, i) => (
            <CelebrationParticle
              key={i}
              emoji={CELEBRATION_EMOJIS[i % CELEBRATION_EMOJIS.length]}
              delay={i * 0.12}
              x={5 + Math.random() * 90}
            />
          ))}
      </AnimatePresence>

      {/* Actions Bar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-center gap-2 flex-wrap"
      >
        <button
          onClick={handleDownloadPDF}
          className="btn-primary text-sm flex items-center gap-2 py-2 px-4"
        >
          <Download className="w-4 h-4" />
          הורדת PDF
        </button>
        <button
          onClick={handleCopyLink}
          className="btn-secondary text-sm flex items-center gap-2 py-2 px-4"
        >
          {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copiedLink ? "הועתק!" : "העתק לינק"}
        </button>
        <button
          onClick={handleCopyText}
          className="btn-secondary text-sm flex items-center gap-2 py-2 px-4"
        >
          {copiedText ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copiedText ? "הועתק!" : "העתק סיכום"}
        </button>
        <button
          onClick={handleShareWhatsApp}
          className="btn-secondary text-sm flex items-center gap-2 py-2 px-4"
        >
          <Share2 className="w-4 h-4" />
          שתפו
        </button>
      </motion.div>

      {/* Brief Content */}
      <div ref={briefRef} className="space-y-4">
        {isEmpty && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-5 text-center"
          >
            <p className="text-sm font-medium mb-1">אין עדיין מספיק נתונים לסיכום</p>
            <p className="text-xs text-secondary">
              חזרו לשלבים הקודמים, ענו על כמה שאלות וסמנו שירים — ואז ה-Music Brief יתמלא.
            </p>
          </motion.div>
        )}

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 text-center"
        >
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-3"
            style={{ background: "linear-gradient(135deg, #059cc0, #03b28c)" }}
          >
            <Music className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold mb-1">Music Brief</h1>
          <h2 className="text-lg text-secondary mb-1">{eventTitle}</h2>
          {event?.eventDate && (
            <p className="text-sm text-muted">{formatDate(event.eventDate)}</p>
          )}
          {event?.venue && (
            <p className="text-sm text-muted">{event.venue}</p>
          )}
        </motion.div>

        {/* Preferences Summary */}
        {questionAnswerPairs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="glass-card p-5"
          >
            <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-brand-blue" />
              סגנון ואווירה
            </h3>
            <div className="space-y-2">
              {questionAnswerPairs.map((qa, i) => (
                <div key={i} className="text-sm">
                  <span className="text-muted">{qa.question}</span>
                  <p className="text-foreground font-medium">{qa.answer}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Super Likes */}
        {superLiked.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-5"
          >
            <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
              <Star className="w-4 h-4" style={{ color: "var(--accent-gold)" }} fill="var(--accent-gold)" />
              !חייבים ({superLiked.length})
            </h3>
            <div className="space-y-2">
              {superLiked.map((song) =>
                song ? (
                  <div key={song.id} className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={song.coverUrl}
                      alt={song.title}
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{song.title}</p>
                      <p className="text-xs text-secondary truncate">{song.artist}</p>
                    </div>
                    <Star className="w-4 h-4 flex-shrink-0" style={{ color: "var(--accent-gold)" }} fill="var(--accent-gold)" />
                  </div>
                ) : null
              )}
            </div>
          </motion.div>
        )}

        {/* Liked Songs */}
        {liked.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="glass-card p-5"
          >
            <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
              <Heart className="w-4 h-4 text-brand-green" fill="var(--accent-secondary)" />
              שירים שאהבנו ({liked.length})
            </h3>
            <div className="space-y-2">
              {liked.map((song) =>
                song ? (
                  <div key={song.id} className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={song.coverUrl}
                      alt={song.title}
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{song.title}</p>
                      <p className="text-xs text-secondary truncate">{song.artist}</p>
                    </div>
                  </div>
                ) : null
              )}
            </div>
          </motion.div>
        )}

        {/* Red Lines */}
        {(disliked.length > 0 || dislikeReasons.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-5"
          >
            <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
              <XCircle className="w-4 h-4" style={{ color: "var(--accent-danger)" }} />
              קווים אדומים
            </h3>
            {dislikeReasons.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {dislikeReasons.map(([reason, count]) => (
                  <span
                    key={reason}
                    className="text-xs px-2.5 py-1 rounded-full border"
                    style={{ borderColor: "var(--accent-danger)", color: "var(--accent-danger)" }}
                  >
                    {reason} ({count})
                  </span>
                ))}
              </div>
            )}
            <div className="space-y-1">
              {disliked.slice(0, 5).map((song) =>
                song ? (
                  <p key={song.id} className="text-xs text-muted">
                    ❌ {song.title} — {song.artist}
                  </p>
                ) : null
              )}
              {disliked.length > 5 && (
                <p className="text-xs text-muted">...ועוד {disliked.length - 5}</p>
              )}
            </div>
          </motion.div>
        )}

        {/* Crowd Notes */}
        {(answers.find((a) => a.questionId === "q2") || answers.find((a) => a.questionId === "q6")) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="glass-card p-5"
          >
            <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-brand-blue" />
              הקהל
            </h3>
            {questionAnswerPairs
              .filter((_, i) => {
                const qId = answers[i]?.questionId;
                return qId === "q2" || qId === "q6";
              })
              .map((qa, i) => (
                <div key={i} className="text-sm mb-1">
                  <span className="text-muted">{qa.question}: </span>
                  <span className="font-medium">{qa.answer}</span>
                </div>
              ))}
          </motion.div>
        )}

        {/* Requests & Links */}
        {(freeRequests.length > 0 ||
          doRequests.length > 0 ||
          dontRequests.length > 0 ||
          linkRequests.length > 0 ||
          momentRequests.length > 0) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-card p-5"
            >
              <h3 className="font-bold text-sm mb-3">בקשות מיוחדות</h3>

              {momentRequests.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-muted mb-1">רגעים מיוחדים:</p>
                  {momentRequests.map((r) => (
                    <p key={r.id} className="text-sm">
                      ✨ {r.content}
                    </p>
                  ))}
                </div>
              )}

              {doRequests.length > 0 && (
                <div className="mb-2">
                  <p className="text-xs text-brand-green mb-1">חובה:</p>
                  {doRequests.map((r) => (
                    <p key={r.id} className="text-sm text-brand-green">✅ {r.content}</p>
                  ))}
                </div>
              )}

              {dontRequests.length > 0 && (
                <div className="mb-2">
                  <p className="text-xs mb-1" style={{ color: "var(--accent-danger)" }}>
                    קו אדום:
                  </p>
                  {dontRequests.map((r) => (
                    <p key={r.id} className="text-sm" style={{ color: "var(--accent-danger)" }}>
                      ❌ {r.content}
                    </p>
                  ))}
                </div>
              )}

              {freeRequests.length > 0 && (
                <div className="mb-2">
                  <p className="text-xs text-muted mb-1">בקשות:</p>
                  {freeRequests.map((r) => (
                    <p key={r.id} className="text-sm">{r.content}</p>
                  ))}
                </div>
              )}

              {linkRequests.length > 0 && (
                <div>
                  <p className="text-xs text-muted mb-1">לינקים:</p>
                  {linkRequests.map((r) => (
                    <a
                      key={r.id}
                      href={r.content}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm text-brand-blue hover:underline"
                      dir="ltr"
                    >
                      <LinkIcon className="w-3 h-3" />
                      {r.content}
                    </a>
                  ))}
                </div>
              )}
            </motion.div>
          )}
      </div>
    </div>
  );
}
