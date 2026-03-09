"use client";

import { useEventStore } from "@/stores/eventStore";
import { useAdminStore } from "@/stores/adminStore";
import { EventSetup } from "@/components/stages/EventSetup";
import { QuestionFlow } from "@/components/stages/QuestionFlow";
import { SongTinder } from "@/components/stages/SongTinder";
import { DreamsRequests } from "@/components/stages/DreamsRequests";
import { MusicBrief } from "@/components/stages/MusicBrief";
import { EmailGate } from "@/components/auth/PhoneGate";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { StageNav } from "@/components/ui/StageNav";
import { HydrationGuard } from "@/components/ui/HydrationGuard";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useEffect, useState, useRef, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { RotateCcw } from "lucide-react";
import { supabase } from "@/lib/supabase";

type RawResumeAnswer = {
  id: string;
  event_id: string;
  question_id: string;
  answer_value: string | null;
  created_at?: string;
  updated_at?: string;
};

type RawResumeSwipe = {
  id: string;
  event_id: string;
  song_id: string;
  action: "like" | "dislike" | "super_like" | "unsure";
  reason_chips: string | string[] | null;
  created_at?: string;
  updated_at?: string;
};

type RawResumeRequest = {
  id: string;
  event_id: string;
  request_type: "free_text" | "do" | "dont" | "link" | "special_moment";
  content: string;
  moment_type?: "ceremony" | "glass_break" | "first_dance" | "entrance" | "parents" | "other" | null;
  created_at?: string;
};

type RawResumeData = {
  answers: Record<string, unknown>[];
  swipes: Record<string, unknown>[];
  requests: Record<string, unknown>[];
  currentStage: number;
};

function parseMaybeJson(value: string | null): string | string[] | number | "" {
  if (!value) return "";
  try {
    return JSON.parse(value) as string | string[] | number;
  } catch {
    return value;
  }
}

function restoreResumeData(resumeData: RawResumeData) {
  useEventStore.setState({
    answers: resumeData.answers.map((answer) => {
      const raw = answer as unknown as RawResumeAnswer;
      return {
        id: raw.id,
        eventId: raw.event_id,
        questionId: raw.question_id,
        answerValue: parseMaybeJson(raw.answer_value),
        answeredAt: raw.updated_at || raw.created_at || new Date().toISOString(),
      };
    }),
    swipes: resumeData.swipes.map((swipe) => {
      const raw = swipe as unknown as RawResumeSwipe;
      return {
        id: raw.id,
        eventId: raw.event_id,
        songId: raw.song_id,
        action: raw.action,
        reasonChips: Array.isArray(raw.reason_chips)
          ? raw.reason_chips
          : raw.reason_chips
            ? ((() => {
              try {
                const parsed = JSON.parse(raw.reason_chips);
                return Array.isArray(parsed) ? parsed : [];
              } catch {
                return [];
              }
            })())
            : [],
        swipedAt: raw.updated_at || raw.created_at || new Date().toISOString(),
      };
    }),
    requests: resumeData.requests.map((request) => {
      const raw = request as unknown as RawResumeRequest;
      return {
        id: raw.id,
        eventId: raw.event_id,
        requestType: raw.request_type,
        content: raw.content,
        momentType: raw.moment_type || undefined,
        createdAt: raw.created_at || new Date().toISOString(),
      };
    }),
  });
}

