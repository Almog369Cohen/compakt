"use client";

import { useEffect, useState } from "react";
import { useLocaleStore } from "@/lib/i18n";
import { LOCALE_CONFIG, DEFAULT_LOCALE, type Locale } from "@/lib/i18n/types";

const STORAGE_KEY = "compakt-locale";

function getInitialLocale(): Locale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;

  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === "he" || saved === "en") return saved;

  const browserLang = navigator.language?.split("-")[0];
  if (browserLang === "en") return "en";

  return DEFAULT_LOCALE;
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const initial = getInitialLocale();
    if (initial !== locale) {
      setLocale(initial);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const { dir } = LOCALE_CONFIG[locale];
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
  }, [locale, hydrated]);

  return <>{children}</>;
}
