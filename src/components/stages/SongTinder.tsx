"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useEventStore } from "@/stores/eventStore";
import { useAdminStore } from "@/stores/adminStore";
import { reasonChips } from "@/data/songs";
import { motion, AnimatePresence, useMotionValue, useTransform, animate, PanInfo } from "framer-motion";
import { Heart, X, Star, HelpCircle, Play, Pause, Volume2, SkipForward, Undo2, ChevronUp, Music2 } from "lucide-react";
import type { SwipeAction, Song, SongSwipe } from "@/lib/types";
import { SwipeTutorial, useSwipeTutorial } from "@/components/ui/SwipeTutorial";

const SWIPE_THRESHOLD = 80;
const SWIPE_UP_THRESHOLD = 80;
const MIN_SWIPES = 10;

const categoryLabels: Record<string, { label: string; color: string }> = {
  ceremony: { label: "טקס", color: "rgba(245,197,66,0.25)" },
  dancing: { label: "רחבה", color: "rgba(3,178,140,0.25)" },
  food: { label: "אוכל", color: "rgba(5,156,192,0.25)" },
  reception: { label: "קבלת פנים", color: "rgba(168,85,247,0.25)" },
};

export function SongTinder() {
  const saveSwipe = useEventStore((s) => s.saveSwipe);
  const getSwipedSongIds = useEventStore((s) => s.getSwipedSongIds);
  const swipes = useEventStore((s) => s.swipes);
  const setStage = useEventStore((s) => s.setStage);
  const trackEvent = useEventStore((s) => s.trackEvent);
  const setSwipes = useEventStore((s) => s.setSwipes);
  const adminSongs = useAdminStore((s) => s.songs);

  const allActive = useMemo(() => adminSongs.filter((s) => s.isActive), [adminSongs]);
  const swipedIds = getSwipedSongIds();
  const availableSongs = allActive.filter((s) => !swipedIds.includes(s.id));

  // No currentIndex needed — availableSongs[0] is always the current card
  const [showReasons, setShowReasons] = useState(false);
  const [lastSwipedSongId, setLastSwipedSongId] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<SwipeAction | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showSuperBurst, setShowSuperBurst] = useState(false);
  const { showTutorial, dismissTutorial } = useSwipeTutorial();

  const [lastUndo, setLastUndo] = useState<{
    songId: string;
    prevSwipes: SongSwipe[];
  } | null>(null);

  const likeCount = swipes.filter((s) => s.action === "like" || s.action === "super_like").length;
  const superLikeCount = swipes.filter((s) => s.action === "super_like").length;
  const totalActive = allActive.length;
  const progress = totalActive > 0 ? swipes.length / totalActive : 0;
  const currentSong = availableSongs[0];
  const isDone = !currentSong;

  const handleSwipe = useCallback(
    (songId: string, action: SwipeAction) => {
      setLastSwipedSongId(songId);
      setLastAction(action);

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

  const handleFinish = () => {
    trackEvent("stage_complete", { stage: 2 });
    setStage(3);
  };

  if (isDone) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card p-8 text-center max-w-md mx-auto"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 10, delay: 0.2 }}
          className="text-6xl mb-6"
        >
          🎉
        </motion.div>
        <h2 className="text-2xl font-bold mb-3">!סיימנו את השירים</h2>
        <div className="flex items-center justify-center gap-6 mb-4">
          <div className="text-center">
            <div className="flex items-center gap-1 justify-center">
              <Heart className="w-5 h-5 text-brand-green" fill="var(--accent-secondary)" />
              <span className="text-2xl font-bold text-brand-green">{likeCount}</span>
            </div>
            <span className="text-xs text-muted">אהבתם</span>
          </div>
          {superLikeCount > 0 && (
            <div className="text-center">
              <div className="flex items-center gap-1 justify-center">
                <Star className="w-5 h-5" style={{ color: "var(--accent-gold)" }} fill="var(--accent-gold)" />
                <span className="text-2xl font-bold" style={{ color: "var(--accent-gold)" }}>{superLikeCount}</span>
              </div>
              <span className="text-xs text-muted">חובה!</span>
            </div>
          )}
          <div className="text-center">
            <span className="text-2xl font-bold text-muted">{swipes.length}</span>
            <span className="text-xs text-muted block">סה&quot;כ</span>
          </div>
        </div>
        <p className="text-muted text-sm mb-6">
          עכשיו בואו נדבר על הרגעים המיוחדים
        </p>
        <button onClick={handleFinish} className="btn-primary w-full text-lg py-4">
          המשיכו לבקשות
        </button>
      </motion.div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto relative">
      {/* Swipe Tutorial */}
      <AnimatePresence>
        {showTutorial && <SwipeTutorial onDismiss={dismissTutorial} />}
      </AnimatePresence>

      {/* Progress Bar */}
      <div className="mb-4 px-2">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Heart className="w-4 h-4 text-brand-green" fill="var(--accent-secondary)" />
              <span className="text-brand-green font-bold text-sm">{likeCount}</span>
            </div>
            {superLikeCount > 0 && (
              <div className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5" style={{ color: "var(--accent-gold)" }} fill="var(--accent-gold)" />
                <span className="font-bold text-sm" style={{ color: "var(--accent-gold)" }}>{superLikeCount}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleUndo}
              disabled={!lastUndo}
              className={`p-1.5 rounded-lg transition-all ${lastUndo ? "text-muted hover:text-brand-blue hover:bg-brand-blue/10" : "opacity-30 cursor-not-allowed"}`}
              aria-label="בטל פעולה אחרונה"
              title="בטל"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <span className="text-xs text-muted tabular-nums">
              {swipes.length} / {totalActive}
            </span>
          </div>
        </div>

        {/* Animated progress bar */}
        <div className="h-1.5 rounded-full bg-glass overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: "linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))" }}
            initial={false}
            animate={{ width: `${progress * 100}%` }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        </div>
      </div>

      {swipes.length >= MIN_SWIPES && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center mb-3"
        >
          <button
            onClick={handleFinish}
            className="flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-full border border-brand-blue text-brand-blue hover:bg-brand-blue/10 transition-colors"
          >
            <SkipForward className="w-4 h-4" />
            אפשר להמשיך לשלב הבא
          </button>
        </motion.div>
      )}

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

      {/* Card Stack */}
      <div className="relative h-[500px] w-full">
        {/* Third card (deepest) */}
        {availableSongs[2] && (
          <motion.div
            className="absolute inset-0 glass-card overflow-hidden rounded-[24px]"
            style={{ scale: 0.88, opacity: 0.2, y: 16 }}
          >
            <SongCardStatic song={availableSongs[2]} />
          </motion.div>
        )}
        {/* Second card */}
        {availableSongs[1] && (
          <motion.div
            className="absolute inset-0 glass-card overflow-hidden rounded-[24px]"
            initial={false}
            animate={{ scale: 0.94, opacity: 0.5, y: 8 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <SongCardStatic song={availableSongs[1]} />
          </motion.div>
        )}

        {/* Current card */}
        <AnimatePresence mode="popLayout">
          <SwipeCard
            key={currentSong.id}
            song={currentSong}
            onSwipe={handleSwipe}
            isPlaying={isPlaying}
            onTogglePlay={() => setIsPlaying(!isPlaying)}
          />
        </AnimatePresence>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-center gap-3 mt-5">
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.85 }}
          onClick={() => handleSwipe(currentSong.id, "dislike")}
          className="w-[56px] h-[56px] rounded-full border-2 flex items-center justify-center transition-all shadow-lg"
          style={{ borderColor: "var(--accent-danger)", color: "var(--accent-danger)", background: "rgba(255,68,102,0.08)" }}
          aria-label="לא אוהב"
        >
          <X className="w-7 h-7" strokeWidth={2.5} />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.85 }}
          onClick={() => handleSwipe(currentSong.id, "unsure")}
          className="w-11 h-11 rounded-full border-2 border-glass flex items-center justify-center text-muted hover:text-brand-blue hover:border-brand-blue transition-all"
          aria-label="לא בטוח"
        >
          <HelpCircle className="w-5 h-5" />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.85 }}
          onClick={() => handleSwipe(currentSong.id, "super_like")}
          className="w-[52px] h-[52px] rounded-full border-2 flex items-center justify-center transition-all shadow-lg"
          style={{ borderColor: "var(--accent-gold)", color: "var(--accent-gold)", background: "rgba(245,197,66,0.08)" }}
          aria-label="סופר לייק"
        >
          <Star className="w-6 h-6" fill="var(--accent-gold)" />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.85 }}
          onClick={() => handleSwipe(currentSong.id, "like")}
          className="w-[56px] h-[56px] rounded-full border-2 flex items-center justify-center transition-all shadow-lg"
          style={{ borderColor: "var(--accent-secondary)", color: "var(--accent-secondary)", background: "rgba(3,178,140,0.08)" }}
          aria-label="אהבתי"
        >
          <Heart className="w-7 h-7" fill="var(--accent-secondary)" />
        </motion.button>
      </div>

      {/* Keyboard Hints (desktop only) */}
      <div className="hidden sm:flex items-center justify-center gap-6 mt-3 text-[10px] text-muted">
        <span>← לא</span>
        <span>↓ לא בטוח</span>
        <span>↑ סופר</span>
        <span>→ אהבתי</span>
      </div>

      {/* Swipe-up hint on mobile */}
      <div className="sm:hidden flex items-center justify-center mt-2">
        <span className="text-[10px] text-muted flex items-center gap-1">
          <ChevronUp className="w-3 h-3" /> החליקו למעלה לסופר לייק
        </span>
      </div>

      {/* Reason Chips Overlay */}
      <AnimatePresence>
        {showReasons && lastAction === "dislike" && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="absolute inset-x-0 bottom-0 glass-card p-5 rounded-t-[24px] z-20"
          >
            <p className="text-sm text-muted text-center mb-3 font-medium">?למה לא אהבתם</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {reasonChips.map((chip) => {
                const swipe = swipes.find((s) => s.songId === lastSwipedSongId);
                const isActive = swipe?.reasonChips.includes(chip);
                return (
                  <motion.button
                    key={chip}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => handleReasonChip(chip)}
                    className={`chip ${isActive ? "active" : ""}`}
                  >
                    {chip}
                  </motion.button>
                );
              })}
            </div>
            <button
              onClick={dismissReasons}
              className="mt-4 btn-primary w-full text-sm py-3"
            >
              המשך
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SongCardStatic({ song }: { song: Song }) {
  const [imgError, setImgError] = useState(false);
  return (
    <div className="h-full flex flex-col items-center justify-center p-6">
      <div className="w-48 h-48 rounded-2xl overflow-hidden shadow-lg mb-4 flex items-center justify-center relative"
        style={{ background: "rgba(31,31,33,0.3)" }}
      >
        {!imgError ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={song.coverUrl}
            alt={`${song.title} - ${song.artist}`}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, rgba(5,156,192,0.25), rgba(3,178,140,0.18))" }}
          >
            <Music2 className="w-12 h-12 text-muted" />
          </div>
        )}
      </div>
      <h3 className="text-lg font-bold">{song.title}</h3>
      <p className="text-secondary text-sm">{song.artist}</p>
    </div>
  );
}

