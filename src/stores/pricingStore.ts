import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase } from "@/lib/supabase";
import type { PlanKey } from "@/lib/access";

export interface Plan {
  key: PlanKey;
  name: string;
  price: number;
  currency: string;
  interval: "month" | "year";
  features: string[];
  limits: {
    events: number | null; // null = unlimited
    songs: number | null;
    questions: number | null;
  };
  popular?: boolean;
}

export const PLANS: Plan[] = [
  {
    key: "starter",
    name: "Starter",
    price: 0,
    currency: "₪",
    interval: "month",
    features: [
      "1 אירוע פעיל",
      "עד 30 שירים",
      "עד 10 שאלות",
      "פרופיל בסיסי",
    ],
    limits: {
      events: 1,
      songs: 30,
      questions: 10,
    },
  },
  {
    key: "pro",
    name: "Pro",
    price: 99,
    currency: "₪",
    interval: "month",
    features: [
      "5 אירועים פעילים",
      "שירים ללא הגבלה",
      "שאלות ללא הגבלה",
      "Google Calendar sync",
      "Analytics מתקדם",
      "העלאת תמונות",
      "Upsells לזוגות",
    ],
    limits: {
      events: 5,
      songs: null,
      questions: null,
    },
    popular: true,
  },
  {
    key: "premium",
    name: "Premium",
    price: 199,
    currency: "₪",
    interval: "month",
    features: [
      "אירועים ללא הגבלה",
      "שירים ללא הגבלה",
      "שאלות ללא הגבלה",
      "Spotify Import",
      "Google Calendar sync",
      "Custom Branding",
      "Analytics מתקדם",
      "העלאת תמונות",
      "Upsells לזוגות",
      "עדיפות בתמיכה",
    ],
    limits: {
      events: null,
      songs: null,
      questions: null,
    },
  },
];

interface PricingState {
  // Current state
  currentPlan: PlanKey;
  trialActive: boolean;
  trialEndsAt: string | null;
  trialStartedAt: string | null;
  discountCode: string | null;
  discountExpiresAt: string | null;
  
  // Computed
  trialDaysLeft: number;
  isTrialExpired: boolean;
  hasActiveDiscount: boolean;
  
  // Actions
  setCurrentPlan: (plan: PlanKey) => void;
  setTrialInfo: (info: {
    active: boolean;
    endsAt: string | null;
    startedAt: string | null;
  }) => void;
  setDiscountInfo: (info: {
    code: string | null;
    expiresAt: string | null;
  }) => void;
  calculateTrialDaysLeft: () => number;
  upgradePlan: (plan: PlanKey, profileId: string) => Promise<{ success: boolean; error?: string }>;
  startTrial: (profileId: string, durationDays?: number) => Promise<{ success: boolean; error?: string }>;
  applyDiscount: (code: string, profileId: string) => Promise<{ success: boolean; error?: string }>;
  cancelTrial: (profileId: string) => Promise<{ success: boolean; error?: string }>;
  loadPricingInfo: (profileId: string) => Promise<void>;
}

