"use client";

import { useEventStore } from "@/stores/eventStore";
import { Check, MessageSquare, Music, ListChecks, FileCheck } from "lucide-react";

const stages = [
  { id: 1, label: "שאלות", icon: MessageSquare, description: "מענה על שאלות" },
  { id: 2, label: "שירים", icon: Music, description: "בחירת שירים" },
  { id: 3, label: "בקשות", icon: ListChecks, description: "בקשות מיוחדות" },
  { id: 4, label: "סיכום", icon: FileCheck, description: "סיכום סופי" },
];

export function StageNav() {
  const event = useEventStore((s) => s.event);
  const setStage = useEventStore((s) => s.setStage);
  const currentStage = event?.currentStage ?? 0;

  return (
    <div className="rounded-[20px] border border-white/10 bg-black/25 px-3 py-3 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.16)] sm:px-4">
      <div className="flex items-center justify-center gap-2 sm:gap-3 overflow-x-auto scrollbar-hide">
        {event?.eventNumber && (
          <span className="text-[10px] font-mono text-brand-blue/70 px-1.5 py-0.5 rounded-md bg-brand-blue/[0.06] border border-brand-blue/10 flex-shrink-0 hidden sm:inline" dir="ltr">
            #{event.eventNumber}
          </span>
        )}
        {stages.map((stage, i) => {
          const isCurrent = currentStage === stage.id;
          const isDone = currentStage > stage.id;
          const isFuture = currentStage < stage.id;

          return (
            <div key={stage.id} className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              <button
                onClick={() => {
                  if (!isFuture) setStage(stage.id);
                }}
                disabled={isFuture}
                className={`min-h-[44px] sm:min-h-[48px] whitespace-nowrap text-sm sm:text-base font-semibold px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl transition-all flex flex-col sm:flex-row items-center gap-1.5 sm:gap-2 border min-w-[80px] sm:min-w-[100px] ${isCurrent
                  ? "text-white shadow-lg scale-105"
                  : isDone
                    ? "text-brand-green cursor-pointer hover:scale-105"
                    : "text-muted opacity-50 cursor-not-allowed"
                  }`}
                style={{
                  background: isCurrent
                    ? "linear-gradient(135deg, rgba(5,156,192,0.95), rgba(3,178,140,0.95))"
                    : isDone
                      ? "rgba(3,178,140,0.15)"
                      : "rgba(255,255,255,0.05)",
                  borderColor: isCurrent
                    ? "rgba(255,255,255,0.2)"
                    : isDone
                      ? "rgba(3,178,140,0.3)"
                      : "rgba(255,255,255,0.1)",
                }}
              >
                <div className="flex items-center gap-1.5">
                  {isDone ? (
                    <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                  ) : (
                    <stage.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${isCurrent ? 'animate-pulse' : ''}`} />
                  )}
                  <span className="hidden sm:inline">{stage.label}</span>
                </div>
                <span className="sm:hidden text-xs font-medium">{stage.label}</span>
                {isCurrent && (
                  <span className="hidden sm:block text-[10px] opacity-80 font-normal">{stage.description}</span>
                )}
              </button>
              {i < stages.length - 1 && (
                <div
                  className="h-1 w-4 sm:w-6 rounded-full flex-shrink-0 transition-all"
                  style={{
                    background: isDone
                      ? "linear-gradient(90deg, rgba(3,178,140,0.8), rgba(3,178,140,0.3))"
                      : "rgba(255,255,255,0.1)",
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
