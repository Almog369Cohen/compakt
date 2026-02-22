"use client";

import { useEventStore } from "@/stores/eventStore";
import { EventSetup } from "@/components/stages/EventSetup";
import { QuestionFlow } from "@/components/stages/QuestionFlow";
import { SongTinder } from "@/components/stages/SongTinder";
import { DreamsRequests } from "@/components/stages/DreamsRequests";
import { MusicBrief } from "@/components/stages/MusicBrief";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { StageNav } from "@/components/ui/StageNav";
import { useEffect } from "react";

export default function Home() {
  const event = useEventStore((s) => s.event);
  const theme = useEventStore((s) => s.theme);
  const currentStage = event?.currentStage ?? 0;

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const renderStage = () => {
    if (!event) return <EventSetup />;

    switch (currentStage) {
      case 0:
        return <EventSetup />;
      case 1:
        return <QuestionFlow />;
      case 2:
        return <SongTinder />;
      case 3:
        return <DreamsRequests />;
      case 4:
        return <MusicBrief />;
      default:
        return <EventSetup />;
    }
  };

  return (
    <main className="min-h-dvh gradient-hero relative">
      <div className="fixed top-4 left-4 z-50">
        <ThemeToggle />
      </div>

      {event && currentStage > 0 && currentStage < 4 && (
        <div className="fixed top-4 right-4 left-16 z-40">
          <StageNav />
        </div>
      )}

      <div className="flex items-center justify-center min-h-dvh px-4 py-16">
        {renderStage()}
      </div>
    </main>
  );
}
