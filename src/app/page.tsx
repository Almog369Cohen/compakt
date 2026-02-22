"use client";

import { useEventStore } from "@/stores/eventStore";
import { EventSetup } from "@/components/stages/EventSetup";
import { QuestionFlow } from "@/components/stages/QuestionFlow";
import { SongTinder } from "@/components/stages/SongTinder";
import { DreamsRequests } from "@/components/stages/DreamsRequests";
import { MusicBrief } from "@/components/stages/MusicBrief";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { StageNav } from "@/components/ui/StageNav";
import { HydrationGuard } from "@/components/ui/HydrationGuard";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { RotateCcw } from "lucide-react";

function JourneyApp() {
  const event = useEventStore((s) => s.event);
  const theme = useEventStore((s) => s.theme);
  const loadEvent = useEventStore((s) => s.loadEvent);
  const reset = useEventStore((s) => s.reset);
  const currentStage = event?.currentStage ?? 0;
  const [showReset, setShowReset] = useState(false);

  // Load event from magic link URL param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (token) {
      loadEvent(token);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [loadEvent]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const handleReset = () => {
    if (confirm("?בטוחים שרוצים להתחיל מחדש? כל הנתונים יימחקו")) {
      reset();
      setShowReset(false);
    }
  };

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
