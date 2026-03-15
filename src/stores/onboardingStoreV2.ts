import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PlanKey } from "@/lib/access";

export type OnboardingStepV2 = 0 | 1 | 2 | 3 | 4 | 5;

interface OnboardingStateV2 {
  // State
  showPreOnboarding: boolean;
  showPlanSelector: boolean;
  currentStep: OnboardingStepV2;
  completedSteps: number[];
  skippedSteps: number[];
  onboardingComplete: boolean;

  // Plan selection
  selectedPlan: PlanKey;
  isTrialUser: boolean;

  // Payment
  paymentCompleted: boolean;
  skippedPayment: boolean;

  // Quick Start selections
  useQuickStartSongs: boolean;
  useQuickStartQuestions: boolean;

  // Upsell tracking
  hasSeenUpsells: {
    spotify: boolean;
    advancedQuestions: boolean;
    googleCalendar: boolean;
  };

  // Actions
  setShowPreOnboarding: (show: boolean) => void;
  setShowPlanSelector: (show: boolean) => void;
  selectPlan: (plan: PlanKey) => void;
  startOnboarding: () => void;
  setCurrentStep: (step: OnboardingStepV2) => void;
  completeStep: (step: number) => void;
  skipStep: (step: number) => void;
  skipOnboarding: () => void;
  finishOnboarding: () => void;
  resetOnboarding: () => void;
  setUseQuickStartSongs: (use: boolean) => void;
  setUseQuickStartQuestions: (use: boolean) => void;
  markUpsellSeen: (upsell: keyof OnboardingStateV2["hasSeenUpsells"]) => void;
  completePayment: () => void;
  skipPayment: () => void;
}

const initialState = {
  showPreOnboarding: true,
  showPlanSelector: false,
  currentStep: 0 as OnboardingStepV2,
  completedSteps: [],
  skippedSteps: [],
  onboardingComplete: false,
  selectedPlan: "premium" as PlanKey,
  isTrialUser: false,
  paymentCompleted: false,
  skippedPayment: false,
  useQuickStartSongs: true,
  useQuickStartQuestions: true,
  hasSeenUpsells: {
    spotify: false,
    advancedQuestions: false,
    googleCalendar: false,
  },
};

export const useOnboardingStoreV2 = create<OnboardingStateV2>()(
  persist(
    (set, get) => ({
      ...initialState,

      setShowPreOnboarding: (show: boolean) => {
        set({ showPreOnboarding: show });
      },

      setShowPlanSelector: (show: boolean) => {
        set({ showPlanSelector: show });
      },

      selectPlan: (plan: PlanKey) => {
        set({
          selectedPlan: plan,
          isTrialUser: plan === "premium",
          showPlanSelector: false,
        });
      },

      startOnboarding: () => {
        set({
          currentStep: 1,
          showPreOnboarding: false,
          showPlanSelector: false,
          completedSteps: [],
          skippedSteps: [],
          onboardingComplete: false,
        });
      },

      setCurrentStep: (step: OnboardingStepV2) => {
        set({ currentStep: step });
      },

      completeStep: (step: number) => {
        const { completedSteps } = get();
        if (!completedSteps.includes(step)) {
          set({
            completedSteps: [...completedSteps, step],
          });
        }
      },

      skipStep: (step: number) => {
        const { skippedSteps } = get();
        if (!skippedSteps.includes(step)) {
          set({
            skippedSteps: [...skippedSteps, step],
          });
        }
      },

      skipOnboarding: () => {
        set({
          onboardingComplete: true,
          currentStep: 0,
          showPreOnboarding: false,
          showPlanSelector: false,
        });
      },

      finishOnboarding: () => {
        set({
          onboardingComplete: true,
          currentStep: 0,
          showPreOnboarding: false,
          showPlanSelector: false,
        });
      },

      resetOnboarding: () => {
        set(initialState);
      },

      setUseQuickStartSongs: (use: boolean) => {
        set({ useQuickStartSongs: use });
      },

      setUseQuickStartQuestions: (use: boolean) => {
        set({ useQuickStartQuestions: use });
      },

      markUpsellSeen: (upsell: keyof OnboardingStateV2["hasSeenUpsells"]) => {
        set((state) => ({
          hasSeenUpsells: {
            ...state.hasSeenUpsells,
            [upsell]: true,
          },
        }));
      },

      completePayment: () => {
        set({ paymentCompleted: true, skippedPayment: false });
      },

      skipPayment: () => {
        set({
          paymentCompleted: false,
          skippedPayment: true,
          selectedPlan: "starter",
          isTrialUser: false,
        });
      },
    }),
    {
      name: "compakt-onboarding-v2-storage",
      partialize: (state) => ({
        onboardingComplete: state.onboardingComplete,
        completedSteps: state.completedSteps,
        currentStep: state.currentStep,
        selectedPlan: state.selectedPlan,
        isTrialUser: state.isTrialUser,
      }),
    }
  )
);
