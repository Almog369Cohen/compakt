"use client";

import { create } from "zustand";
import type { Locale } from "./types";
import { DEFAULT_LOCALE } from "./types";

const STORAGE_KEY = "compakt-locale";

interface LocaleState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

export const useLocaleStore = create<LocaleState>((set) => ({
  locale: DEFAULT_LOCALE,
  setLocale: (locale: Locale) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, locale);
    }
    set({ locale });
  },
}))
