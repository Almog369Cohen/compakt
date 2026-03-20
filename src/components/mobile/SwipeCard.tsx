"use client";

import { useState, useRef, useEffect } from "react";
import { useDeviceDetection, getGestureConfig } from "@/hooks/useDeviceDetection";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, X, SkipForward, Volume2, Music } from "lucide-react";

interface SwipeCardProps {
  song: {
    id: string;
    title: string;
    artist: string;
    album?: string;
    imageUrl?: string;
    previewUrl?: string;
    duration?: number;
    popularity?: number;
  };
  onSwipe: (direction: 'left' | 'right' | 'up', songId: string) => void;
  onPreview?: (songId: string) => void;
  isPreviewPlaying?: boolean;
  className?: string;
  disabled?: boolean;
  showControls?: boolean;
  cardStyle?: 'tinder' | 'modern' | 'minimal';
}

export function SwipeCard({
  song,
  onSwipe,
  onPreview,
  isPreviewPlaying = false,
  className = "",
  disabled = false,
  showControls = true,
  cardStyle = 'tinder'
}: SwipeCardProps) {
  const deviceInfo = useDeviceDetection();
  const gestureConfig = getGestureConfig(deviceInfo);

  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isLongPress, setIsLongPress] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);
  const dragStartPos = useRef({ x: 0, y: 0, time: 0 });
  const longPressTimer = useRef<NodeJS.Timeout>();

  // Haptic feedback function
  const triggerHaptic = (type: 'light' | 'medium' | 'heavy' = 'light') => {
    if (!gestureConfig.hapticFeedback || !deviceInfo.isMobile) return;

    if ('vibrate' in navigator) {
      switch (type) {
        case 'light':
          navigator.vibrate(10);
          break;
        case 'medium':
          navigator.vibrate(20);
          break;
        case 'heavy':
          navigator.vibrate([30, 10, 30]);
          break;
      }
    }
  };

  // Get swipe direction based on drag offset
  const getSwipeDirection = (x: number, y: number): 'left' | 'right' | 'up' | null => {
    const threshold = gestureConfig.swipeThreshold;
    const absX = Math.abs(x);
    const absY = Math.abs(y);

    if (absX < threshold && absY < threshold) return null;

    if (absY > absX && y < -threshold) return 'up';
    if (absX > absY && x > threshold) return 'right';
    if (absX > absY && x < -threshold) return 'left';

    return null;
  };

  // Get rotation based on horizontal drag
  const getRotation = (x: number) => {
    const maxRotation = deviceInfo.isIPhone ? 15 : 12;
    return (x / 200) * maxRotation;
  };

  // Get opacity for swipe indicators
  const getIndicatorOpacity = (x: number, y: number) => {
    const threshold = gestureConfig.swipeThreshold;
    const progress = Math.max(Math.abs(x), Math.abs(y)) / threshold;
    return Math.min(progress, 1);
  };

  // Handle mouse/touch start
  const handleDragStart = (clientX: number, clientY: number) => {
    if (disabled) return;

    setIsDragging(true);
    setDragOffset({ x: 0, y: 0 });
    dragStartPos.current = { x: clientX, y: clientY, time: Date.now() };

    // Start long press timer
    longPressTimer.current = setTimeout(() => {
      setIsLongPress(true);
      triggerHaptic('heavy');
      setShowPreview(true);
    }, gestureConfig.longPressThreshold);
  };

  // Handle mouse/touch move
  const handleDragMove = (clientX: number, clientY: number) => {
    if (!isDragging || disabled) return;

    const deltaX = clientX - dragStartPos.current.x;
    const deltaY = clientY - dragStartPos.current.y;

    // Cancel long press if moved too much
    if (Math.abs(deltaX) > 20 || Math.abs(deltaY) > 20) {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
      setIsLongPress(false);
    }

    setDragOffset({ x: deltaX, y: deltaY });
  };

  // Handle mouse/touch end
  const handleDragEnd = () => {
    if (!isDragging || disabled) return;

    const direction = getSwipeDirection(dragOffset.x, dragOffset.y);

    if (direction) {
      triggerHaptic('medium');
      onSwipe(direction, song.id);
    }

    // Reset state
    setIsDragging(false);
    setDragOffset({ x: 0, y: 0 });
    setIsLongPress(false);
    setShowPreview(false);

    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  };

  // Mouse event handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    handleDragStart(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    handleDragMove(e.clientX, e.clientY);
  };

  const handleMouseUp = () => {
    handleDragEnd();
  };

  // Touch event handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    handleDragStart(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    handleDragMove(touch.clientX, touch.clientY);
  };

  const handleTouchEnd = () => {
    handleDragEnd();
  };

  // Handle preview toggle
  const handlePreviewToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onPreview) {
      onPreview(song.id);
      triggerHaptic('light');
    }
  };

  // Add global mouse/touch listeners
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        handleDragMove(e.clientX, e.clientY);
      }
    };

    const handleGlobalMouseUp = () => {
      if (isDragging) {
        handleDragEnd();
      }
    };

    const handleGlobalTouchMove = (e: TouchEvent) => {
      if (isDragging && e.touches.length > 0) {
        const touch = e.touches[0];
        handleDragMove(touch.clientX, touch.clientY);
      }
    };

    const handleGlobalTouchEnd = () => {
      if (isDragging) {
        handleDragEnd();
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
      document.addEventListener('touchmove', handleGlobalTouchMove);
      document.addEventListener('touchend', handleGlobalTouchEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('touchmove', handleGlobalTouchMove);
      document.removeEventListener('touchend', handleGlobalTouchEnd);
    };
  }, [isDragging, dragOffset]);

  // Calculate card transform
  const rotation = getRotation(dragOffset.x);
  const scale = isDragging ? 1.05 : 1;
  const leftOpacity = getIndicatorOpacity(dragOffset.x, 0);
  const rightOpacity = getIndicatorOpacity(-dragOffset.x, 0);
  const upOpacity = getIndicatorOpacity(0, -dragOffset.y);

  // Get card style classes
  const getCardClasses = () => {
    const baseClasses = "relative w-full h-full rounded-2xl shadow-2xl cursor-pointer select-none";

    switch (cardStyle) {
      case 'modern':
        return `${baseClasses} bg-gradient-to-br from-gray-900 to-gray-800 text-white`;
      case 'minimal':
        return `${baseClasses} bg-white border border-gray-200`;
      case 'tinder':
      default:
        return `${baseClasses} bg-white`;
    }
  };

  return (
    <div className={`swipe-card-container ${className}`}>
      <motion.div
        ref={cardRef}
        className={getCardClasses()}
        style={{
          transform: `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${rotation}deg) scale(${scale})`,
          transition: isDragging ? 'none' : 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          cursor: disabled ? 'not-allowed' : 'grab',
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        whileTap={{ scale: disabled ? 1 : 0.98 }}
        drag={!disabled}
        dragElastic={0.2}
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      >
        {/* Card Content */}
        <div className="relative h-full overflow-hidden">
          {/* Album Art */}
          {song.imageUrl && (
            <div className="absolute inset-0">
              <img
                src={song.imageUrl}
                alt={song.title}
                className="w-full h-full object-cover"
                draggable={false}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            </div>
          )}

          {/* Song Info */}
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <h3 className="text-2xl font-bold mb-2 drop-shadow-lg">
              {song.title}
            </h3>
            <p className="text-lg opacity-90 drop-shadow-lg">
              {song.artist}
            </p>
            {song.album && (
              <p className="text-sm opacity-75 drop-shadow-lg">
                {song.album}
              </p>
            )}
          </div>

          {/* Swipe Indicators */}
          <AnimatePresence>
            {leftOpacity > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: leftOpacity }}
                exit={{ opacity: 0 }}
                className="absolute top-8 left-8 bg-red-500 text-white p-4 rounded-full"
              >
                <X size={32} />
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {rightOpacity > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: rightOpacity }}
                exit={{ opacity: 0 }}
                className="absolute top-8 right-8 bg-green-500 text-white p-4 rounded-full"
              >
                <Heart size={32} />
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {upOpacity > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: upOpacity }}
                exit={{ opacity: 0 }}
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-blue-500 text-white p-4 rounded-full"
              >
                <SkipForward size={32} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Long Press Preview */}
          <AnimatePresence>
            {showPreview && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute inset-0 bg-black/80 flex items-center justify-center"
              >
                <div className="text-white text-center">
                  <Volume2 size={48} className="mx-auto mb-4" />
                  <p className="text-lg font-semibold">תצוגה מקדימה</p>
                  <p className="text-sm opacity-75">השמע קטע מהשיר</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Preview Button */}
          {showControls && onPreview && song.previewUrl && (
            <button
              onClick={handlePreviewToggle}
              className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm text-white p-2 rounded-full hover:bg-white/30 transition-colors"
            >
              <Volume2 size={20} />
              {isPreviewPlaying && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                </div>
              )}
            </button>
          )}
        </div>
      </motion.div>

      {/* Disabled Overlay */}
      {disabled && (
        <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center">
          <p className="text-white text-lg font-semibold">לא זמין</p>
        </div>
      )}
    </div>
  );
}

