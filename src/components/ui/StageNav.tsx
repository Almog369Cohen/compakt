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
    <div className="flex items-center gap-1.5 sm:gap-2 justify-center">
      {stages.map((stage, i) => {
        const isCurrent = currentStage === stage.id;
        const isDone = currentStage > stage.id;
        const isFuture = currentStage < stage.id;

        return (
          <div key={stage.id} className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => {
                if (!isFuture) setStage(stage.id);
              }}
              disabled={isFuture}
              className={`text-[11px] sm:text-xs font-medium px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full transition-all flex items-center gap-1 ${isCurrent
                  ? "bg-brand-blue text-white shadow-sm"
                  : isDone
                    ? "bg-brand-green/20 text-brand-green cursor-pointer"
                    : "glass-card text-muted opacity-60 cursor-default"
                }`}
            >
              {isDone && <Check className="w-3 h-3" />}
              {stage.label}
            </button>
            {i < stages.length - 1 && (
              <div
                className="w-4 sm:w-6 h-0.5 rounded-full flex-shrink-0"
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
  );
}
