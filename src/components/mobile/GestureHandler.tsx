"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useDeviceDetection, getGestureConfig } from "@/hooks/useDeviceDetection";

interface GestureHandlerProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onTap?: () => void;
  onDoubleTap?: () => void;
  onLongPress?: () => void;
  onPinch?: (scale: number) => void;
  disabled?: boolean;
  threshold?: number;
  debounceTime?: number;
  className?: string;
}

interface Point {
  x: number;
  y: number;
  time: number;
}

export function GestureHandler({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  onTap,
  onDoubleTap,
  onLongPress,
  onPinch,
  disabled = false,
  threshold,
  debounceTime = 300,
  className = ""
}: GestureHandlerProps) {
  const deviceInfo = useDeviceDetection();
  const gestureConfig = getGestureConfig(deviceInfo);
  const customThreshold = threshold || gestureConfig.swipeThreshold;

  const [isActive, setIsActive] = useState(false);
  const [points, setPoints] = useState<Point[]>([]);
  const [lastTap, setLastTap] = useState<number>(0);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);
  const [initialDistance, setInitialDistance] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const lastGestureTime = useRef(0);

  // Haptic feedback
  const triggerHaptic = useCallback((type: 'light' | 'medium' | 'heavy' = 'light') => {
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
  }, [gestureConfig.hapticFeedback, deviceInfo.isMobile]);

  // Calculate distance between two points
  const getDistance = (p1: Point, p2: Point): number => {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  };

  // Calculate velocity
  const getVelocity = (points: Point[]): number => {
    if (points.length < 2) return 0;

    const first = points[0];
    const last = points[points.length - 1];
    const distance = getDistance(first, last);
    const time = last.time - first.time;

    return time > 0 ? distance / time : 0;
  };

  // Get swipe direction
  const getSwipeDirection = (points: Point[]): 'left' | 'right' | 'up' | 'down' | null => {
    if (points.length < 2) return null;

    const first = points[0];
    const last = points[points.length - 1];
    const deltaX = last.x - first.x;
    const deltaY = last.y - first.y;
    const distance = getDistance(first, last);

    if (distance < customThreshold) return null;

    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    if (absX > absY) {
      return deltaX > 0 ? 'right' : 'left';
    } else {
      return deltaY > 0 ? 'down' : 'up';
    }
  };

  // Handle gesture start
  const handleStart = useCallback((clientX: number, clientY: number, touches?: any) => {
    if (disabled) return;

    const now = Date.now();

    // Debounce gestures
    if (now - lastGestureTime.current < debounceTime) {
      return;
    }

    lastGestureTime.current = now;
    setIsActive(true);

    const point: Point = { x: clientX, y: clientY, time: now };

    if (touches && touches.length === 2) {
      // Pinch gesture
      const touch1 = touches[0];
      const touch2 = touches[1];
      const distance = getDistance(
        { x: touch1.clientX, y: touch1.clientY, time: now },
        { x: touch2.clientX, y: touch2.clientY, time: now }
      );
      setInitialDistance(distance);
      setPoints([point]);
    } else {
      // Single touch
      setPoints([point]);

      // Start long press timer
      if (onLongPress) {
        const timer = setTimeout(() => {
          triggerHaptic('heavy');
          onLongPress();
        }, gestureConfig.longPressThreshold);
        setLongPressTimer(timer);
      }
    }
  }, [disabled, debounceTime, onLongPress, gestureConfig.longPressThreshold, triggerHaptic]);

  // Handle gesture move
  const handleMove = useCallback((clientX: number, clientY: number, touches?: any) => {
    if (!isActive || disabled) return;

    const now = Date.now();
    const point: Point = { x: clientX, y: clientY, time: now };

    if (touches && touches.length === 2 && onPinch) {
      // Pinch gesture
      const touch1 = touches[0];
      const touch2 = touches[1];
      const currentDistance = getDistance(
        { x: touch1.clientX, y: touch1.clientY, time: now },
        { x: touch2.clientX, y: touch2.clientY, time: now }
      );

      if (initialDistance > 0) {
        const scale = currentDistance / initialDistance;
        onPinch(scale);
      }
    } else {
      // Single touch - track movement
      setPoints(prev => [...prev.slice(-10), point]);
    }
  }, [isActive, disabled, onPinch, initialDistance]);

  // Handle gesture end
  const handleEnd = useCallback(() => {
    if (!isActive || disabled) return;

    // Clear long press timer
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }

    if (points.length >= 2) {
      const velocity = getVelocity(points);
      const direction = getSwipeDirection(points);

      // Check if velocity is sufficient
      if (velocity >= gestureConfig.swipeVelocity && direction) {
        triggerHaptic('medium');

        switch (direction) {
          case 'left':
            onSwipeLeft?.();
            break;
          case 'right':
            onSwipeRight?.();
            break;
          case 'up':
            onSwipeUp?.();
            break;
          case 'down':
            onSwipeDown?.();
            break;
        }
      } else if (points.length === 2 && onTap) {
        // Tap gesture
        const now = Date.now();
        const timeSinceLastTap = now - lastTap;

        if (timeSinceLastTap < 300) {
          // Double tap
          triggerHaptic('medium');
          onDoubleTap?.();
          setLastTap(0);
        } else {
          // Single tap (with debounce)
          if (debounceTimer) {
            clearTimeout(debounceTimer);
          }

          const timer = setTimeout(() => {
            triggerHaptic('light');
            onTap?.();
          }, 150);

          setDebounceTimer(timer);
          setLastTap(now);
        }
      }
    }

    // Reset state
    setIsActive(false);
    setPoints([]);
    setInitialDistance(0);
  }, [isActive, disabled, points, lastTap, longPressTimer, debounceTimer, gestureConfig.swipeVelocity, triggerHaptic, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, onTap, onDoubleTap]);

  // Mouse event handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!deviceInfo.touchSupported) {
      handleStart(e.clientX, e.clientY);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!deviceInfo.touchSupported && isActive) {
      handleMove(e.clientX, e.clientY);
    }
  };

  const handleMouseUp = () => {
    if (!deviceInfo.touchSupported) {
      handleEnd();
    }
  };

  // Touch event handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    handleStart(touch.clientX, touch.clientY, e.touches);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      handleMove(touch.clientX, touch.clientY, e.touches);
    }
  };

  const handleTouchEnd = () => {
    handleEnd();
  };

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
      }
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [longPressTimer, debounceTimer]);

  return (
    <div
      ref={containerRef}
      className={`gesture-handler ${className}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        touchAction: 'none', // Prevent default touch behaviors
        userSelect: 'none',
        WebkitUserSelect: 'none',
        WebkitTouchCallout: 'none',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {children}

      {/* Visual feedback for debugging */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed top-4 right-4 bg-black/80 text-white text-xs p-2 rounded-lg z-50">
          <div>Active: {isActive ? 'Yes' : 'No'}</div>
          <div>Points: {points.length}</div>
          <div>Device: {deviceInfo.deviceType}</div>
          <div>Touch: {deviceInfo.touchSupported ? 'Yes' : 'No'}</div>
        </div>
      )}
    </div>
  );
}

// Hook for gesture state
export function useGestureState() {
  const [gestures, setGestures] = useState({
    swipeLeft: 0,
    swipeRight: 0,
    swipeUp: 0,
    swipeDown: 0,
    tap: 0,
    doubleTap: 0,
    longPress: 0,
    pinch: 0,
  });

  const recordGesture = useCallback((gesture: keyof typeof gestures) => {
    setGestures(prev => ({
      ...prev,
      [gesture]: prev[gesture] + 1,
    }));
  }, []);

  const resetGestures = useCallback(() => {
    setGestures({
      swipeLeft: 0,
      swipeRight: 0,
      swipeUp: 0,
      swipeDown: 0,
      tap: 0,
      doubleTap: 0,
      longPress: 0,
      pinch: 0,
    });
  }, []);

  return {
    gestures,
    recordGesture,
    resetGestures,
  };
}

// Predefined gesture configurations
export const gestureConfigs = {
  tinder: {
    swipeThreshold: 50,
    swipeVelocity: 0.3,
    tapThreshold: 10,
    longPressThreshold: 500,
  },
  carousel: {
    swipeThreshold: 30,
    swipeVelocity: 0.2,
    tapThreshold: 8,
    longPressThreshold: 400,
  },
  map: {
    swipeThreshold: 20,
    swipeVelocity: 0.1,
    tapThreshold: 12,
    longPressThreshold: 600,
  },
  photo: {
    swipeThreshold: 40,
    swipeVelocity: 0.25,
    tapThreshold: 10,
    longPressThreshold: 300,
  },
};