// Swipe Card Stack Component
interface SwipeCardStackProps {
  songs: Array<{
    id: string;
    title: string;
    artist: string;
    album?: string;
    imageUrl?: string;
    previewUrl?: string;
    duration?: number;
    popularity?: number;
  }>;
  onSwipe: (direction: 'left' | 'right' | 'up', songId: string) => void;
  onPreview?: (songId: string) => void;
  currentlyPreviewing?: string;
  className?: string;
  emptyState?: React.ReactNode;
}

export function SwipeCardStack({
  songs,
  onSwipe,
  onPreview,
  currentlyPreviewing,
  className = "",
  emptyState
}: SwipeCardStackProps) {
  const [topIndex, setTopIndex] = useState(0);

  const handleSwipe = (direction: 'left' | 'right' | 'up', songId: string) => {
    onSwipe(direction, songId);
    setTopIndex(prev => Math.min(prev + 1, songs.length - 1));
  };

  if (songs.length === 0) {
    return (
      <div className={`flex items-center justify-center h-96 ${className}`}>
        {emptyState || (
          <div className="text-center">
            <Music size={48} className="mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 text-lg">אין עוד שירים</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`relative h-96 w-full max-w-sm mx-auto ${className}`}>
      {songs.slice(topIndex).map((song, index) => (
        <div
          key={song.id}
          className="absolute inset-0"
          style={{
            zIndex: songs.length - index,
            transform: `scale(${1 - index * 0.05}) translateY(${index * 8}px)`,
          }}
        >
          <SwipeCard
            song={song}
            onSwipe={handleSwipe}
            onPreview={onPreview}
            isPreviewPlaying={currentlyPreviewing === song.id}
            disabled={index > 0}
          />
        </div>
      ))}
    </div>
  );
}
