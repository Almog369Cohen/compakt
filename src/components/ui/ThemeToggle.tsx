"use client";

import { useEventStore } from "@/stores/eventStore";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const theme = useEventStore((s) => s.theme);
  const setTheme = useEventStore((s) => s.setTheme);

  return (
    <button
      onClick={() => setTheme(theme === "night" ? "day" : "night")}
      className="glass-card p-2 rounded-full transition-all hover:scale-110 active:scale-95"
      aria-label={theme === "night" ? "עבור לתצוגת יום" : "עבור לתצוגת לילה"}
    >
      {theme === "night" ? (
        <Sun className="w-5 h-5 text-accent-gold" style={{ color: "var(--accent-gold)" }} />
      ) : (
        <Moon className="w-5 h-5 text-brand-blue" />
      )}
    </button>
  );
}
