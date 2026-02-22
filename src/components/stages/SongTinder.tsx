"use client";

import { useState, useCallback } from "react";
import { useEventStore } from "@/stores/eventStore";
import { defaultSongs, reasonChips } from "@/data/songs";
import { motion, useMotionValue, useTransform, animate, PanInfo } from "framer-motion";
import { Heart, X, Star, HelpCircle, Play, Pause, Volume2 } from "lucide-react";
import type { SwipeAction, Song } from "@/lib/types";

const SWIPE_THRESHOLD = 100;
const MIN_SWIPES = 10;

export function SongTinder() {
  const saveSwipe = useEventStore((s) => s.saveSwipe);
  const getSwipedSongIds = useEventStore((s) => s.getSwipedSongIds);
  const swipes = useEventStore((s) => s.swipes);
  const setStage = useEventStore((s) => s.setStage);
  const trackEvent = useEventStore((s) => s.trackEvent);

  const swipedIds = getSwipedSongIds();
  const availableSongs = defaultSongs.filter(
    (s) => s.isActive && !swipedIds.includes(s.id)
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [showReasons, setShowReasons] = useState(false);
  const [lastSwipedSongId, setLastSwipedSongId] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<SwipeAction | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const likeCount = swipes.filter((s) => s.action === "like" || s.action === "super_like").length;
  const currentSong = availableSongs[currentIndex];
  const isDone = !currentSong;

  const handleSwipe = useCallback(
    (songId: string, action: SwipeAction) => {
      setLastSwipedSongId(songId);
      setLastAction(action);

      if (action === "dislike") {
        setShowReasons(true);
        saveSwipe(songId, action, []);
      } else {
        saveSwipe(songId, action, []);
        setShowReasons(false);
      }

      setIsPlaying(false);
      setCurrentIndex((i) => i + 1);
      trackEvent("song_swipe", { songId, action });
    },
    [saveSwipe, trackEvent]
  );

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
        <div className="text-4xl mb-4">🎉</div>
        <h2 className="text-xl font-bold mb-2">!סיימנו את השירים</h2>
        <p className="text-secondary text-sm mb-2">
          אהבתם {likeCount} שירים
        </p>
        <p className="text-muted text-xs mb-6">
          עכשיו בואו נדבר על הרגעים המיוחדים
        </p>
        <button onClick={handleFinish} className="btn-primary w-full">
          ← המשיכו לבקשות
        </button>
      </motion.div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto relative">
      {/* Counters */}
      <div className="flex justify-between items-center mb-4 px-2">
        <div className="flex items-center gap-1 text-sm">
          <Heart className="w-4 h-4 text-brand-green" fill="var(--accent-secondary)" />
          <span className="text-brand-green font-bold">{likeCount}</span>
        </div>
        <span className="text-xs text-muted">
          {swipes.length} / {defaultSongs.length}
        </span>
        {swipes.length >= MIN_SWIPES && (
          <button
            onClick={handleFinish}
            className="text-xs text-brand-blue font-medium"
          >
            !סיימנו →
          </button>
        )}
      </div>

      {/* Card Stack */}
      <div className="relative h-[480px] w-full">
        {/* Next card preview */}
        {availableSongs[currentIndex + 1] && (
          <div className="absolute inset-0 glass-card rounded-swipe overflow-hidden scale-[0.95] opacity-50">
            <SongCardStatic song={availableSongs[currentIndex + 1]} />
          </div>
        )}

        {/* Current card */}
        <SwipeCard
          key={currentSong.id}
          song={currentSong}
          onSwipe={handleSwipe}
          isPlaying={isPlaying}
          onTogglePlay={() => setIsPlaying(!isPlaying)}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-center gap-4 mt-6">
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={() => handleSwipe(currentSong.id, "dislike")}
          className="w-14 h-14 rounded-full border-2 flex items-center justify-center transition-colors"
          style={{ borderColor: "var(--accent-danger)", color: "var(--accent-danger)" }}
          aria-label="לא אוהב"
        >
          <X className="w-6 h-6" />
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={() => handleSwipe(currentSong.id, "unsure")}
          className="w-10 h-10 rounded-full border-2 border-glass flex items-center justify-center text-muted"
          aria-label="לא בטוח"
        >
          <HelpCircle className="w-5 h-5" />
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={() => handleSwipe(currentSong.id, "super_like")}
          className="w-12 h-12 rounded-full border-2 flex items-center justify-center transition-colors"
          style={{ borderColor: "var(--accent-gold)", color: "var(--accent-gold)" }}
          aria-label="סופר לייק"
        >
          <Star className="w-5 h-5" fill="var(--accent-gold)" />
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={() => handleSwipe(currentSong.id, "like")}
          className="w-14 h-14 rounded-full border-2 flex items-center justify-center transition-colors"
          style={{ borderColor: "var(--accent-secondary)", color: "var(--accent-secondary)" }}
          aria-label="אהבתי"
        >
          <Heart className="w-6 h-6" fill="var(--accent-secondary)" />
        </motion.button>
      </div>

      {/* Reason Chips Overlay */}
      {showReasons && lastAction === "dislike" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute inset-x-0 bottom-0 glass-card p-4 rounded-t-card"
        >
          <p className="text-xs text-muted text-center mb-3">?למה לא</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {reasonChips.map((chip) => {
              const swipe = swipes.find((s) => s.songId === lastSwipedSongId);
              const isActive = swipe?.reasonChips.includes(chip);
              return (
                <button
                  key={chip}
                  onClick={() => handleReasonChip(chip)}
                  className={`chip ${isActive ? "active" : ""}`}
                >
                  {chip}
                </button>
              );
            })}
          </div>
          <button
            onClick={dismissReasons}
            className="mt-3 text-xs text-brand-blue w-full text-center"
          >
            המשך →
          </button>
        </motion.div>
      )}
    </div>
  );
}

