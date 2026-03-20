/**
 * Single source of truth for plan definitions and pricing.
 * All UI, API, and store code should import from here.
 */
import type { PlanKey } from "@/lib/access";

export interface PlanDefinition {
  key: PlanKey;
  name: string;
  nameHe: string;
  price: number;
  currency: string;
  interval: "month" | "year";
  description: string;
  features: string[];
  limits: {
    events: number | null; // null = unlimited
    songs: number | null;
    questions: number | null;
  };
  popular?: boolean;
  trial?: boolean;
  cta: string;
}

export const PLANS: PlanDefinition[] = [
  {
    key: "starter",
    name: "Starter",
    nameHe: "חינם",
    price: 0,
    currency: "₪",
    interval: "month",
    description: "מושלם להתחלה",
    features: [
      "1 אירוע פעיל",
      "עד 30 שירים",
      "עד 10 שאלות",
      "פרופיל בסיסי",
    ],
    limits: { events: 1, songs: 30, questions: 10 },
    trial: false,
    cta: "התחילו בחינם",
  },
  {
    key: "pro",
    name: "Pro",
    nameHe: "פרו",
    price: 99,
    currency: "₪",
    interval: "month",
    description: "לדיג׳יים מקצועיים",
    features: [
      "7 ימי ניסיון חינם",
      "5 אירועים פעילים",
      "שירים ללא הגבלה",
      "שאלות ללא הגבלה",
      "Google Calendar sync",
      "Analytics מתקדם",
      "העלאת תמונות",
      "Upsells לזוגות",
    ],
    limits: { events: 5, songs: null, questions: null },
    popular: true,
    trial: true,
    cta: "נסו חינם 7 ימים",
  },
  {
    key: "premium",
    name: "Premium",
    nameHe: "פרימיום",
    price: 149,
    currency: "₪",
    interval: "month",
    description: "לדיג׳יים מובילים",
    features: [
      "7 ימי ניסיון חינם",
      "אירועים ללא הגבלה",
      "כל פיצ׳רי Pro",
      "Spotify Import",
      "Custom Branding",
      "שאלונים מותאמים אישית",
      "עדיפות בתמיכה",
    ],
    limits: { events: null, songs: null, questions: null },
    trial: true,
    cta: "נסו חינם 7 ימים",
  },
  {
    key: "enterprise",
    name: "Enterprise",
    nameHe: "עסקי",
    price: 249,
    currency: "₪",
    interval: "month",
    description: "לחברות ואולמות",
    features: [
      "7 ימי ניסיון חינם",
      "כל פיצ׳רי Premium",
      "Team access",
      "API access",
      "Dedicated support",
      "Custom integrations",
    ],
    limits: { events: null, songs: null, questions: null },
    trial: true,
    cta: "נסו חינם 7 ימים",
  },
];

/** Get a plan by key */
export function getPlan(key: PlanKey): PlanDefinition | undefined {
  return PLANS.find((p) => p.key === key);
}

/** Get formatted price string, e.g. "₪99" */
export function formatPrice(key: PlanKey): string {
  const plan = getPlan(key);
  if (!plan) return "";
  if (plan.price === 0) return "חינם";
  return `${plan.currency}${plan.price}`;
}

/** Get price as number for API/payment use */
export function getPriceAmount(key: PlanKey): number | null {
  const plan = getPlan(key);
  return plan ? plan.price : null;
}

/** Map of plan keys to numeric prices (for backward compat) */
export const PLAN_PRICES: Record<string, number> = Object.fromEntries(
  PLANS.filter((p) => p.price > 0).map((p) => [p.key, p.price])
);
