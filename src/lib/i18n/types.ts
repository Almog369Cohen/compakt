export type Locale = "he" | "en";

export type Direction = "rtl" | "ltr";

export const LOCALE_CONFIG: Record<Locale, { label: string; nativeLabel: string; dir: Direction }> = {
  he: { label: "Hebrew", nativeLabel: "עברית", dir: "rtl" },
  en: { label: "English", nativeLabel: "English", dir: "ltr" },
};

export const DEFAULT_LOCALE: Locale = "he";

export const SUPPORTED_LOCALES: Locale[] = ["he", "en"];
