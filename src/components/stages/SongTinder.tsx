"use client";

import { useState, useCallback, useEffect, useMemo, useRef, type CSSProperties } from "react";
import { useEventStore } from "@/stores/eventStore";
import { useAdminStore } from "@/stores/adminStore";
import { reasonChips } from "@/data/songs";
import { motion, AnimatePresence, useMotionValue, useTransform, animate, PanInfo } from "framer-motion";
import { Heart, X, Star, HelpCircle, Play, Pause, Volume2, SkipForward, Undo2, Music2, Share2, Check, Copy, Headphones, Sparkles } from "lucide-react";
import type { SwipeAction, Song, SongSwipe } from "@/lib/types";
import { SwipeTutorial, useSwipeTutorial } from "@/components/ui/SwipeTutorial";
import { resolveSongMedia } from "@/lib/songMedia";
import { safeCopyText } from "@/lib/clipboard";
import { getSafeOrigin } from "@/lib/utils";
import { useProfileStore } from "@/stores/profileStore";
import { buildTasteInsight } from "@/lib/tasteProfile";
import type { TasteInsight } from "@/lib/tasteProfile";
import {
  DEFAULT_SONG_CATEGORY_LABELS,
  SONG_CATEGORY_COLORS,
} from "@/lib/songCategories";

const SWIPE_THRESHOLD = 80;
const SWIPE_UP_THRESHOLD = 80;
const MIN_SWIPES = 10;
const TASTE_REVEAL_AT = 8;

