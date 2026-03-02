"use client";

import { useEventStore } from "@/stores/eventStore";
import { EventSetup } from "@/components/stages/EventSetup";
import { QuestionFlow } from "@/components/stages/QuestionFlow";
import { SongTinder } from "@/components/stages/SongTinder";
import { DreamsRequests } from "@/components/stages/DreamsRequests";
import { MusicBrief } from "@/components/stages/MusicBrief";
import { PhoneGate } from "@/components/auth/PhoneGate";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { StageNav } from "@/components/ui/StageNav";
import { HydrationGuard } from "@/components/ui/HydrationGuard";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useEffect, useState, useRef, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { RotateCcw } from "lucide-react";

function JourneyApp() {
  const event = useEventStore((s) => s.event);
  const theme = useEventStore((s) => s.theme);
  const loadEvent = useEventStore((s) => s.loadEvent);
  const setStage = useEventStore((s) => s.setStage);
  const reset = useEventStore((s) => s.reset);
  const currentStage = event?.currentStage ?? 0;
  const [showReset, setShowReset] = useState(false);

  // Phone auth state
  const [pendingToken, setPendingToken] = useState<string | null>(null);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const resumeDataRef = useRef<{
    answers: Record<string, unknown>[];
    swipes: Record<string, unknown>[];
    requests: Record<string, unknown>[];
    currentStage: number;
  } | null>(null);

  // Analytics
  const { track, trackStageEnter } = useAnalytics({
    eventId: event?.id,
    sessionId,
    category: "couple",
  });

  const prevStageRef = useRef<number | null>(null);

  // Track stage changes
  useEffect(() => {
    if (event && currentStage !== prevStageRef.current) {
      trackStageEnter(currentStage);
      prevStageRef.current = currentStage;
    }
  }, [event, currentStage, trackStageEnter]);

  // Load event from magic link URL param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (token) {
      // Check if already verified for this token (stored in sessionStorage)
      const stored = sessionStorage.getItem(`compakt_session_${token}`);
      if (stored) {
        // Already verified — load event directly
        loadEvent(token);
        setPhoneVerified(true);
        setSessionId(stored);
        track("link_open", { returning: true });
      } else {
        // New visit — show phone gate
        setPendingToken(token);
        track("link_open", { returning: false });
      }
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [loadEvent, track]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const handlePhoneVerified = useCallback((data: {
    sessionId: string;
    phone: string;
    resumeData: {
      answers: Record<string, unknown>[];
      swipes: Record<string, unknown>[];
      requests: Record<string, unknown>[];
      currentStage: number;
    } | null;
  }) => {
    setSessionId(data.sessionId);
    setPhoneVerified(true);
    track("phone_verified", { phone: data.phone.slice(-4) });

    // Store session for page refreshes
    if (pendingToken) {
      sessionStorage.setItem(`compakt_session_${pendingToken}`, data.sessionId);
      loadEvent(pendingToken);
    }

    // If there's resume data, offer to continue
    if (data.resumeData && (data.resumeData.answers.length > 0 || data.resumeData.swipes.length > 0)) {
      resumeDataRef.current = data.resumeData;
      setShowResumePrompt(true);
      track("resume_prompt_shown", { stage: data.resumeData.currentStage });
    } else {
      track("session_start", { fresh: true });
    }
  }, [pendingToken, loadEvent, track]);

  const handleResume = () => {
    if (resumeDataRef.current) {
      setStage(resumeDataRef.current.currentStage);
      track("session_resume", { stage: resumeDataRef.current.currentStage });
    }
    setShowResumePrompt(false);
  };

  const handleStartFresh = () => {
    setShowResumePrompt(false);
    track("session_start", { fresh: true, hadResumeData: true });
  };

  const handleReset = () => {
    if (confirm("?בטוחים שרוצים להתחיל מחדש? כל הנתונים יימחקו")) {
      track("session_reset");
      reset();
      setShowReset(false);
    }
  };

  // Show phone gate for new token visits
  if (pendingToken && !phoneVerified) {
    return (
      <main className="min-h-dvh gradient-hero relative">
        <div className="fixed top-4 left-4 z-50">
          <ThemeToggle />
        </div>
        <div className="flex items-center justify-center min-h-dvh px-4 py-16">
          <PhoneGate
            eventId={pendingToken}
            onVerified={handlePhoneVerified}
          />
        </div>
      </main>
    );
  }

  const stageKey = !event ? "setup" : `stage-${currentStage}`;

  const renderStage = () => {
    if (!event) return <EventSetup />;
    switch (currentStage) {
      case 0: return <EventSetup />;
      case 1: return <QuestionFlow />;
      case 2: return <SongTinder />;
      case 3: return <DreamsRequests />;
      case 4: return <MusicBrief />;
      default: return <EventSetup />;
    }
  };

  return (
    <main className="min-h-dvh gradient-hero relative">
      {/* Top Controls */}
      <div className="fixed top-4 left-4 z-50 flex items-center gap-2">
        <ThemeToggle />
        {event && (
          <button
            onClick={() => setShowReset(!showReset)}
            className="glass-card p-2 rounded-full transition-all hover:scale-110 active:scale-95"
            aria-label="התחל מחדש"
          >
            <RotateCcw className="w-5 h-5 text-muted" />
          </button>
        )}
      </div>

      {/* Reset Confirmation */}
      <AnimatePresence>
        {showReset && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-16 left-4 z-50 glass-card p-3 rounded-xl text-sm"
          >
            <p className="text-xs text-secondary mb-2">?להתחיל מחדש</p>
            <div className="flex gap-2">
              <button onClick={handleReset} className="text-xs px-3 py-1 rounded-lg text-white" style={{ background: "var(--accent-danger)" }}>
                כן, מחק הכל
              </button>
              <button onClick={() => setShowReset(false)} className="text-xs px-3 py-1 rounded-lg border border-glass text-muted">
                ביטול
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Resume Prompt */}
      <AnimatePresence>
        {showResumePrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="glass-card p-6 max-w-sm w-full text-center"
            >
              <h3 className="text-lg font-bold mb-2">!שמחים שחזרתם</h3>
              <p className="text-sm text-secondary mb-4">
                מצאנו התקדמות קודמת. רוצים להמשיך מאיפה שעצרתם?
              </p>
              <div className="flex gap-3">
                <button onClick={handleResume} className="btn-primary flex-1 text-sm">
                  המשיכו מאיפה שעצרתי
                </button>
                <button onClick={handleStartFresh} className="btn-secondary flex-1 text-sm">
                  התחלה מחדש
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stage Navigation */}
      {event && currentStage > 0 && currentStage <= 4 && (
        <div className="fixed top-4 right-4 left-28 z-40">
          <StageNav />
        </div>
      )}

      {/* Stage Content with transitions */}
      <div className="flex items-center justify-center min-h-dvh px-4 py-16">
        <AnimatePresence mode="wait">
          <motion.div
            key={stageKey}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="w-full"
          >
            <ErrorBoundary>
              {renderStage()}
            </ErrorBoundary>
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  );
}

export default function Home() {
  return (
    <HydrationGuard>
      <JourneyApp />
    </HydrationGuard>
  );
}
