"use client";

import { useCallback } from "react";
import { useLocaleStore } from "./store";
import type { Locale } from "./types";

// Translation dictionaries are loaded lazily per namespace
const cache: Record<string, Record<Locale, Record<string, unknown>>> = {};

// Eagerly import all locale files at build time
// Hebrew
import heCommon from "@/locales/he/common.json";
import heMarketing from "@/locales/he/marketing.json";
import heAdmin from "@/locales/he/admin.json";
import heCouple from "@/locales/he/couple.json";

// English
import enCommon from "@/locales/en/common.json";
import enMarketing from "@/locales/en/marketing.json";
import enAdmin from "@/locales/en/admin.json";
import enCouple from "@/locales/en/couple.json";

cache["common"] = { he: heCommon, en: enCommon };
cache["marketing"] = { he: heMarketing, en: enMarketing };
cache["admin"] = { he: heAdmin, en: enAdmin };
cache["couple"] = { he: heCouple, en: enCouple };

export type Namespace = "common" | "marketing" | "admin" | "couple";

/**
 * Returns a `t(key)` function that resolves the current locale string.
 * Supports dot-notation: t("hero.title")
 * Falls back: en → he → key itself.
 */
export function useTranslation(ns: Namespace = "common") {
  const locale = useLocaleStore((s) => s.locale);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const dict = cache[ns]?.[locale] ?? {};
      const fallbackDict = cache[ns]?.["he"] ?? {};

      // Support dot-notation for nested keys
      let value = resolve(dict, key) ?? resolve(fallbackDict, key) ?? key;

      // Parameter interpolation: {{name}} → value
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          value = value.replace(new RegExp(`\\{\\{${k}\\}\\}`, "g"), String(v));
        });
      }

      return value;
    },
    [locale, ns]
  );

  return { t, locale };
}

function resolve(obj: Record<string, unknown>, path: string): string | undefined {
  const parts = path.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === "string" ? current : undefined;
}
