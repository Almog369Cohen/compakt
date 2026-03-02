"use client";

import { useCallback, useRef } from "react";

interface TrackOptions {
  eventName: string;
  category?: "couple" | "admin" | "system";
  eventId?: string | null;
  sessionId?: string | null;
  djId?: string | null;
  metadata?: Record<string, unknown>;
  pagePath?: string;
}

const BATCH_INTERVAL_MS = 2000;
const MAX_BATCH_SIZE = 20;

let batchQueue: TrackOptions[] = [];
let batchTimer: ReturnType<typeof setTimeout> | null = null;

function flushBatch() {
  if (batchQueue.length === 0) return;
  const events = [...batchQueue];
  batchQueue = [];
  batchTimer = null;

  fetch("/api/analytics/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ events }),
    keepalive: true,
  }).catch(() => {});
}

function enqueue(opts: TrackOptions) {
  batchQueue.push({
    ...opts,
    pagePath: opts.pagePath || (typeof window !== "undefined" ? window.location.pathname : undefined),
  });

  if (batchQueue.length >= MAX_BATCH_SIZE) {
    flushBatch();
    return;
  }

  if (!batchTimer) {
    batchTimer = setTimeout(flushBatch, BATCH_INTERVAL_MS);
  }
}

// Flush on page unload
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", flushBatch);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flushBatch();
  });
}

/**
 * Hook for tracking analytics events with automatic batching.
 *
 * Usage:
 *   const { track, trackStageEnter, trackStageComplete } = useAnalytics({ eventId, djId });
 *   track("button_click", { button: "submit" });
 *   trackStageEnter(1);
 *   trackStageComplete(1, durationMs);
 */
export function useAnalytics(defaults?: {
  eventId?: string | null;
  sessionId?: string | null;
  djId?: string | null;
  category?: "couple" | "admin" | "system";
}) {
  const stageStartRef = useRef<Record<number, number>>({});

  const track = useCallback(
    (eventName: string, metadata?: Record<string, unknown>) => {
      enqueue({
        eventName,
        category: defaults?.category || "couple",
        eventId: defaults?.eventId || undefined,
        sessionId: defaults?.sessionId || undefined,
        djId: defaults?.djId || undefined,
        metadata,
      });
    },
    [defaults?.category, defaults?.eventId, defaults?.sessionId, defaults?.djId]
  );

  const trackStageEnter = useCallback(
    (stage: number) => {
      stageStartRef.current[stage] = Date.now();
      track(`stage_enter_${stage}`, { stage });
    },
    [track]
  );

  const trackStageComplete = useCallback(
    (stage: number, extraMeta?: Record<string, unknown>) => {
      const startTime = stageStartRef.current[stage];
      const durationMs = startTime ? Date.now() - startTime : undefined;
      track(`stage_complete_${stage}`, { stage, duration_ms: durationMs, ...extraMeta });
    },
    [track]
  );

  const trackAction = useCallback(
    (action: string, metadata?: Record<string, unknown>) => {
      enqueue({
        eventName: action,
        category: "admin",
        djId: defaults?.djId || undefined,
        metadata,
      });
    },
    [defaults?.djId]
  );

  return { track, trackStageEnter, trackStageComplete, trackAction };
}

/**
 * Standalone track function for use outside React components (e.g., in stores).
 */
export function trackAnalytics(
  eventName: string,
  opts?: {
    category?: "couple" | "admin" | "system";
    eventId?: string | null;
    sessionId?: string | null;
    djId?: string | null;
    metadata?: Record<string, unknown>;
  }
) {
  enqueue({
    eventName,
    category: opts?.category || "couple",
    eventId: opts?.eventId || undefined,
    sessionId: opts?.sessionId || undefined,
    djId: opts?.djId || undefined,
    metadata: opts?.metadata,
  });
}
