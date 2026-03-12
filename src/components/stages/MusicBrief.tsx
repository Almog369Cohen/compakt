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
import { formatDate, getSafeOrigin } from "@/lib/utils";

const CELEBRATION_EMOJIS = ["🎉", "🎵", "🎶", "✨", "💫", "🎧", "🎤", "💃", "🕺", "🌟"];

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function CelebrationParticle({
  emoji,
  delay,
  x,
  rotate,
  duration,
}: {
  emoji: string;
  delay: number;
  x: number;
  rotate: number;
  duration: number;
}) {
  return (
    <motion.div
      initial={{ y: 0, x, opacity: 1, scale: 1 }}
      animate={{ y: -300, opacity: 0, scale: 0.5, rotate }}
      transition={{ duration, delay, ease: "easeOut" }}
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

  const journeyLink = useMemo(() => {
    if (!event?.magicToken) return "";
    const djSlug =
      typeof window !== "undefined"
        ? window.sessionStorage.getItem("compakt_dj_slug")?.trim() || ""
        : "";
    return djSlug
      ? `${getSafeOrigin()}/dj/${djSlug}?token=${event.magicToken}`
      : `${getSafeOrigin()}?token=${event.magicToken}`;
  }, [event?.magicToken]);

  const technicalDetails = useMemo(() => {
    if (!event) return [];
    return [
      { label: "מספר אירוע", value: event.eventNumber || "—" },
      { label: "מזהה אירוע", value: event.id || "—" },
      { label: "Magic Token", value: event.magicToken || "—" },
      { label: "DJ ID", value: event.djId || "—" },
      { label: "שלב נוכחי", value: String(event.currentStage ?? 0) },
      { label: "נוצר בתאריך", value: event.createdAt || "—" },
      { label: "לינק אירוע", value: journeyLink || "—" },
    ];
  }, [event, journeyLink]);

  const celebrationParticles = useMemo(
    () =>
      Array.from({ length: 15 }).map((_, i) => ({
        key: `celebration-${i}`,
        emoji: CELEBRATION_EMOJIS[i % CELEBRATION_EMOJIS.length],
        delay: i * 0.12,
        x: 5 + Math.random() * 90,
        rotate: Math.random() * 360,
        duration: 2 + Math.random(),
      })),
    []
  );

  const handleCopyLink = () => {
    navigator.clipboard.writeText(journeyLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleDownloadPDF = async () => {
    try {
      const html2pdf = (await import("html2pdf.js")).default;
      const pdfNode = document.createElement("div");
      pdfNode.dir = "rtl";
      pdfNode.style.background = "#ffffff";
      pdfNode.style.color = "#111827";
      pdfNode.style.padding = "24px";
      pdfNode.style.width = "794px";
      pdfNode.style.fontFamily = "Arial, sans-serif";
      pdfNode.innerHTML = `
        <div style="direction: rtl; text-align: right;">
          <div style="margin-bottom: 16px; padding: 20px; border: 1px solid #e5e7eb; border-radius: 16px;">
            <h1 style="margin: 0 0 8px; font-size: 28px;">Music Brief</h1>
            <div style="font-size: 20px; font-weight: 700; margin-bottom: 6px;">${escapeHtml(eventTitle)}</div>
            ${event?.eventDate ? `<div style="font-size: 14px; color: #4b5563;">${escapeHtml(formatDate(event.eventDate))}</div>` : ""}
            ${event?.venue ? `<div style="font-size: 14px; color: #4b5563;">${escapeHtml(event.venue)}</div>` : ""}
            ${event?.eventNumber ? `<div style="font-size: 14px; color: #0891b2; margin-top: 8px;">מספר אירוע: ${escapeHtml(event.eventNumber)}</div>` : ""}
          </div>

          <div style="margin-bottom: 16px; padding: 20px; border: 1px solid #e5e7eb; border-radius: 16px;">
            <h2 style="margin: 0 0 10px; font-size: 18px;">פרטים טכניים לאימות</h2>
            ${technicalDetails
          .map(
            (item) => `
                  <div style="margin-bottom: 8px;">
                    <div style="font-size: 12px; color: #6b7280;">${escapeHtml(item.label)}</div>
                    <div style="font-size: 14px; font-weight: 600; word-break: break-word;">${escapeHtml(item.value)}</div>
                  </div>
                `
          )
          .join("")}
          </div>

          ${questionAnswerPairs.length > 0
          ? `
            <div style="margin-bottom: 16px; padding: 20px; border: 1px solid #e5e7eb; border-radius: 16px;">
              <h2 style="margin: 0 0 10px; font-size: 18px;">סגנון ואווירה</h2>
              ${questionAnswerPairs
            .map(
              (qa) => `
                    <div style="margin-bottom: 8px;">
                      <div style="font-size: 12px; color: #6b7280;">${escapeHtml(qa.question)}</div>
                      <div style="font-size: 14px; font-weight: 600;">${escapeHtml(qa.answer || "—")}</div>
                    </div>
                  `
            )
            .join("")}
            </div>
          `
          : ""
        }

          ${superLiked.length > 0
          ? `
            <div style="margin-bottom: 16px; padding: 20px; border: 1px solid #e5e7eb; border-radius: 16px;">
              <h2 style="margin: 0 0 10px; font-size: 18px;">שירי חובה (${superLiked.length})</h2>
              ${superLiked
            .filter(Boolean)
            .map(
              (song) => `
                    <div style="margin-bottom: 6px; font-size: 14px;">⭐ ${escapeHtml(song!.title)} — ${escapeHtml(song!.artist)}</div>
                  `
            )
            .join("")}
            </div>
          `
          : ""
        }

          ${liked.length > 0
          ? `
            <div style="margin-bottom: 16px; padding: 20px; border: 1px solid #e5e7eb; border-radius: 16px;">
              <h2 style="margin: 0 0 10px; font-size: 18px;">שירים שאהבנו (${liked.length})</h2>
              ${liked
            .filter(Boolean)
            .map(
              (song) => `
                    <div style="margin-bottom: 6px; font-size: 14px;">💚 ${escapeHtml(song!.title)} — ${escapeHtml(song!.artist)}</div>
                  `
            )
            .join("")}
            </div>
          `
          : ""
        }

          ${disliked.length > 0 || dislikeReasons.length > 0
          ? `
            <div style="margin-bottom: 16px; padding: 20px; border: 1px solid #e5e7eb; border-radius: 16px;">
              <h2 style="margin: 0 0 10px; font-size: 18px;">קווים אדומים</h2>
              ${dislikeReasons.length > 0
            ? `<div style="margin-bottom: 10px; font-size: 13px; color: #dc2626;">${dislikeReasons
              .map(([reason, count]) => `${escapeHtml(reason)} (${count})`)
              .join(" • ")}</div>`
            : ""
          }
              ${disliked
            .filter(Boolean)
            .slice(0, 12)
            .map(
              (song) => `
                    <div style="margin-bottom: 6px; font-size: 14px;">❌ ${escapeHtml(song!.title)} — ${escapeHtml(song!.artist)}</div>
                  `
            )
            .join("")}
            </div>
          `
          : ""
        }

          ${freeRequests.length > 0 || doRequests.length > 0 || dontRequests.length > 0 || linkRequests.length > 0 || momentRequests.length > 0
          ? `
            <div style="padding: 20px; border: 1px solid #e5e7eb; border-radius: 16px;">
              <h2 style="margin: 0 0 10px; font-size: 18px;">בקשות מיוחדות</h2>
              ${momentRequests.map((r) => `<div style="margin-bottom: 6px; font-size: 14px;">✨ ${escapeHtml(r.content)}</div>`).join("")}
              ${doRequests.map((r) => `<div style="margin-bottom: 6px; font-size: 14px; color: #059669;">✅ ${escapeHtml(r.content)}</div>`).join("")}
              ${dontRequests.map((r) => `<div style="margin-bottom: 6px; font-size: 14px; color: #dc2626;">❌ ${escapeHtml(r.content)}</div>`).join("")}
              ${freeRequests.map((r) => `<div style="margin-bottom: 6px; font-size: 14px;">${escapeHtml(r.content)}</div>`).join("")}
              ${linkRequests
            .map((r) => `<div style="margin-bottom: 6px; font-size: 14px; color: #2563eb; word-break: break-all;">${escapeHtml(r.content)}</div>`)
            .join("")}
            </div>
          `
          : ""
        }
        </div>
      `;
      document.body.appendChild(pdfNode);

      html2pdf()
        .set({
          margin: [10, 10],
          filename: `music-brief-${event?.eventNumber || event?.magicToken?.slice(0, 8) || "draft"}.pdf`,
          image: { type: "jpeg", quality: 0.95 },
          html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff" },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        })
        .from(pdfNode)
        .save()
        .finally(() => {
          pdfNode.remove();
        });
    } catch {
      alert("ייצוא PDF נכשל (לעיתים קורה בדפדפנים במובייל). אפשר להשתמש ב'העתק סיכום' ולשלוח בוואטסאפ.");
    }
  };

  const buildTextSummary = () => {
    const lines: string[] = [];
    lines.push(`🎵 Music Brief — ${eventTitle}`);
    if (event?.eventNumber) lines.push(`🆔 מספר אירוע: ${event.eventNumber}`);
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
    if (event?.id) lines.push(`Event ID: ${event.id}`);
    if (event?.magicToken) lines.push(`Magic Token: ${event.magicToken}`);
    if (event?.djId) lines.push(`DJ ID: ${event.djId}`);
    lines.push(`🔗 ${journeyLink}`);
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
          celebrationParticles.map((particle) => (
            <CelebrationParticle
              key={particle.key}
              emoji={particle.emoji}
              delay={particle.delay}
              x={particle.x}
              rotate={particle.rotate}
              duration={particle.duration}
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
          disabled={!journeyLink}
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
          {event?.eventNumber && (
            <p className="text-sm text-brand-blue mt-2">מספר אירוע: {event.eventNumber}</p>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.03 }}
          className="glass-card p-5"
        >
          <h3 className="font-bold text-sm mb-3">פרטים טכניים לאימות</h3>
          <div className="space-y-2">
            {technicalDetails.map((item) => (
              <div key={item.label} className="text-sm">
                <span className="text-muted">{item.label}</span>
                <p className="font-medium break-all" dir="ltr">{item.value}</p>
              </div>
            ))}
          </div>
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
