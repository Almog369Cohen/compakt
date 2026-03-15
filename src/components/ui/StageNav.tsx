"use client";

import { useEventStore } from "@/stores/eventStore";
import { Check } from "lucide-react";

const stages = [
  { id: 1, label: "שאלות" },
  { id: 2, label: "שירים" },
  { id: 3, label: "בקשות" },
  { id: 4, label: "סיכום" },
];

export function StageNav() {
  const event = useEventStore((s) => s.event);
  const setStage = useEventStore((s) => s.setStage);
  const currentStage = event?.currentStage ?? 0;

  return (
    <div className="rounded-[20px] border border-white/10 bg-black/25 px-2.5 py-2 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.16)] sm:px-3">
      <div className="flex items-center justify-center gap-1 sm:gap-2 overflow-x-auto scrollbar-hide">
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
                className={`min-h-[36px] whitespace-nowrap text-[11px] sm:text-xs font-medium px-2.5 sm:px-3 py-1.5 rounded-full transition-all flex items-center gap-1 border ${isCurrent
                  ? "text-white shadow-sm"
                  : isDone
                    ? "text-brand-green cursor-pointer"
                    : "text-muted opacity-60 cursor-default"
                  }`}
                style={{
                  background: isCurrent
                    ? "linear-gradient(135deg, rgba(5,156,192,0.9), rgba(3,178,140,0.9))"
                    : isDone
                      ? "rgba(3,178,140,0.12)"
                      : "rgba(255,255,255,0.04)",
                  borderColor: isCurrent
                    ? "rgba(255,255,255,0.12)"
                    : isDone
                      ? "rgba(3,178,140,0.22)"
                      : "rgba(255,255,255,0.08)",
                }}
              >
                {isDone && <Check className="w-3 h-3" />}
                {stage.label}
              </button>
              {i < stages.length - 1 && (
                <div
                  className="h-0.5 w-3 sm:w-5 rounded-full flex-shrink-0"
                  style={{
                    background: isDone
                      ? "var(--accent-secondary)"
                      : "var(--glass-border)",
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