function JourneyApp() {
  const event = useEventStore((s) => s.event);
  const theme = useEventStore((s) => s.theme);
  const loadEvent = useEventStore((s) => s.loadEvent);
  const setStage = useEventStore((s) => s.setStage);
  const reset = useEventStore((s) => s.reset);
  const loadContentFromDB = useAdminStore((s) => s.loadContentFromDB);
  const currentStage = event?.currentStage ?? 0;
  const [showReset, setShowReset] = useState(false);
  const [showReturnGate, setShowReturnGate] = useState(false);

  // Couple auth state
  const [pendingToken, setPendingToken] = useState<string | null>(null);
  const [emailVerified, setEmailVerified] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const resumeDataRef = useRef<RawResumeData | null>(null);

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
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    if (hashParams.get("type") === "recovery") {
      const target = new URL(`${window.location.origin}/admin`);
      target.searchParams.set("reset", "1");
      window.location.replace(`${target.toString()}${window.location.hash}`);
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const dj = params.get("dj");

    // Load DJ-specific content for couples (songs/questions/upsells)
    // Persist chosen DJ context across refreshes
    const storedDjProfileId = sessionStorage.getItem("compakt_dj_profile_id");
    const storedDjSlug = sessionStorage.getItem("compakt_dj_slug");
    const djToResolve = dj || storedDjSlug;

    const sb = supabase;
    const loadEventContext = async (eventToken: string) => {
      if (!sb) return;

      const { data } = await sb
        .from("events")
        .select("id, magic_token, token, event_type, couple_name_a, couple_name_b, event_date, venue, current_stage, created_at, dj_id")
        .eq("magic_token", eventToken)
        .maybeSingle();

      if (!data) return;

      useEventStore.setState((state) => ({
        ...state,
        event: {
          id: data.id,
          magicToken: data.magic_token,
          eventNumber: data.token,
          eventType: data.event_type,
          coupleNameA: data.couple_name_a,
          coupleNameB: data.couple_name_b,
          eventDate: data.event_date,
          venue: data.venue,
          currentStage: data.current_stage ?? 0,
          theme: state.theme,
          createdAt: data.created_at,
        },
      }));

      if (data.dj_id) {
        sessionStorage.setItem("compakt_dj_profile_id", data.dj_id);
        await loadContentFromDB(data.dj_id);
      }
    };

    if (djToResolve && sb) {
      const maybeUseStored = async () => {
        if (storedDjProfileId && !dj) {
          await loadContentFromDB(storedDjProfileId);
          return;
        }

        const { data } = await sb
          .from("profiles")
          .select("id, dj_slug")
          .eq("dj_slug", djToResolve)
          .maybeSingle();

        if (data?.id) {
          sessionStorage.setItem("compakt_dj_profile_id", data.id);
          sessionStorage.setItem("compakt_dj_slug", data.dj_slug || djToResolve);
          await loadContentFromDB(data.id);
        }
      };

      maybeUseStored().catch(() => { });
    }

    if (token) {
      loadEventContext(token).catch(() => { });

      // Check if already verified for this token (stored in sessionStorage)
      const stored = sessionStorage.getItem(`compakt_session_${token}`);
      if (stored) {
        // Already verified — load event directly
        loadEvent(token);
        setEmailVerified(true);
        setSessionId(stored);
        track("link_open", { returning: true });
      } else {
        // New visit — show phone gate
        setPendingToken(token);
        track("link_open", { returning: false });
      }

      // Clean URL params after capture
      window.history.replaceState({}, "", window.location.pathname);
      return;
    }

    if (dj) {
      // Clean ?dj after capture to keep share URLs tidy
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [loadEvent, track, loadContentFromDB]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const handleEmailVerified = useCallback((data: {
    sessionId: string;
    email: string;
    eventKey: string;
    resumeData: RawResumeData | null;
  }) => {
    const resolvedEventKey = data.eventKey || pendingToken;

    setSessionId(data.sessionId);
    setEmailVerified(true);
    setShowReturnGate(false);
    track("email_verified", { emailDomain: data.email.includes("@") ? data.email.split("@")[1] : undefined });

    // Store session for page refreshes
    if (resolvedEventKey) {
      sessionStorage.setItem(`compakt_session_${resolvedEventKey}`, data.sessionId);
      loadEvent(resolvedEventKey);
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
      restoreResumeData(resumeDataRef.current);
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

  if (pendingToken && !emailVerified) {
    return (
      <main className="min-h-dvh gradient-hero relative">
        <div className="fixed top-4 left-4 z-50">
          <ThemeToggle />
        </div>
        <div className="flex items-center justify-center min-h-dvh px-4 py-16">
          <EmailGate
            eventId={pendingToken}
            onVerified={handleEmailVerified}
          />
        </div>
      </main>
    );
  }

  if (!event && showReturnGate) {
    return (
      <main className="min-h-dvh gradient-hero relative">
        <div className="fixed top-4 left-4 z-50">
          <ThemeToggle />
        </div>
        <div className="flex items-center justify-center min-h-dvh px-4 py-16">
          <div className="w-full max-w-sm space-y-4">
            <EmailGate onVerified={handleEmailVerified} />
            <div className="text-center">
              <button
                onClick={() => setShowReturnGate(false)}
                className="text-xs text-muted hover:text-brand-blue transition-colors"
              >
                חזרה לפתיחת אירוע חדש
              </button>
            </div>
          </div>
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
              {!event && (
                <div className="mt-4 text-center">
                  <button
                    onClick={() => setShowReturnGate(true)}
                    className="text-sm text-brand-blue hover:underline"
                  >
                    יש לכם כבר מספר אירוע? חזרו לערוך כאן
                  </button>
                </div>
              )}
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
