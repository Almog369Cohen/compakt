"use client";

import { useEventStore } from "@/stores/eventStore";

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
    <div className="flex items-center gap-2 justify-center">
      {stages.map((stage, i) => (
        <div key={stage.id} className="flex items-center gap-2">
          <button
            onClick={() => setStage(stage.id)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full transition-all ${
              currentStage === stage.id
                ? "bg-brand-blue text-white"
                : currentStage > stage.id
                ? "bg-brand-green/20 text-brand-green"
                : "glass-card text-muted"
            }`}
          >
            {stage.label}
          </button>
          {i < stages.length - 1 && (
            <div
              className="w-6 h-0.5 rounded-full"
              style={{
                background:
                  currentStage > stage.id
                    ? "var(--accent-secondary)"
                    : "var(--glass-border)",
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}
