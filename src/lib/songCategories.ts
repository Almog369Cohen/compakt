import type { SongCategory } from "@/lib/types";

export type SongCategoryLabels = Record<SongCategory, string>;

export const DEFAULT_SONG_CATEGORY_LABELS: SongCategoryLabels = {
  reception: "קבלת פנים",
  food: "אוכל",
  dancing: "רחבה",
  ceremony: "חופה",
};

export const SONG_CATEGORY_COLORS: Record<SongCategory, string> = {
  ceremony: "rgba(245,197,66,0.25)",
  dancing: "rgba(3,178,140,0.25)",
  food: "rgba(5,156,192,0.25)",
  reception: "rgba(168,85,247,0.25)",
};

export function normalizeSongCategoryLabels(value: unknown): SongCategoryLabels {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return DEFAULT_SONG_CATEGORY_LABELS;
  }

  const parsed = value as Partial<Record<SongCategory, unknown>>;

  return {
    reception:
      typeof parsed.reception === "string" && parsed.reception.trim()
        ? parsed.reception.trim()
        : DEFAULT_SONG_CATEGORY_LABELS.reception,
    food:
      typeof parsed.food === "string" && parsed.food.trim()
        ? parsed.food.trim()
        : DEFAULT_SONG_CATEGORY_LABELS.food,
    dancing:
      typeof parsed.dancing === "string" && parsed.dancing.trim()
        ? parsed.dancing.trim()
        : DEFAULT_SONG_CATEGORY_LABELS.dancing,
    ceremony:
      typeof parsed.ceremony === "string" && parsed.ceremony.trim()
        ? parsed.ceremony.trim()
        : DEFAULT_SONG_CATEGORY_LABELS.ceremony,
  };
}

export function getSongCategoryOptions(labels: SongCategoryLabels) {
  return [
    { value: "reception" as const, label: labels.reception },
    { value: "food" as const, label: labels.food },
    { value: "dancing" as const, label: labels.dancing },
    { value: "ceremony" as const, label: labels.ceremony },
  ];
}
