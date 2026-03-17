"use client";

import { useLocaleStore, LOCALE_CONFIG } from "@/lib/i18n";
import { Globe } from "lucide-react";
import type { Locale } from "@/lib/i18n";

interface LanguageSwitcherProps {
  variant?: "full" | "compact" | "icon";
  className?: string;
}

export function LanguageSwitcher({ variant = "full", className = "" }: LanguageSwitcherProps) {
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);

  const toggle = () => {
    const next: Locale = locale === "he" ? "en" : "he";
    setLocale(next);
  };

  const otherLocale = locale === "he" ? "en" : "he";
  const otherLabel = LOCALE_CONFIG[otherLocale].nativeLabel;

  if (variant === "icon") {
    return (
      <button
        onClick={toggle}
        className={`p-2 rounded-lg text-muted hover:text-foreground transition-colors ${className}`}
        aria-label={`Switch to ${otherLabel}`}
        title={otherLabel}
      >
        <Globe className="w-4 h-4" />
      </button>
    );
  }

  if (variant === "compact") {
    return (
      <button
        onClick={toggle}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold border-2 border-[#059cc0] text-[#059cc0] hover:bg-[#059cc0] hover:text-white transition-all ${className}`}
        aria-label={`Switch to ${otherLabel}`}
      >
        <Globe className="w-4 h-4" />
        <span>{otherLabel}</span>
      </button>
    );
  }

  // variant === "full"
  return (
    <button
      onClick={toggle}
      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border border-gray-200 hover:border-[#059cc0] hover:text-[#059cc0] transition-all ${className}`}
      aria-label={`Switch to ${otherLabel}`}
    >
      <Globe className="w-4 h-4" />
      <span className="font-medium">{LOCALE_CONFIG[locale].nativeLabel}</span>
      <span className="text-muted">|</span>
      <span>{otherLabel}</span>
    </button>
  );
}