export function SongTinder() {
  const event = useEventStore((s) => s.event);
  const saveSwipe = useEventStore((s) => s.saveSwipe);
  const getSwipedSongIds = useEventStore((s) => s.getSwipedSongIds);
  const swipes = useEventStore((s) => s.swipes);
  const setStage = useEventStore((s) => s.setStage);
  const trackEvent = useEventStore((s) => s.trackEvent);
  const setSwipes = useEventStore((s) => s.setSwipes);
  const adminSongs = useAdminStore((s) => s.songs);
  const songCategoryLabels = useProfileStore((s) => s.profile.songCategoryLabels);

  const allActive = useMemo(() => adminSongs.filter((s) => s.isActive), [adminSongs]);
  const songMap = useMemo(() => new Map(adminSongs.map((song) => [song.id, song])), [adminSongs]);
  const swipedIds = getSwipedSongIds();
  const availableSongs = allActive.filter((s) => !swipedIds.includes(s.id));

  // No currentIndex needed — availableSongs[0] is always the current card
  const [showReasons, setShowReasons] = useState(false);
  const [lastSwipedSongId, setLastSwipedSongId] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<SwipeAction | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showSuperBurst, setShowSuperBurst] = useState(false);
  const [swipeFeedback, setSwipeFeedback] = useState<SwipeAction | null>(null);
  const [showReviewMode, setShowReviewMode] = useState(false);
  const { showTutorial, dismissTutorial } = useSwipeTutorial();

  const [lastUndo, setLastUndo] = useState<{
    songId: string;
    prevSwipes: SongSwipe[];
  } | null>(null);

  const [tasteRevealShown, setTasteRevealShown] = useState(false);
  const [showTasteReveal, setShowTasteReveal] = useState(false);

  const tasteInsight = useMemo<TasteInsight | null>(
    () => buildTasteInsight(swipes, songMap),
    [swipes, songMap],
  );

  useEffect(() => {
    if (tasteRevealShown) return;
    if (swipes.length >= TASTE_REVEAL_AT && tasteInsight) {
      setShowTasteReveal(true);
      setTasteRevealShown(true);
    }
  }, [swipes.length, tasteInsight, tasteRevealShown]);

  const likeCount = swipes.filter((s) => s.action === "like" || s.action === "super_like").length;
  const superLikeCount = swipes.filter((s) => s.action === "super_like").length;
  const unsureCount = swipes.filter((s) => s.action === "unsure").length;
  const totalActive = allActive.length;
  const progress = totalActive > 0 ? swipes.length / totalActive : 0;
  const currentSong = availableSongs[0];
  const isDone = !currentSong;
  const remainingCount = availableSongs.length;
  const canContinueEarly = swipes.length >= MIN_SWIPES && !isDone;
  const likedSongs = useMemo(
    () =>
      swipes
        .filter((swipe) => swipe.action === "super_like" || swipe.action === "like")
        .sort((a, b) => (a.action === "super_like" ? -1 : 1) - (b.action === "super_like" ? -1 : 1))
        .map((swipe) => {
          const song = songMap.get(swipe.songId);
          if (!song) return null;
          return { ...song, swipeAction: swipe.action };
        })
        .filter(Boolean) as Array<Song & { swipeAction: SwipeAction }>,
    [songMap, swipes]
  );
  const djProfileUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    const djSlug = (() => { try { return window.sessionStorage.getItem("compakt_dj_slug")?.trim() || ""; } catch { return ""; } })();
    return djSlug ? `${getSafeOrigin()}/dj/${djSlug}` : "";
  }, []);
  const progressLabel = isDone
    ? "כבר יש לנו כיוון טוב"
    : remainingCount > 0
      ? `עוד ${remainingCount} שירים`
      : "כמעט סיימנו";
  const feedbackCopy: Record<SwipeAction, { label: string; style: CSSProperties }> = {
    like: {
      label: "נשמר לבחירה שלכם",
      style: { color: "var(--accent-secondary)", borderColor: "rgba(3,178,140,0.35)", background: "rgba(3,178,140,0.12)" },
    },
    dislike: {
      label: "ירד מהרשימה",
      style: { color: "var(--accent-danger)", borderColor: "rgba(255,68,102,0.35)", background: "rgba(255,68,102,0.12)" },
    },
    super_like: {
      label: "סומן כשיר חובה",
      style: { color: "var(--accent-gold)", borderColor: "rgba(245,197,66,0.35)", background: "rgba(245,197,66,0.12)" },
    },
    unsure: {
      label: "נשמר לעוד רגע",
      style: { color: "var(--accent-primary)", borderColor: "rgba(5,156,192,0.35)", background: "rgba(5,156,192,0.12)" },
    },
  };
  const categoryLabels = useMemo(
    () => ({
      ceremony: {
        label: songCategoryLabels?.ceremony || DEFAULT_SONG_CATEGORY_LABELS.ceremony,
        color: SONG_CATEGORY_COLORS.ceremony,
      },
      dancing: {
        label: songCategoryLabels?.dancing || DEFAULT_SONG_CATEGORY_LABELS.dancing,
        color: SONG_CATEGORY_COLORS.dancing,
      },
      food: {
        label: songCategoryLabels?.food || DEFAULT_SONG_CATEGORY_LABELS.food,
        color: SONG_CATEGORY_COLORS.food,
      },
      reception: {
        label: songCategoryLabels?.reception || DEFAULT_SONG_CATEGORY_LABELS.reception,
        color: SONG_CATEGORY_COLORS.reception,
      },
    }),
    [songCategoryLabels]
  );

  const handleSwipe = useCallback(
    (songId: string, action: SwipeAction) => {
      setLastSwipedSongId(songId);
      setLastAction(action);
      setSwipeFeedback(action);

      if (action === "dislike") {
        setShowReasons(true);
        saveSwipe(songId, action, []);
      } else if (action === "like") {
        saveSwipe(songId, action, []);
        setShowReasons(false);
      } else if (action === "super_like") {
        saveSwipe(songId, action, []);
        setShowReasons(false);
        setShowSuperBurst(true);
        setTimeout(() => setShowSuperBurst(false), 1200);
      } else {
        saveSwipe(songId, action, []);
        setShowReasons(false);
      }

      setLastUndo({ songId, prevSwipes: swipes });
      setIsPlaying(false);
      trackEvent("song_swipe", { songId, action });

      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate(action === "super_like" ? [30, 50, 30] : 15);
      }
    },
    [saveSwipe, trackEvent, swipes]
  );

  const handleUndo = useCallback(() => {
    if (!lastUndo) return;
    setSwipes(lastUndo.prevSwipes);
    setShowReasons(false);
    setLastSwipedSongId(null);
    setLastAction(null);
    setIsPlaying(false);
    trackEvent("song_undo", { songId: lastUndo.songId });
    setLastUndo(null);
  }, [lastUndo, setSwipes, trackEvent]);

  // Keyboard shortcuts
  useEffect(() => {
    if (isDone) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showReasons) {
        setShowReasons(false);
        setLastSwipedSongId(null);
        return;
      }
      if (showReasons) return;
      switch (e.key) {
        case "ArrowRight":
          handleSwipe(currentSong.id, "like");
          break;
        case "ArrowLeft":
          handleSwipe(currentSong.id, "dislike");
          break;
        case "ArrowUp":
          handleSwipe(currentSong.id, "super_like");
          break;
        case "ArrowDown":
        case " ":
          e.preventDefault();
          handleSwipe(currentSong.id, "unsure");
          break;
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isDone, currentSong, handleSwipe, showReasons]);

  const handleReasonChip = useCallback(
    (chip: string) => {
      if (!lastSwipedSongId) return;
      const existing = swipes.find((s) => s.songId === lastSwipedSongId);
      if (existing) {
        const chips = existing.reasonChips.includes(chip)
          ? existing.reasonChips.filter((c) => c !== chip)
          : [...existing.reasonChips, chip];
        saveSwipe(lastSwipedSongId, existing.action, chips);
      }
    },
    [lastSwipedSongId, swipes, saveSwipe]
  );

  const dismissReasons = useCallback(() => {
    setShowReasons(false);
    setLastSwipedSongId(null);
  }, []);

  useEffect(() => {
    if (!swipeFeedback) return;
    const timeout = window.setTimeout(() => setSwipeFeedback(null), 1100);
    return () => window.clearTimeout(timeout);
  }, [swipeFeedback]);

  const handleFinish = () => {
    trackEvent("stage_complete", { stage: 2 });
    setStage(3);
  };

  const handleOpenReviewMode = useCallback(() => {
    setShowReviewMode(true);
    setIsPlaying(false);
  }, []);

  const handleCloseReviewMode = useCallback(() => {
    setShowReviewMode(false);
    setIsPlaying(false);
  }, []);

  if (totalActive === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-8 text-center max-w-md mx-auto"
      >
        <div
          className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, rgba(5,156,192,0.18), rgba(3,178,140,0.18))" }}
        >
          <Music2 className="w-8 h-8 text-brand-blue" />
        </div>
        <h2 className="text-2xl font-bold mb-2">עוד אין שירים כאן</h2>
        <p className="text-sm text-secondary mb-2">
          הדיג׳יי עוד לא הוסיף שירים לבחירה.
        </p>
        <p className="text-xs text-muted">
          אפשר לחזור מאוחר יותר מאותו לינק.
        </p>
      </motion.div>
    );
  }

  if (isDone) {
    if (showReviewMode && likedSongs.length > 0) {
      return (
        <SongTinderReview
          songs={likedSongs}
          categoryLabels={categoryLabels}
          onBack={handleCloseReviewMode}
          onFinish={handleFinish}
        />
      );
    }

    return (
      <SongTinderCompletion
        likeCount={likeCount}
        superLikeCount={superLikeCount}
        unsureCount={unsureCount}
        swipeCount={swipes.length}
        likedSongs={likedSongs}
        djProfileUrl={djProfileUrl}
        tasteInsight={tasteInsight}
        eventNumber={event?.eventNumber}
        onReview={handleOpenReviewMode}
        onFinish={handleFinish}
      />
    );
  }

  return (
    <div className="relative isolate mx-auto flex h-[calc(100dvh-6.9rem)] w-full max-w-md flex-col overflow-hidden px-1 pb-1 sm:h-[calc(100dvh-8rem)] sm:px-0">
      {/* Swipe Tutorial */}
      <AnimatePresence>
        {showTutorial && <SwipeTutorial onDismiss={dismissTutorial} />}
      </AnimatePresence>

      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div
          className="absolute right-[-4rem] top-6 h-64 w-64 rounded-full blur-3xl opacity-70"
          style={{ background: "radial-gradient(circle, rgba(5,156,192,0.24), rgba(5,156,192,0.08) 56%, transparent 78%)" }}
        />
        <div
          className="absolute left-[-4rem] top-28 h-64 w-64 rounded-full blur-3xl opacity-70"
          style={{ background: "radial-gradient(circle, rgba(3,178,140,0.24), rgba(3,178,140,0.08) 56%, transparent 76%)" }}
        />
        <div
          className="absolute inset-x-16 top-10 h-32 rounded-full blur-3xl opacity-60"
          style={{ background: "rgba(245,197,66,0.12)" }}
        />
      </div>

      <SongTinderHeader
        swipeCount={swipes.length}
        totalActive={totalActive}
        progress={progress}
        progressLabel={progressLabel}
        canUndo={Boolean(lastUndo)}
        onUndo={handleUndo}
        likeCount={likeCount}
        superLikeCount={superLikeCount}
        unsureCount={unsureCount}
        canContinueEarly={canContinueEarly}
        onFinish={handleFinish}
      />

      {/* Super Like Burst */}
      <AnimatePresence>
        {showSuperBurst && (
          <motion.div
            initial={{ scale: 0.5, opacity: 1 }}
            animate={{ scale: 3, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          >
            <div className="text-7xl">⭐</div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {swipeFeedback && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full border text-sm font-medium backdrop-blur-sm"
            style={feedbackCopy[swipeFeedback].style}
          >
            {feedbackCopy[swipeFeedback].label}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showTasteReveal && tasteInsight && (
          <TasteInsightReveal
            insight={tasteInsight}
            onDismiss={() => setShowTasteReveal(false)}
          />
        )}
      </AnimatePresence>

      <div className="relative flex-1 min-h-0 w-full pt-1">
        <div className="absolute inset-x-1 top-2 bottom-24 rounded-[34px] border border-white/10 bg-[linear-gradient(180deg,rgba(14,16,24,0.82),rgba(8,10,14,0.92))] shadow-[0_28px_70px_rgba(0,0,0,0.3)] backdrop-blur-xl" />
        {availableSongs[2] && (
          <motion.div
            className="absolute inset-x-7 top-10 bottom-32 overflow-hidden rounded-[28px] border border-white/[0.03] bg-[linear-gradient(180deg,rgba(18,20,28,0.28),rgba(9,10,16,0.18))]"
            style={{ scale: 0.94, opacity: 0.12, y: 10 }}
          >
            <SongCardStatic song={availableSongs[2]} categoryLabels={categoryLabels} />
          </motion.div>
        )}
        {availableSongs[1] && (
          <motion.div
            className="absolute inset-x-4 top-6 bottom-28 overflow-hidden rounded-[30px] border border-white/[0.05] bg-[linear-gradient(180deg,rgba(24,28,38,0.34),rgba(9,10,16,0.24))]"
            initial={false}
            animate={{ scale: 0.97, opacity: 0.22, y: 6 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <SongCardStatic song={availableSongs[1]} categoryLabels={categoryLabels} />
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          <SwipeCard
            key={currentSong.id}
            song={currentSong}
            categoryLabels={categoryLabels}
            onSwipe={handleSwipe}
            isPlaying={isPlaying}
            onTogglePlay={() => setIsPlaying((value) => !value)}
          />
        </AnimatePresence>
      </div>

      <div className="mt-2">
        <SongSwipeActions
          onSwipe={handleSwipe}
          currentSongId={currentSong.id}
        />
      </div>

      <div className="mt-1 flex items-center justify-center">
        <span className="text-[10px] text-white/30">החליקו או לחצו</span>
      </div>

      {/* Reason Chips Overlay */}
      <AnimatePresence>
        {showReasons && lastAction === "dislike" && (
          <DislikeReasonTray
            lastSwipedSongId={lastSwipedSongId}
            swipes={swipes}
            onSelectChip={handleReasonChip}
            onClose={dismissReasons}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function TasteInsightReveal({
  insight,
  onDismiss,
}: {
  insight: TasteInsight;
  onDismiss: () => void;
}) {
  useEffect(() => {
    const timeout = window.setTimeout(onDismiss, 6000);
    return () => window.clearTimeout(timeout);
  }, [onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92, y: 24 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: -16 }}
      transition={{ type: "spring", stiffness: 340, damping: 28 }}
      onClick={onDismiss}
      className="fixed inset-x-4 top-36 z-50 mx-auto max-w-md cursor-pointer"
    >
      <div className="overflow-hidden rounded-[28px] border border-white/12 bg-[linear-gradient(135deg,rgba(14,18,28,0.96),rgba(8,10,16,0.96))] p-4 shadow-[0_24px_64px_rgba(0,0,0,0.4)] backdrop-blur-2xl">
        <div className="flex items-start gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
            style={{ background: "linear-gradient(135deg, rgba(245,197,66,0.2), rgba(5,156,192,0.2))" }}
          >
            <Sparkles className="h-5 w-5" style={{ color: "var(--accent-gold)" }} />
          </div>
          <div className="min-w-0 flex-1 text-right">
            <p className="text-[10px] tracking-[0.2em] text-muted">הכיוון המוזיקלי שלכם מתגבש</p>
            <p className="mt-1 text-[15px] font-bold leading-snug">{insight.headline}</p>
            <div className="mt-2.5 flex flex-wrap justify-end gap-1.5">
              {insight.traits.map((trait) => (
                <span
                  key={trait}
                  className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-[11px] text-secondary"
                >
                  {trait}
                </span>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-end gap-2">
              <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/8">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: "linear-gradient(90deg, rgba(245,197,66,0.9), rgba(5,156,192,0.9))" }}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.round(insight.confidence * 100)}%` }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                />
              </div>
              <span className="text-[10px] text-muted">{Math.round(insight.confidence * 100)}% ביטחון</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function SongTinderHeader({
  swipeCount,
  totalActive,
  progress,
  progressLabel,
  canUndo,
  onUndo,
  likeCount,
  superLikeCount,
  unsureCount,
  canContinueEarly,
  onFinish,
}: {
  swipeCount: number;
  totalActive: number;
  progress: number;
  progressLabel: string;
  canUndo: boolean;
  onUndo: () => void;
  likeCount: number;
  superLikeCount: number;
  unsureCount: number;
  canContinueEarly: boolean;
  onFinish: () => void;
}) {
  return (
    <div className="mb-3 rounded-[28px] border border-white/10 bg-[rgba(10,14,20,0.66)] p-3 shadow-[0_16px_40px_rgba(0,0,0,0.2)] backdrop-blur-xl">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] tracking-[0.22em] text-muted">בחירת המוזיקה</p>
            <p className="text-[11px] text-secondary">{swipeCount}/{totalActive}</p>
          </div>
          <h2 className="mt-1 text-[22px] font-black leading-tight tracking-[-0.04em]">מה נשמע נכון לערב שלכם</h2>
          <p className="mt-1 text-[12px] text-secondary">{progressLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.06]">
            <span className="text-sm font-black tabular-nums">{Math.round(progress * 100)}%</span>
          </div>
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={`flex h-11 w-11 items-center justify-center rounded-full border transition-all ${canUndo
              ? "border-white/10 bg-white/[0.04] text-secondary hover:border-white/20 hover:text-white"
              : "cursor-not-allowed border-white/5 bg-white/[0.02] text-white/25 opacity-50"
              }`}
            aria-label="בטל פעולה אחרונה"
            title="בטל"
          >
            <Undo2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/8">
        <motion.div
          className="h-full rounded-full"
          style={{ background: "linear-gradient(90deg, rgba(245,197,66,0.95), rgba(5,156,192,0.92), rgba(3,178,140,0.92))" }}
          initial={false}
          animate={{ width: `${progress * 100}%` }}
          transition={{ type: "spring", stiffness: 280, damping: 28 }}
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <span className="rounded-full border border-brand-green/25 bg-brand-green/10 px-2.5 py-1 text-[11px] text-brand-green">
          {likeCount} נשמרו
        </span>
        <span
          className="rounded-full border px-2.5 py-1 text-[11px]"
          style={{ color: "var(--accent-gold)", borderColor: "rgba(245,197,66,0.25)", background: "rgba(245,197,66,0.1)" }}
        >
          {superLikeCount} חובה
        </span>
        <span className="rounded-full border border-brand-blue/25 bg-brand-blue/10 px-2.5 py-1 text-[11px] text-brand-blue">
          {unsureCount} לעוד רגע
        </span>
        {canContinueEarly && (
          <button
            onClick={onFinish}
            className="flex items-center gap-1 rounded-full border border-brand-blue/30 bg-brand-blue/10 px-3 py-1 text-[11px] font-semibold text-brand-blue transition-colors hover:bg-brand-blue/15"
          >
            <SkipForward className="h-3.5 w-3.5" />
            המשך עם הכיוון הזה
          </button>
        )}
      </div>
    </div>
  );
}

function SongSwipeActions({
  currentSongId,
  onSwipe,
}: {
  currentSongId: string;
  onSwipe: (songId: string, action: SwipeAction) => void;
}) {
  return (
    <div className="z-20 flex-shrink-0 pb-[max(env(safe-area-inset-bottom),0.35rem)]">
      <div className="flex items-end justify-center gap-5 px-4 py-1">
        <DecisionDockButton
          label="נרצה"
          icon={<Heart className="w-5 h-5" fill="currentColor" />}
          tone="success"
          onClick={() => onSwipe(currentSongId, "like")}
        />
        <DecisionDockButton
          label="שיר חובה"
          icon={<Star className="w-6 h-6" fill="currentColor" />}
          tone="gold"
          isPrimary
          onClick={() => onSwipe(currentSongId, "super_like")}
        />
        <DecisionDockButton
          label="לא לכיוון"
          icon={<X className="w-5 h-5" strokeWidth={2.6} />}
          tone="danger"
          onClick={() => onSwipe(currentSongId, "dislike")}
        />
      </div>
    </div>
  );
}

function DislikeReasonTray({
  lastSwipedSongId,
  swipes,
  onSelectChip,
  onClose,
}: {
  lastSwipedSongId: string | null;
  swipes: SongSwipe[];
  onSelectChip: (chip: string) => void;
  onClose: () => void;
}) {
  const swipe = swipes.find((item) => item.songId === lastSwipedSongId);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 24 }}
      className="absolute inset-x-0 bottom-0 z-20"
    >
      <div className="rounded-t-[28px] border border-white/10 border-b-0 bg-[linear-gradient(180deg,rgba(16,20,28,0.96),rgba(9,10,16,0.96))] p-4 shadow-[0_-18px_48px_rgba(0,0,0,0.3)] backdrop-blur-2xl">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium">מה הרחיק אתכם מהשיר הזה?</p>
            <p className="text-xs text-muted">אופציונלי לגמרי, אבל זה יעזור לנו לדייק את הקו המוזיקלי שלכם</p>
          </div>
          <button onClick={onClose} className="text-xs text-muted transition-colors hover:text-foreground">
            דלג
          </button>
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          {reasonChips.map((chip) => {
            const isActive = swipe?.reasonChips.includes(chip);
            return (
              <motion.button
                key={chip}
                whileTap={{ scale: 0.92 }}
                onClick={() => onSelectChip(chip)}
                className={`rounded-full border px-3 py-2 text-xs transition-all ${isActive ? "border-brand-blue/30 bg-brand-blue/12 text-white" : "border-white/10 bg-white/[0.03] text-secondary"}`}
              >
                {chip}
              </motion.button>
            );
          })}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button onClick={onClose} className="btn-secondary w-full py-3 text-sm">
            דלג והמשך
          </button>
          <button onClick={onClose} className="btn-primary w-full py-3 text-sm">
            שמור והמשך
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function SongTinderCompletion({
  likeCount,
  superLikeCount,
  unsureCount,
  swipeCount,
  likedSongs,
  djProfileUrl,
  tasteInsight,
  eventNumber,
  onReview,
  onFinish,
}: {
  likeCount: number;
  superLikeCount: number;
  unsureCount: number;
  swipeCount: number;
  likedSongs: Array<Song & { swipeAction: SwipeAction }>;
  djProfileUrl: string;
  tasteInsight: TasteInsight | null;
  eventNumber?: string;
  onReview: () => void;
  onFinish: () => void;
}) {
  const [showLikedSongs, setShowLikedSongs] = useState(false);
  const [shareDone, setShareDone] = useState(false);
  const [activeLikedSongId, setActiveLikedSongId] = useState<string | null>(null);

  const handleShare = async () => {
    if (!djProfileUrl) return;

    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({
          title: "Compakt",
          text: "קבלו את הפרופיל של הדיג׳יי שלנו",
          url: djProfileUrl,
        });
      } else {
        const copied = await safeCopyText(djProfileUrl);
        if (!copied) return;
      }

      setShareDone(true);
      window.setTimeout(() => setShareDone(false), 2000);
    } catch {
      const copied = await safeCopyText(djProfileUrl);
      if (copied) {
        setShareDone(true);
        window.setTimeout(() => setShareDone(false), 2000);
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative mx-auto max-w-md overflow-hidden"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72">
        <div
          className="absolute left-[-4rem] top-8 h-56 w-56 rounded-full blur-3xl opacity-80"
          style={{ background: "rgba(3,178,140,0.18)" }}
        />
        <div
          className="absolute right-[-3rem] top-0 h-56 w-56 rounded-full blur-3xl opacity-75"
          style={{ background: "rgba(5,156,192,0.2)" }}
        />
      </div>

      <div className="relative overflow-hidden rounded-[34px] border border-white/10 bg-[linear-gradient(180deg,rgba(18,22,31,0.9),rgba(9,10,16,0.88))] p-5 shadow-[0_28px_80px_rgba(0,0,0,0.3)] backdrop-blur-2xl sm:p-6">
        <div className="relative mb-5 overflow-hidden rounded-[30px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(245,197,66,0.14),transparent_42%),radial-gradient(circle_at_bottom_left,rgba(3,178,140,0.16),transparent_52%),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] px-5 py-6">
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] shadow-[0_18px_44px_rgba(0,0,0,0.24)]"
          >
            <Headphones className="h-7 w-7 text-white" />
          </motion.div>
          <p className="text-[11px] tracking-[0.24em] text-muted">הבחירה הושלמה</p>
          <h2 className="mt-2 text-[30px] font-black leading-[1.02] tracking-[-0.05em]">
            כבר יש לנו
            <br />
            כיוון מוזיקלי
          </h2>
          <p className="mx-auto mt-3 max-w-[28ch] text-sm leading-6 text-secondary">
            {likedSongs.length > 0
              ? "הבחירות שלכם כבר נותנות תמונה ברורה. אפשר להשמיע שוב, לשתף, או להמשיך."
              : "כבר נבנה כיוון מוזיקלי ראשוני. אפשר לשתף, להמשיך, או לחזור לבחירות."}
          </p>
          {eventNumber && (
            <p className="mt-2 text-[11px] font-mono text-brand-blue/70" dir="ltr">
              אירוע #{eventNumber}
            </p>
          )}
        </div>

        {tasteInsight && (
          <div className="mb-4 rounded-[24px] border border-white/10 bg-[linear-gradient(135deg,rgba(245,197,66,0.06),rgba(5,156,192,0.06))] p-4 text-right">
            <div className="flex items-center justify-end gap-2 mb-2">
              <p className="text-[11px] tracking-[0.18em] text-muted">הכיוון המוזיקלי שלכם</p>
              <Sparkles className="h-3.5 w-3.5" style={{ color: "var(--accent-gold)" }} />
            </div>
            <p className="text-[15px] font-bold leading-snug">{tasteInsight.headline}</p>
            <div className="mt-2.5 flex flex-wrap justify-end gap-1.5">
              {tasteInsight.traits.map((trait) => (
                <span
                  key={trait}
                  className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-[11px] text-secondary"
                >
                  {trait}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="mb-4 grid grid-cols-3 gap-2">
          <CompletionMetric
            icon={<Heart className="w-4 h-4 text-brand-green" fill="var(--accent-secondary)" />}
            value={likeCount}
            label="נשמרו"
            tone="green"
          />
          <CompletionMetric
            icon={<Star className="w-4 h-4" style={{ color: "var(--accent-gold)" }} fill="var(--accent-gold)" />}
            value={superLikeCount}
            label="חובה"
            tone="gold"
          />
          <CompletionMetric
            icon={<HelpCircle className="w-4 h-4 text-brand-blue" />}
            value={unsureCount}
            label="לעוד רגע"
            tone="blue"
          />
        </div>

        <div className="mb-4 flex items-center justify-between gap-4 rounded-[24px] border border-white/10 bg-white/[0.04] px-4 py-3 text-right">
          <div>
            <p className="text-sm font-semibold">{swipeCount} שירים מאחוריכם</p>
            <p className="mt-1 text-xs text-muted">
              {likedSongs.length > 0
                ? "רוצים לדייק? חזרו לשירים שבחרתם והשמיעו שוב."
                : "עוד לא שמרתם שירים, וזה בסדר גמור. אפשר להמשיך או לחזור לבחירות."}
            </p>
          </div>
          <div className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[11px] text-secondary">
            {likedSongs.length > 0 ? `${likedSongs.length} נבחרו` : "עוד בלי בחירות"}
          </div>
        </div>

        <button
          onClick={onReview}
          disabled={likedSongs.length === 0}
          className="mb-3 flex w-full items-center justify-center gap-2 rounded-[24px] px-4 py-4 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-60"
          style={{
            background: "linear-gradient(180deg, rgba(255,255,255,0.12), rgba(255,255,255,0.04))",
            border: "1px solid rgba(255,255,255,0.12)",
            boxShadow: "0 18px 42px rgba(0,0,0,0.18)",
          }}
        >
          <Headphones className="w-4 h-4" />
          {likedSongs.length > 0 ? "השמיעו שוב את הבחירות" : "עוד אין שירים להשמעה"}
        </button>

        <div className={`mb-4 grid gap-2 ${likedSongs.length > 0 ? "grid-cols-2" : "grid-cols-1"}`}>
          {likedSongs.length > 0 ? (
            <button onClick={() => setShowLikedSongs((value) => !value)} className="btn-secondary w-full py-3 text-sm">
              {showLikedSongs ? "סגירה" : "הרשימה שלכם"}
            </button>
          ) : null}
          <button
            onClick={handleShare}
            disabled={!djProfileUrl}
            className="btn-secondary flex w-full items-center justify-center gap-2 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
          >
            {shareDone ? <Check className="w-4 h-4" /> : djProfileUrl ? <Share2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {shareDone ? "נשלח" : "שתפו את הפרופיל"}
          </button>
        </div>

        <AnimatePresence initial={false}>
          {showLikedSongs && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: 8 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: 8 }}
              className="overflow-hidden"
            >
              <div className="mb-4 rounded-[26px] border border-white/10 bg-black/15 p-3 text-right">
                <p className="mb-3 text-sm font-medium">השירים שסימנתם לבחירה</p>
                {likedSongs.length > 0 ? (
                  <div className="max-h-72 space-y-2.5 overflow-y-auto pr-1">
                    {likedSongs.map((song) => (
                      <div key={`${song.id}-${song.swipeAction}`} className="flex items-center gap-3 rounded-[22px] border border-white/8 bg-white/[0.03] px-3 py-2.5">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={song.coverUrl} alt={song.title} className="h-12 w-12 flex-shrink-0 rounded-2xl object-cover" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{song.title}</p>
                          <p className="truncate text-xs text-muted">{song.artist}</p>
                        </div>
                        <div className="flex flex-shrink-0 items-center gap-2">
                          {song.swipeAction === "super_like" ? (
                            <span className="rounded-full border px-2 py-1 text-[11px]" style={{ color: "var(--accent-gold)", borderColor: "rgba(245,197,66,0.25)", background: "rgba(245,197,66,0.1)" }}>
                              חובה
                            </span>
                          ) : (
                            <span className="rounded-full border border-brand-green/25 bg-brand-green/10 px-2 py-1 text-[11px] text-brand-green">
                              לבחירה
                            </span>
                          )}
                          {(song.previewUrl || song.externalLink) ? (
                            <button
                              onClick={() => setActiveLikedSongId((current) => current === song.id ? null : song.id)}
                              className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-secondary transition-colors hover:border-brand-blue hover:text-brand-blue"
                            >
                              {activeLikedSongId === song.id ? "סגרו נגן" : "השמיעו"}
                            </button>
                          ) : null}
                        </div>
                      </div>
                    ))}
                    {activeLikedSongId ? (
                      <div className="pt-2">
                        {(() => {
                          const activeSong = likedSongs.find((song) => song.id === activeLikedSongId);
                          const media = activeSong ? resolveSongMedia(activeSong.previewUrl, activeSong.externalLink) : null;

                          if (!activeSong || !media) return null;

                          if (media.type === "audio_file" && media.inlineUrl) {
                            return (
                              <audio
                                key={activeSong.id}
                                src={media.inlineUrl}
                                controls
                                autoPlay
                                className="w-full"
                              />
                            );
                          }

                          if (media.youtubeId) {
                            return (
                              <div className="overflow-hidden rounded-xl">
                                <iframe
                                  width="100%"
                                  height="96"
                                  src={`https://www.youtube.com/embed/${media.youtubeId}?autoplay=1&controls=1`}
                                  allow="autoplay; encrypted-media"
                                  className="rounded-xl"
                                  title={`${activeSong.title} preview`}
                                />
                              </div>
                            );
                          }

                          if (media.externalUrl) {
                            return (
                              <a
                                href={media.externalUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-black/10 py-2.5 text-xs text-secondary transition-all hover:border-brand-blue hover:text-brand-blue"
                                dir="ltr"
                              >
                                פתחו לינק לשיר
                              </a>
                            );
                          }

                          return null;
                        })()}
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <p className="text-center text-xs text-muted">עדיין אין כאן שירים שסומנו לבחירה.</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button onClick={onFinish} className="btn-primary w-full py-3.5 text-base">
          המשיכו לבקשות
        </button>
      </div>
    </motion.div>
  );
}

function SongTinderReview({
  songs,
  categoryLabels,
  onBack,
  onFinish,
}: {
  songs: Array<Song & { swipeAction: SwipeAction }>;
  categoryLabels: Record<string, { label: string; color: string }>;
  onBack: () => void;
  onFinish: () => void;
}) {
  const saveSwipe = useEventStore((s) => s.saveSwipe);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (songs.length === 0) return;
    setCurrentIndex((value) => Math.min(value, songs.length - 1));
  }, [songs.length]);

  const currentSong = songs[currentIndex];
  const media = currentSong ? resolveSongMedia(currentSong.previewUrl, currentSong.externalLink) : null;
  const canPlayInline = Boolean(media?.type === "audio_file" && media.inlineUrl);

  useEffect(() => {
    setIsPlaying(false);
  }, [currentIndex]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !canPlayInline) return;

    if (isPlaying) {
      void audio.play().catch(() => setIsPlaying(false));
      return;
    }

    audio.pause();
  }, [canPlayInline, isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    return () => {
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    };
  }, []);

  if (!currentSong) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 sm:p-7 text-center max-w-md mx-auto"
      >
        <p className="text-sm text-secondary mb-4">אין כרגע שירים לחזור אליהם.</p>
        <button onClick={onBack} className="btn-secondary w-full text-sm py-3">
          חזרו לסיכום
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative mx-auto w-full max-w-md space-y-2.5"
    >
      <div className="flex items-center justify-between gap-3 rounded-[24px] border border-white/10 bg-[rgba(12,16,22,0.72)] px-4 py-3 backdrop-blur-xl">
        <button onClick={onBack} className="text-sm text-secondary transition-colors hover:text-foreground">
          חזרו לסיכום
        </button>
        <div className="min-w-0 text-center">
          <p className="text-[11px] tracking-[0.2em] text-muted">השמעה חוזרת</p>
          <p className="text-xs text-secondary">שיר {currentIndex + 1} מתוך {songs.length}</p>
        </div>
        <div className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] text-secondary">
          {currentIndex + 1}/{songs.length}
        </div>
      </div>

      <div className="relative overflow-hidden rounded-[32px] border border-white/8 bg-[linear-gradient(180deg,rgba(20,24,34,0.88),rgba(9,10,16,0.88))] shadow-[0_20px_56px_rgba(0,0,0,0.22)] backdrop-blur-2xl">
        <SongCardStatic song={currentSong} categoryLabels={categoryLabels} />

        <div className="space-y-3 px-4 pb-4">
          <div className="flex items-center justify-center">
            {currentSong.swipeAction === "super_like" ? (
              <span
                className="text-[11px] px-2 py-1 rounded-full border"
                style={{ color: "var(--accent-gold)", borderColor: "rgba(245,197,66,0.25)", background: "rgba(245,197,66,0.1)" }}
              >
                חובה
              </span>
            ) : (
              <span className="text-[11px] px-2 py-1 rounded-full border border-brand-green/25 bg-brand-green/10 text-brand-green">
                לבחירה
              </span>
            )}
          </div>

          {canPlayInline && media?.inlineUrl ? (
            <div className="rounded-[22px] border border-white/10 bg-black/15 p-3">
              <audio
                ref={audioRef}
                key={currentSong.id}
                src={media.inlineUrl}
                onEnded={() => setIsPlaying(false)}
                className="hidden"
              />
              <button
                onClick={() => setIsPlaying((value) => !value)}
                className="flex w-full items-center justify-between rounded-[18px] border border-white/10 bg-white/[0.03] px-4 py-3 text-sm transition-colors hover:bg-white/[0.05]"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{isPlaying ? "מנגן עכשיו" : "השמיעו שוב"}</p>
                    <p className="text-[11px] text-muted">טעימה קצרה כדי להיזכר בתחושה</p>
                  </div>
                </div>
                <span className="text-[11px] text-secondary">preview</span>
              </button>
            </div>
          ) : media?.externalUrl ? (
            <a
              href={media.externalUrl}
              target="_blank"
              rel="noreferrer"
              className="w-full flex items-center justify-center gap-2 rounded-[18px] border border-white/10 bg-black/15 py-3 text-sm text-secondary transition-all hover:border-brand-blue hover:text-brand-blue"
              dir="ltr"
            >
              פתחו את השיר
            </a>
          ) : (
            <div className="rounded-[18px] border border-white/10 bg-black/15 px-4 py-3 text-center text-xs text-muted">
              אין preview זמין לשיר הזה
            </div>
          )}

          <div className="flex items-end justify-center gap-5 py-2">
            <DecisionDockButton
              label="נרצה"
              icon={<Heart className="w-5 h-5" fill="currentColor" />}
              tone="success"
              isActive={currentSong.swipeAction === "like"}
              onClick={() => saveSwipe(currentSong.id, "like", [])}
            />
            <DecisionDockButton
              label="שיר חובה"
              icon={<Star className="w-6 h-6" fill="currentColor" />}
              tone="gold"
              isPrimary
              isActive={currentSong.swipeAction === "super_like"}
              onClick={() => saveSwipe(currentSong.id, "super_like", [])}
            />
            <DecisionDockButton
              label="לא לכיוון"
              icon={<X className="w-5 h-5" strokeWidth={2.6} />}
              tone="danger"
              isActive={currentSong.swipeAction === "dislike"}
              onClick={() => saveSwipe(currentSong.id, "dislike", [])}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setCurrentIndex((value) => Math.max(0, value - 1))}
              disabled={currentIndex === 0}
              className="w-full rounded-[16px] border border-white/10 bg-black/15 py-3 text-sm text-secondary transition-colors hover:bg-white/[0.03] hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
              הקודם
            </button>
            <button
              onClick={() => setCurrentIndex((value) => Math.min(songs.length - 1, value + 1))}
              disabled={currentIndex === songs.length - 1}
              className="w-full rounded-[16px] border border-white/10 bg-black/15 py-3 text-sm text-secondary transition-colors hover:bg-white/[0.03] hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
              הבא
            </button>
          </div>
        </div>
      </div>

      <button onClick={onFinish} className="btn-primary w-full text-base py-3.5">
        המשיכו לבקשות
      </button>
    </motion.div>
  );
}

function CompletionMetric({
  icon,
  value,
  label,
  tone,
}: {
  icon: JSX.Element;
  value: number;
  label: string;
  tone: "green" | "gold" | "blue";
}) {
  return (
    <div
      className="rounded-[22px] border p-2.5 backdrop-blur-sm"
      style={
        tone === "green"
          ? { borderColor: "rgba(3,178,140,0.22)", background: "linear-gradient(180deg, rgba(3,178,140,0.16), rgba(3,178,140,0.06))" }
          : tone === "blue"
            ? { borderColor: "rgba(5,156,192,0.22)", background: "linear-gradient(180deg, rgba(5,156,192,0.16), rgba(5,156,192,0.06))" }
            : { borderColor: "rgba(245,197,66,0.25)", background: "linear-gradient(180deg, rgba(245,197,66,0.16), rgba(245,197,66,0.06))" }
      }
    >
      <div className="mb-1 flex items-center justify-center gap-1">
        {icon}
        <span
          className={`text-lg font-black ${tone === "green" ? "text-brand-green" : tone === "blue" ? "text-brand-blue" : ""}`}
          style={tone === "gold" ? { color: "var(--accent-gold)" } : undefined}
        >
          {value}
        </span>
      </div>
      <span className="text-[11px] text-muted">{label}</span>
    </div>
  );
}

function DecisionDockButton({
  label,
  icon,
  tone,
  isActive = false,
  isPrimary = false,
  onClick,
}: {
  label: string;
  icon: JSX.Element;
  tone: "danger" | "success" | "gold" | "blue";
  isActive?: boolean;
  isPrimary?: boolean;
  onClick: () => void;
}) {
  const palette =
    tone === "danger"
      ? {
        idle: "rgba(255,68,102,0.55)",
        active: "var(--accent-danger)",
        glow: "rgba(255,68,102,0.18)",
        ring: "rgba(255,68,102,0.25)",
      }
      : tone === "success"
        ? {
          idle: "rgba(3,178,140,0.55)",
          active: "var(--accent-secondary)",
          glow: "rgba(3,178,140,0.18)",
          ring: "rgba(3,178,140,0.25)",
        }
        : tone === "blue"
          ? {
            idle: "rgba(5,156,192,0.55)",
            active: "var(--accent-primary)",
            glow: "rgba(5,156,192,0.18)",
            ring: "rgba(5,156,192,0.25)",
          }
          : {
            idle: "rgba(245,197,66,0.6)",
            active: "var(--accent-gold)",
            glow: "rgba(245,197,66,0.22)",
            ring: "rgba(245,197,66,0.3)",
          };

  const size = isPrimary ? "h-16 w-16" : "h-[3.25rem] w-[3.25rem]";

  return (
    <motion.button
      whileTap={{ scale: 0.88 }}
      whileHover={{ scale: 1.08 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      onClick={onClick}
      className={`flex flex-col items-center gap-1.5 focus:outline-none`}
    >
      <div
        className={`${size} flex items-center justify-center rounded-full transition-colors duration-150`}
        style={{
          color: isActive ? palette.active : palette.idle,
          background: isActive ? palette.glow : "rgba(255,255,255,0.04)",
          boxShadow: isActive
            ? `0 0 24px ${palette.glow}, 0 4px 16px rgba(0,0,0,0.2)`
            : "0 4px 16px rgba(0,0,0,0.12)",
          border: `1.5px solid ${isActive ? palette.ring : "rgba(255,255,255,0.08)"}`,
        }}
      >
        {icon}
      </div>
      <span
        className="text-[10px] font-medium leading-none transition-colors duration-150"
        style={{ color: isActive ? palette.active : "rgba(255,255,255,0.45)" }}
      >
        {label}
      </span>
    </motion.button>
  );
}

function SongCardStatic({
  song,
  categoryLabels,
}: {
  song: Song;
  categoryLabels: Record<string, { label: string; color: string }>;
}) {
  const [imgError, setImgError] = useState(false);
  const cat = categoryLabels[song.category];
  const tags = [song.language, song.decade, ...song.tags].filter(Boolean).slice(0, 3);

  return (
    <div className="relative flex flex-col items-center justify-center overflow-hidden px-5 pt-7 pb-5">
      <div
        className="absolute inset-x-2 top-2 h-56 rounded-[34px] opacity-60"
        style={{
          background: imgError ? "linear-gradient(180deg, rgba(5,156,192,0.12), transparent)" : `linear-gradient(180deg, rgba(0,0,0,0.06), rgba(0,0,0,0.34)), url(${song.coverUrl}) center/cover`,
          filter: "blur(26px)",
          transform: "scale(1.08)",
        }}
      />
      <div
        className="absolute inset-x-8 top-10 h-48 rounded-full blur-3xl opacity-80"
        style={{ background: "radial-gradient(circle, rgba(3,178,140,0.2), rgba(5,156,192,0.08) 42%, transparent 72%)" }}
      />
      <div
        className="relative mb-6 flex h-60 w-60 items-center justify-center overflow-hidden rounded-[34px] shadow-[0_28px_80px_rgba(0,0,0,0.38)] ring-1 ring-white/10"
        style={{ background: "rgba(31,31,33,0.3)" }}
      >
        {!imgError ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={song.coverUrl}
              alt={`${song.title} - ${song.artist}`}
              className="absolute inset-0 h-full w-full scale-110 object-cover blur-2xl opacity-45"
              onError={() => setImgError(true)}
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={song.coverUrl}
              alt={`${song.title} - ${song.artist}`}
              className="relative z-10 h-full w-full object-cover"
              onError={() => setImgError(true)}
            />
          </>
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, rgba(5,156,192,0.25), rgba(3,178,140,0.18))" }}
          >
            <Music2 className="w-14 h-14 text-muted" />
          </div>
        )}
        <div
          className="absolute inset-x-0 bottom-0 h-24"
          style={{ background: "linear-gradient(180deg, rgba(0,0,0,0), rgba(0,0,0,0.45))" }}
        />
        {cat ? (
          <div
            className="absolute bottom-4 right-4 z-20 rounded-full border border-white/10 px-3 py-1 text-[10px] font-semibold backdrop-blur-md"
            style={{ background: cat.color, color: "var(--text-secondary)" }}
          >
            {cat.label}
          </div>
        ) : null}
      </div>
      <div className="relative z-10 space-y-1 text-center">
        <h3 className="text-[32px] font-black leading-tight tracking-[-0.04em]">{song.title}</h3>
        <p className="text-sm text-secondary">{song.artist}</p>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          {tags.map((tag) => (
            <span key={tag} className="rounded-full border border-white/10 bg-black/15 px-2.5 py-1 text-[10px] text-secondary">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function SwipeCard({
  song,
  categoryLabels,
  onSwipe,
  isPlaying,
  onTogglePlay,
}: {
  song: Song;
  categoryLabels: Record<string, { label: string; color: string }>;
  onSwipe: (songId: string, action: SwipeAction) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
}) {
  const [imgError, setImgError] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const previewTimeoutRef = useRef<number | null>(null);
  const progressId = `song-preview-${song.id}`;
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-300, 0, 300], [-18, 0, 18]);
  const likeOpacity = useTransform(x, [0, 80], [0, 1]);
  const dislikeOpacity = useTransform(x, [-80, 0], [1, 0]);
  const superLikeOpacity = useTransform(y, [-80, 0], [1, 0]);
  const cardScale = useTransform(
    x,
    [-200, 0, 200],
    [0.97, 1, 0.97]
  );

  const borderColor = useTransform(
    x,
    [-150, -50, 0, 50, 150],
    [
      "rgba(255,68,102,0.7)",
      "rgba(255,68,102,0.2)",
      "rgba(5,156,192,0.12)",
      "rgba(3,178,140,0.2)",
      "rgba(3,178,140,0.7)",
    ]
  );
  const boxShadowColor = useTransform(
    x,
    [-150, 0, 150],
    [
      "0 0 40px rgba(255,68,102,0.3)",
      "0 8px 32px rgba(0,0,0,0.4)",
      "0 0 40px rgba(3,178,140,0.3)",
    ]
  );

  const cat = categoryLabels[song.category];

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    const offsetX = info.offset.x;
    const offsetY = info.offset.y;
    const velocityX = info.velocity.x;
    const velocityY = info.velocity.y;

    // Swipe up for super like
    if (offsetY < -SWIPE_UP_THRESHOLD || velocityY < -500) {
      animate(y, -600, { type: "spring" });
      animate(x, 0, { type: "spring" });
      onSwipe(song.id, "super_like");
      return;
    }

    if (offsetX > SWIPE_THRESHOLD || velocityX > 500) {
      animate(x, 600, { type: "spring" });
      onSwipe(song.id, "like");
    } else if (offsetX < -SWIPE_THRESHOLD || velocityX < -500) {
      animate(x, -600, { type: "spring" });
      onSwipe(song.id, "dislike");
    } else {
      animate(x, 0, { type: "spring", stiffness: 500, damping: 30 });
      animate(y, 0, { type: "spring", stiffness: 500, damping: 30 });
    }
  };

  const media = resolveSongMedia(song.previewUrl, song.externalLink);
  const youtubeId = media.youtubeId;
  const hasAudioPreview = media.type === "audio_file" && Boolean(media.inlineUrl);
  const hasInlinePreview = media.canPlayInline;
  const hasExternalOnly = !media.canPlayInline && Boolean(media.externalUrl);
  const previewBadge = media.sourceLabel;
  const previewTone = hasAudioPreview
    ? "טעימה פנימית זמינה"
    : youtubeId
      ? "האזנה דרך YouTube"
      : hasExternalOnly
        ? "מעבר ללינק המקורי"
        : "אין כרגע preview";
  const infoChips = [song.language, song.decade, ...song.tags].filter(Boolean).slice(0, 2);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(30);
  const previewWindowSeconds = 30;
  const formatTime = (value: number) => {
    const safeValue = Number.isFinite(value) ? Math.max(0, value) : 0;
    const minutes = Math.floor(safeValue / 60);
    const seconds = Math.floor(safeValue % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !hasAudioPreview) return;

    if (isPlaying) {
      void audio.play().catch(() => {
        onTogglePlay();
      });
      return;
    }

    audio.pause();
  }, [hasAudioPreview, isPlaying, onTogglePlay]);

  useEffect(() => {
    const audio = audioRef.current;
    return () => {
      if (previewTimeoutRef.current) {
        window.clearTimeout(previewTimeoutRef.current);
      }
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const syncTime = () => {
      setAudioCurrentTime(audio.currentTime || 0);
      if (audio.duration && Number.isFinite(audio.duration)) {
        setAudioDuration(audio.duration);
      }
    };

    const syncMeta = () => {
      if (audio.duration && Number.isFinite(audio.duration)) {
        setAudioDuration(audio.duration);
      }
    };

    audio.addEventListener("timeupdate", syncTime);
    audio.addEventListener("loadedmetadata", syncMeta);

    return () => {
      audio.removeEventListener("timeupdate", syncTime);
      audio.removeEventListener("loadedmetadata", syncMeta);
    };
  }, [song.id]);

  useEffect(() => {
    setAudioCurrentTime(0);
    setAudioDuration(30);
  }, [song.id]);

  const seekPreviewBy = useCallback((deltaSeconds: number) => {
    if (!hasAudioPreview) return;
    const audio = audioRef.current;
    if (!audio) return;

    const maxTime = audio.duration && Number.isFinite(audio.duration)
      ? audio.duration
      : audioDuration || previewWindowSeconds;
    const nextTime = Math.min(Math.max((audio.currentTime || 0) + deltaSeconds, 0), maxTime);

    audio.currentTime = nextTime;
    setAudioCurrentTime(nextTime);
  }, [audioDuration, hasAudioPreview, previewWindowSeconds]);

  return (
    <motion.div
      drag
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.9}
      onDragEnd={handleDragEnd}
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      style={{
        x, y, rotate, scale: cardScale, borderColor, boxShadow: boxShadowColor,
        background: "linear-gradient(180deg, rgba(17,17,24,0.82), rgba(10,10,15,0.94))", backdropFilter: "blur(22px)",
      }}
      className="absolute inset-0 z-10 cursor-grab overflow-hidden rounded-[36px] border touch-none active:cursor-grabbing"
    >
      {/* Swipe Indicators */}
      <motion.div
        style={{ opacity: likeOpacity }}
        className="absolute right-6 top-6 z-20 rounded-2xl border-2 border-brand-green bg-brand-green/20 px-5 py-2.5 text-xl font-bold text-brand-green rotate-[-12deg] backdrop-blur-sm"
      >
        נשמור
      </motion.div>
      <motion.div
        style={{ opacity: dislikeOpacity, borderColor: "var(--accent-danger)", color: "var(--accent-danger)", background: "rgba(255,68,102,0.12)" }}
        className="absolute left-6 top-6 z-20 rounded-2xl border-2 px-5 py-2.5 text-xl font-bold rotate-[12deg] backdrop-blur-sm"
      >
        לא לכיוון
      </motion.div>
      <motion.div
        style={{ opacity: superLikeOpacity }}
        className="absolute bottom-28 left-1/2 z-20 -translate-x-1/2 rounded-2xl border-2 px-5 py-2.5 text-xl font-bold backdrop-blur-sm"
      >
        <span style={{ color: "var(--accent-gold)" }}>שיר חובה</span>
      </motion.div>

      {/* Card Content */}
      <div className="relative flex h-full flex-col overflow-hidden px-4 py-4 sm:px-5 sm:py-5">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background: imgError
              ? "radial-gradient(circle at top, rgba(5,156,192,0.18), transparent 48%)"
              : `linear-gradient(180deg, rgba(10,12,18,0.22), rgba(8,9,14,0.78)), url(${song.coverUrl}) center/cover`,
            filter: "blur(24px)",
            transform: "scale(1.04)",
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_28%),linear-gradient(180deg,rgba(0,0,0,0.04),rgba(0,0,0,0.58))]" />
        {/* Category badge */}
        <div className="relative z-10 flex items-center justify-between gap-2">
          {cat ? (
            <div
              className="rounded-full border border-white/10 bg-black/15 px-3 py-1 text-[10px] font-semibold backdrop-blur-sm"
              style={{ background: cat.color, color: "var(--text-secondary)" }}
            >
              {cat.label}
            </div>
          ) : (
            <div />
          )}
          <div className="rounded-full border border-white/10 bg-black/15 px-3 py-1 text-[10px] font-semibold text-muted backdrop-blur-sm">
            {previewBadge}
          </div>
        </div>

        <div className="relative z-10 flex min-h-0 flex-1 flex-col justify-between gap-3 pt-2">
          <div className="rounded-[28px] bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.015))] p-[1px] shadow-[0_18px_44px_rgba(0,0,0,0.22)]">
            <div className="rounded-[27px] bg-[radial-gradient(circle_at_top,rgba(26,52,78,0.2),transparent_42%),linear-gradient(180deg,rgba(4,10,20,0.9),rgba(6,10,18,0.78))] px-4 py-3.5 backdrop-blur-xl">
              <div className="flex items-center gap-3.5">
                <motion.div
                  initial={false}
                  animate={{ y: [0, -3, 0] }}
                  transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
                  className="relative shrink-0"
                >
                  <div
                    className="absolute inset-[-16%] rounded-full blur-3xl opacity-70"
                    style={{ background: "radial-gradient(circle, rgba(245,197,66,0.08), rgba(5,156,192,0.06) 44%, transparent 72%)" }}
                  />
                  <div className="relative group h-24 w-24 overflow-hidden rounded-[22px] shadow-[0_20px_48px_rgba(0,0,0,0.34)] ring-1 ring-white/10 sm:h-28 sm:w-28">
                    {!imgError ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={song.coverUrl}
                        alt={`${song.title} - ${song.artist}`}
                        className="h-full w-full object-cover scale-[1.01]"
                        onError={() => setImgError(true)}
                      />
                    ) : (
                      <div
                        className="flex h-full w-full items-center justify-center"
                        style={{ background: "linear-gradient(135deg, rgba(5,156,192,0.25), rgba(3,178,140,0.18))" }}
                      >
                        <Music2 className="h-8 w-8 text-muted" />
                      </div>
                    )}
                    <div
                      className="absolute inset-0"
                      style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.02), rgba(0,0,0,0.16) 52%, rgba(0,0,0,0.34))" }}
                    />
                    {hasInlinePreview && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onTogglePlay();
                        }}
                        className="absolute inset-0 flex items-center justify-center bg-black/16 opacity-0 transition-opacity group-hover:opacity-100 active:opacity-100"
                        aria-label={isPlaying ? "השהה" : "נגן"}
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-md ring-1 ring-white/20">
                          {isPlaying ? (
                            <Pause className="h-5 w-5 text-white" />
                          ) : (
                            <Play className="ml-0.5 h-5 w-5 text-white" fill="white" />
                          )}
                        </div>
                      </button>
                    )}
                  </div>
                </motion.div>

                <div className="min-w-0 flex-1 text-right">
                  <div className="flex items-center justify-between gap-2">
                    <div className={`h-2.5 w-2.5 rounded-full transition-all ${isPlaying ? "bg-[var(--accent-primary)] shadow-[0_0_18px_rgba(5,156,192,0.9)]" : "bg-white/20"}`} />
                    <p className="text-[10px] tracking-[0.2em] text-muted">NOW PLAYING</p>
                  </div>
                  <h3 className="mt-2 line-clamp-2 text-[27px] font-black leading-[0.98] tracking-[-0.05em] sm:text-[30px]">{song.title}</h3>
                  <p className="mt-1 text-[14px] text-secondary">{song.artist}</p>

                  <div className="mt-3 flex min-h-[20px] flex-wrap items-center justify-end gap-1.5">
                    {infoChips.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-white/[0.05] px-2.5 py-1 text-[10px] text-secondary ring-1 ring-white/7"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full rounded-[26px] bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-[1px] shadow-[0_18px_40px_rgba(0,0,0,0.22)]">
            <div className="rounded-[25px] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.04),transparent_38%),linear-gradient(180deg,rgba(10,14,22,0.93),rgba(8,12,18,0.86))] p-3.5 backdrop-blur-xl">
              <div className="flex items-start justify-between gap-3">
                <div className="text-right">
                  <p className="text-[13px] font-semibold">שליטה בהשמעה</p>
                  <p className="mt-0.5 text-[11px] text-muted">{previewTone}</p>
                </div>
                <div className={`rounded-full px-2.5 py-1 text-[10px] ${isPlaying ? "bg-[rgba(5,156,192,0.14)] text-white ring-1 ring-[rgba(5,156,192,0.3)]" : "bg-white/5 text-muted ring-1 ring-white/10"}`}>
                  {previewBadge}
                </div>
              </div>

              <div className="mt-3 rounded-[22px] bg-black/18 p-3 ring-1 ring-white/6">
                <div className="flex items-center gap-3">
                  <button
                    onClick={hasInlinePreview || hasAudioPreview ? onTogglePlay : undefined}
                    disabled={!hasInlinePreview && !hasAudioPreview}
                    className={`flex h-14 w-14 items-center justify-center rounded-full text-white shadow-[0_14px_30px_rgba(0,0,0,0.28)] transition-all disabled:cursor-not-allowed disabled:opacity-50 ${isPlaying ? "bg-[linear-gradient(135deg,rgba(5,156,192,0.98),rgba(3,178,140,0.96))] ring-2 ring-[rgba(5,156,192,0.25)]" : "border border-white/10 bg-white/10"}`}
                    aria-label={isPlaying ? "השהה" : "נגן"}
                  >
                    {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="ml-0.5 h-5 w-5" fill="white" />}
                  </button>

                  <div className="flex-1">
                    <div className="mb-2 flex items-center justify-between text-[10px] text-muted">
                      <span>{isPlaying ? "מנגן עכשיו" : "מוכן לניגון"}</span>
                      <span>{formatTime(hasAudioPreview ? audioDuration || previewWindowSeconds : previewWindowSeconds)}</span>
                    </div>
                    <input
                      id={progressId}
                      type="range"
                      min={0}
                      max={hasAudioPreview ? audioDuration || previewWindowSeconds : previewWindowSeconds}
                      value={audioCurrentTime}
                      onChange={(event) => {
                        const nextTime = Number(event.target.value);
                        setAudioCurrentTime(nextTime);
                        if (audioRef.current) {
                          audioRef.current.currentTime = nextTime;
                        }
                      }}
                      disabled={!hasAudioPreview}
                      className="h-3 w-full accent-[var(--accent-primary)] disabled:opacity-40"
                    />
                    <div className="mt-1.5 flex items-center justify-between text-[10px] text-muted">
                      <span>{formatTime(audioCurrentTime)}</span>
                      <span>{hasAudioPreview ? "preview מלא" : "מצב דמו"}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 border-t border-white/6 pt-3">
                  <div className="mb-2 flex items-center justify-between text-[10px] text-muted">
                    <span>קפיצה מהירה</span>
                    <span>{hasAudioPreview ? "15 / 30 שנ׳" : "זמין רק בטעימה פנימית"}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-0.5 rounded-[18px] bg-white/[0.02] px-1 py-1">
                    <button
                      type="button"
                      onClick={() => seekPreviewBy(-30)}
                      disabled={!hasAudioPreview}
                      className="rounded-[14px] px-1 py-2 text-center transition-all disabled:cursor-not-allowed disabled:opacity-40 active:scale-[0.97]"
                    >
                      <div className="flex items-center justify-center gap-1">
                        <Undo2 className="h-3.5 w-3.5 text-white/45" />
                        <span className="text-[15px] font-black tracking-[-0.03em] text-white">30-</span>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => seekPreviewBy(-15)}
                      disabled={!hasAudioPreview}
                      className="rounded-[14px] px-1 py-2 text-center transition-all disabled:cursor-not-allowed disabled:opacity-40 active:scale-[0.97]"
                    >
                      <div className="flex items-center justify-center gap-1">
                        <Undo2 className="h-3.5 w-3.5 text-white/45" />
                        <span className="text-[15px] font-black tracking-[-0.03em] text-white">15-</span>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => seekPreviewBy(15)}
                      disabled={!hasAudioPreview}
                      className="rounded-[14px] bg-[linear-gradient(180deg,rgba(5,156,192,0.08),rgba(3,178,140,0.03))] px-1 py-2 text-center transition-all disabled:cursor-not-allowed disabled:opacity-40 active:scale-[0.97]"
                    >
                      <div className="flex items-center justify-center gap-1">
                        <SkipForward className="h-3.5 w-3.5 text-[var(--accent-primary)]" />
                        <span className="text-[15px] font-black tracking-[-0.03em] text-white">15+</span>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => seekPreviewBy(30)}
                      disabled={!hasAudioPreview}
                      className="rounded-[14px] bg-[linear-gradient(180deg,rgba(5,156,192,0.08),rgba(3,178,140,0.03))] px-1 py-2 text-center transition-all disabled:cursor-not-allowed disabled:opacity-40 active:scale-[0.97]"
                    >
                      <div className="flex items-center justify-center gap-1">
                        <SkipForward className="h-3.5 w-3.5 text-[var(--accent-primary)]" />
                        <span className="text-[15px] font-black tracking-[-0.03em] text-white">30+</span>
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              {hasInlinePreview && (
                <>
                  {youtubeId && isPlaying ? (
                    <div className="mt-3 overflow-hidden rounded-xl">
                      <iframe
                        width="100%"
                        height="112"
                        src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&start=0&end=${previewWindowSeconds}&controls=1`}
                        allow="autoplay; encrypted-media"
                        className="rounded-xl"
                        title={`${song.title} preview`}
                      />
                    </div>
                  ) : hasAudioPreview ? (
                    <div className="space-y-2">
                      <audio
                        ref={audioRef}
                        src={media.inlineUrl}
                        preload="metadata"
                        onEnded={() => {
                          if (isPlaying) {
                            onTogglePlay();
                          }
                        }}
                        className="hidden"
                      />
                    </div>
                  ) : (
                    <button
                      onClick={onTogglePlay}
                      className="group mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/8 bg-white/[0.03] py-2 text-[11px] text-secondary transition-all hover:border-brand-blue hover:text-brand-blue"
                    >
                      <Volume2 className="h-3.5 w-3.5 group-hover:animate-pulse" />
                      נגן דרך המקור
                    </button>
                  )}
                </>
              )}

              {!hasInlinePreview && hasExternalOnly && (
                <a
                  href={media.externalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/8 bg-white/[0.03] py-2 text-[11px] text-secondary transition-all hover:border-brand-blue hover:text-brand-blue"
                  dir="ltr"
                >
                  פתחו preview חיצוני
                </a>
              )}

              {!hasInlinePreview && !hasExternalOnly && (
                <div className="mt-3 flex w-full items-center justify-center rounded-2xl border border-dashed border-white/10 bg-black/10 py-2 text-[11px] text-muted">
                  אין preview לשיר הזה, אבל אפשר לבחור לפי תחושה
                </div>
              )}

              <p className="mt-2.5 min-h-[16px] text-center text-[10px] leading-4 text-muted">{media.helperText}</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