function SwipeCard({
  song,
  onSwipe,
  isPlaying,
  onTogglePlay,
}: {
  song: Song;
  onSwipe: (songId: string, action: SwipeAction) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
}) {
  const [imgError, setImgError] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
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

  const getYouTubeId = (url: string) => {
    const match = url.match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    );
    return match ? match[1] : null;
  };

  const youtubeId = song.previewUrl ? getYouTubeId(song.previewUrl) : null;
  const hasAudioPreview = Boolean(song.previewUrl && !youtubeId);

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
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    };
  }, []);

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
        background: "var(--bg-surface)", backdropFilter: "blur(var(--glass-blur))",
      }}
      className="absolute inset-0 rounded-[24px] overflow-hidden cursor-grab active:cursor-grabbing touch-none border-2 z-10"
    >
      {/* Swipe Indicators */}
      <motion.div
        style={{ opacity: likeOpacity }}
        className="absolute top-6 right-6 z-20 px-5 py-2.5 rounded-2xl border-2 border-brand-green bg-brand-green/20 text-brand-green font-bold text-xl rotate-[-12deg]"
      >
        אהבתי
      </motion.div>
      <motion.div
        style={{ opacity: dislikeOpacity, borderColor: "var(--accent-danger)", color: "var(--accent-danger)", background: "rgba(255,68,102,0.12)" }}
        className="absolute top-6 left-6 z-20 px-5 py-2.5 rounded-2xl border-2 text-xl font-bold rotate-[12deg]"
        dir="ltr"
      >
        ✕ לא
      </motion.div>
      <motion.div
        style={{ opacity: superLikeOpacity }}
        className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20 px-5 py-2.5 rounded-2xl border-2 font-bold text-xl"
        dir="ltr"
      >
        <span style={{ color: "var(--accent-gold)" }}>⭐ חובה!</span>
      </motion.div>

      {/* Card Content */}
      <div className="h-full flex flex-col items-center justify-center px-6 py-5 relative">
        {/* Category badge */}
        {cat && (
          <div
            className="absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-medium"
            style={{ background: cat.color, color: "var(--text-secondary)" }}
          >
            {cat.label}
          </div>
        )}

        {/* Cover Art — larger, with vinyl shadow effect */}
        <div className="relative mt-6 mb-5">
          <div className="w-56 h-56 sm:w-60 sm:h-60 rounded-2xl overflow-hidden shadow-2xl relative group ring-1 ring-white/5">
            {!imgError ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={song.coverUrl}
                alt={`${song.title} - ${song.artist}`}
                className="w-full h-full object-cover"
                onError={() => setImgError(true)}
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, rgba(5,156,192,0.25), rgba(3,178,140,0.18))" }}
              >
                <Music2 className="w-16 h-16 text-muted" />
              </div>
            )}
            {/* Play overlay */}
            {(youtubeId || hasAudioPreview) && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onTogglePlay();
                }}
                className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 active:opacity-100 transition-opacity"
                aria-label={isPlaying ? "השהה" : "נגן"}
              >
                <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  {isPlaying ? (
                    <Pause className="w-8 h-8 text-white" />
                  ) : (
                    <Play className="w-8 h-8 text-white ml-1" fill="white" />
                  )}
                </div>
              </button>
            )}
          </div>
        </div>

        {/* Song Info */}
        <h3 className="text-xl font-bold mb-0.5 text-center leading-tight">{song.title}</h3>
        <p className="text-secondary text-sm mb-3">{song.artist}</p>

        {/* Tags + Energy */}
        <div className="flex flex-wrap gap-1.5 justify-center mb-3">
          {song.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-[11px] px-2.5 py-0.5 rounded-full border border-glass text-muted"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Energy meter */}
        <div className="flex items-center gap-1 mb-3">
          {[1, 2, 3, 4, 5].map((level) => (
            <div
              key={level}
              className="w-5 h-1.5 rounded-full transition-all"
              style={{
                background: level <= song.energy
                  ? `var(--accent-${song.energy >= 4 ? "secondary" : "primary"})`
                  : "rgba(255,255,255,0.1)",
              }}
            />
          ))}
          <span className="text-[10px] text-muted mr-1">אנרגיה</span>
        </div>

        {/* Audio Preview */}
        {(youtubeId || hasAudioPreview) && (
          <div className="w-full max-w-[280px]">
            {youtubeId && isPlaying ? (
              <div className="rounded-xl overflow-hidden">
                <iframe
                  width="100%"
                  height="80"
                  src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&start=30&end=60&controls=1`}
                  allow="autoplay; encrypted-media"
                  className="rounded-xl"
                  title={`${song.title} preview`}
                />
              </div>
            ) : hasAudioPreview ? (
              <div className="space-y-2">
                <button
                  onClick={onTogglePlay}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-glass text-xs text-secondary hover:text-brand-blue hover:border-brand-blue transition-all group"
                >
                  <Volume2 className="w-3.5 h-3.5 group-hover:animate-pulse" />
                  {isPlaying ? "השהה קטע" : "שמעו קטע"}
                </button>
                <audio
                  ref={audioRef}
                  src={song.previewUrl}
                  preload="metadata"
                  onEnded={() => {
                    if (isPlaying) {
                      onTogglePlay();
                    }
                  }}
                  className="w-full"
                  controls
                />
              </div>
            ) : (
              <button
                onClick={onTogglePlay}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-glass text-xs text-secondary hover:text-brand-blue hover:border-brand-blue transition-all group"
              >
                <Volume2 className="w-3.5 h-3.5 group-hover:animate-pulse" />
                שמעו קטע
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