export const usePricingStore = create<PricingState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentPlan: "starter",
      trialActive: false,
      trialEndsAt: null,
      trialStartedAt: null,
      discountCode: null,
      discountExpiresAt: null,
      trialDaysLeft: 0,
      isTrialExpired: false,
      hasActiveDiscount: false,

      setCurrentPlan: (plan: PlanKey) => {
        set({ currentPlan: plan });
      },

      setTrialInfo: (info) => {
        const daysLeft = info.endsAt ? get().calculateTrialDaysLeft() : 0;
        const isExpired = info.endsAt ? new Date(info.endsAt) < new Date() : false;
        
        set({
          trialActive: info.active && !isExpired,
          trialEndsAt: info.endsAt,
          trialStartedAt: info.startedAt,
          trialDaysLeft: daysLeft,
          isTrialExpired: isExpired,
        });
      },

      setDiscountInfo: (info) => {
        const hasActive = info.code && info.expiresAt 
          ? new Date(info.expiresAt) > new Date() 
          : false;
        
        set({
          discountCode: info.code,
          discountExpiresAt: info.expiresAt,
          hasActiveDiscount: hasActive,
        });
      },

      calculateTrialDaysLeft: () => {
        const { trialEndsAt } = get();
        if (!trialEndsAt) return 0;
        
        const now = new Date();
        const endsAt = new Date(trialEndsAt);
        const diffTime = endsAt.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return Math.max(0, diffDays);
      },

      upgradePlan: async (plan: PlanKey, profileId: string) => {
        if (!supabase) {
          return { success: false, error: "Supabase not initialized" };
        }

        try {
          const { error } = await supabase
            .from("profiles")
            .update({ 
              plan,
              updated_at: new Date().toISOString(),
            })
            .eq("id", profileId);

          if (error) throw error;

          set({ currentPlan: plan });
          return { success: true };
        } catch (error) {
          console.error("Failed to upgrade plan:", error);
          return { 
            success: false, 
            error: error instanceof Error ? error.message : "Failed to upgrade plan" 
          };
        }
      },

      startTrial: async (profileId: string, durationDays = 30) => {
        if (!supabase) {
          return { success: false, error: "Supabase not initialized" };
        }

        try {
          const now = new Date();
          const endsAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

          const { error } = await supabase
            .from("profiles")
            .update({
              plan: "premium",
              trial_started_at: now.toISOString(),
              trial_ends_at: endsAt.toISOString(),
              updated_at: now.toISOString(),
            })
            .eq("id", profileId);

          if (error) throw error;

          set({
            currentPlan: "premium",
            trialActive: true,
            trialStartedAt: now.toISOString(),
            trialEndsAt: endsAt.toISOString(),
            trialDaysLeft: durationDays,
            isTrialExpired: false,
          });

          return { success: true };
        } catch (error) {
          console.error("Failed to start trial:", error);
          return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to start trial",
          };
        }
      },

      applyDiscount: async (code: string, profileId: string) => {
        if (!supabase) {
          return { success: false, error: "Supabase not initialized" };
        }

        try {
          // For now, just save the code - validation can be added later
          const expiresAt = new Date();
          expiresAt.setMonth(expiresAt.getMonth() + 2); // 2 months validity

          const { error } = await supabase
            .from("profiles")
            .update({
              discount_code: code,
              discount_expires_at: expiresAt.toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", profileId);

          if (error) throw error;

          set({
            discountCode: code,
            discountExpiresAt: expiresAt.toISOString(),
            hasActiveDiscount: true,
          });

          return { success: true };
        } catch (error) {
          console.error("Failed to apply discount:", error);
          return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to apply discount",
          };
        }
      },

      cancelTrial: async (profileId: string) => {
        if (!supabase) {
          return { success: false, error: "Supabase not initialized" };
        }

        try {
          const { error } = await supabase
            .from("profiles")
            .update({
              plan: "starter",
              trial_ends_at: null,
              trial_started_at: null,
              updated_at: new Date().toISOString(),
            })
            .eq("id", profileId);

          if (error) throw error;

          set({
            currentPlan: "starter",
            trialActive: false,
            trialEndsAt: null,
            trialStartedAt: null,
            trialDaysLeft: 0,
            isTrialExpired: false,
          });

          return { success: true };
        } catch (error) {
          console.error("Failed to cancel trial:", error);
          return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to cancel trial",
          };
        }
      },

      loadPricingInfo: async (profileId: string) => {
        if (!supabase) return;

        try {
          const { data, error } = await supabase
            .from("profiles")
            .select("plan, trial_started_at, trial_ends_at, discount_code, discount_expires_at")
            .eq("id", profileId)
            .single();

          if (error || !data) return;

          const plan = data.plan as PlanKey;
          const trialEndsAt = data.trial_ends_at;
          const trialStartedAt = data.trial_started_at;
          const isTrialActive = trialEndsAt && new Date(trialEndsAt) > new Date();
          
          set({
            currentPlan: plan,
            trialActive: Boolean(isTrialActive),
            trialEndsAt,
            trialStartedAt,
            discountCode: data.discount_code,
            discountExpiresAt: data.discount_expires_at,
          });

          // Calculate derived values
          get().setTrialInfo({
            active: Boolean(isTrialActive),
            endsAt: trialEndsAt,
            startedAt: trialStartedAt,
          });

          get().setDiscountInfo({
            code: data.discount_code,
            expiresAt: data.discount_expires_at,
          });
        } catch (error) {
          console.error("Failed to load pricing info:", error);
        }
      },
    }),
    {
      name: "compakt-pricing-storage",
      partialize: (state) => ({
        currentPlan: state.currentPlan,
        trialActive: state.trialActive,
        trialEndsAt: state.trialEndsAt,
        trialStartedAt: state.trialStartedAt,
      }),
    }
  )
);

// Helper function to get plan by key
export function getPlanByKey(key: PlanKey): Plan | undefined {
  return PLANS.find((p) => p.key === key);
}

// Helper function to check if user is within limits
export function isWithinLimits(
  plan: PlanKey,
  usage: { events: number; songs: number; questions: number }
): { withinLimits: boolean; exceeded: string[] } {
  const planConfig = getPlanByKey(plan);
  if (!planConfig) return { withinLimits: true, exceeded: [] };

  const exceeded: string[] = [];

  if (planConfig.limits.events !== null && usage.events > planConfig.limits.events) {
    exceeded.push("events");
  }
  if (planConfig.limits.songs !== null && usage.songs > planConfig.limits.songs) {
    exceeded.push("songs");
  }
  if (planConfig.limits.questions !== null && usage.questions > planConfig.limits.questions) {
    exceeded.push("questions");
  }

  return {
    withinLimits: exceeded.length === 0,
    exceeded,
  };
}