function SongCardStatic({ song }: { song: Song }) {
  return (
    <div className="h-full flex flex-col items-center justify-center p-6">
      <div className="w-48 h-48 rounded-2xl overflow-hidden shadow-lg mb-4 bg-brand-gray/30">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={song.coverUrl}
          alt={`${song.title} - ${song.artist}`}
          className="w-full h-full object-cover"
        />
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
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-300, 0, 300], [-15, 0, 15]);
  const likeOpacity = useTransform(x, [0, 100], [0, 1]);
  const dislikeOpacity = useTransform(x, [-100, 0], [1, 0]);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    const offset = info.offset.x;
    const velocity = info.velocity.x;

    if (offset > SWIPE_THRESHOLD || velocity > 500) {
      animate(x, 500, { type: "spring" });
      onSwipe(song.id, "like");
    } else if (offset < -SWIPE_THRESHOLD || velocity < -500) {
      animate(x, -500, { type: "spring" });
      onSwipe(song.id, "dislike");
    } else {
      animate(x, 0, { type: "spring", stiffness: 500, damping: 30 });
    }
  };

  const getYouTubeId = (url: string) => {
    const match = url.match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    );
    return match ? match[1] : null;
  };

  const youtubeId = song.previewUrl ? getYouTubeId(song.previewUrl) : null;

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.8}
      onDragEnd={handleDragEnd}
      style={{ x, rotate }}
      className="absolute inset-0 glass-card rounded-swipe overflow-hidden cursor-grab active:cursor-grabbing"
    >
      {/* Swipe Indicators */}
      <motion.div
        style={{ opacity: likeOpacity }}
        className="absolute top-6 right-6 z-10 px-4 py-2 rounded-xl border-2 border-brand-green bg-brand-green/20 text-brand-green font-bold text-lg rotate-[-12deg]"
      >
        💚 אהבתי
      </motion.div>
      <motion.div
        style={{ opacity: dislikeOpacity, borderColor: "var(--accent-danger)", color: "var(--accent-danger)", background: "rgba(255,68,102,0.1)" }}
        className="absolute top-6 left-6 z-10 px-4 py-2 rounded-xl border-2 text-lg font-bold rotate-[12deg]"
        dir="ltr"
      >
        ✕ לא
      </motion.div>

      {/* Card Content */}
      <div className="h-full flex flex-col items-center justify-center p-6 relative">
        {/* Cover Art */}
        <div className="w-52 h-52 rounded-2xl overflow-hidden shadow-xl mb-5 relative group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={song.coverUrl}
            alt={`${song.title} - ${song.artist}`}
            className="w-full h-full object-cover"
          />
          {/* Play overlay */}
          {youtubeId && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTogglePlay();
              }}
              className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label={isPlaying ? "השהה" : "נגן"}
            >
              {isPlaying ? (
                <Pause className="w-12 h-12 text-white" />
              ) : (
                <Play className="w-12 h-12 text-white" fill="white" />
              )}
            </button>
          )}
        </div>

        {/* Song Info */}
        <h3 className="text-xl font-bold mb-1">{song.title}</h3>
        <p className="text-secondary text-sm mb-3">{song.artist}</p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 justify-center mb-4">
          {song.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-xs px-2.5 py-1 rounded-full border border-glass text-muted"
            >
              {tag}
            </span>
          ))}
          {/* Energy */}
          <span className="text-xs px-2.5 py-1 rounded-full border border-glass text-muted">
            {"⚡".repeat(song.energy)}
          </span>
        </div>

        {/* Audio Preview Player */}
        {youtubeId && (
          <div className="w-full max-w-[280px]">
            {isPlaying ? (
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
            ) : (
              <button
                onClick={onTogglePlay}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-glass text-sm text-secondary hover:text-brand-blue hover:border-brand-blue transition-colors"
              >
                <Volume2 className="w-4 h-4" />
                שמעו קטע (30 שניות)
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
