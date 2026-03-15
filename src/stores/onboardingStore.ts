import { create } from "zustand";
import { persist } from "zustand/middleware";

export type OnboardingStep = 0 | 1 | 2 | 3 | 4;

interface OnboardingState {
  // State
  isNewUser: boolean;
  currentStep: OnboardingStep;
  completedSteps: number[];
  skippedSteps: number[];
  onboardingComplete: boolean;
  showWelcome: boolean;
  
  // Quick Start selections
  useQuickStartSongs: boolean;
  useQuickStartQuestions: boolean;
  
  // Actions
  setIsNewUser: (isNew: boolean) => void;
  startOnboarding: () => void;
  setCurrentStep: (step: OnboardingStep) => void;
  completeStep: (step: number) => void;
  skipStep: (step: number) => void;
  skipOnboarding: () => void;
  finishOnboarding: () => void;
  resetOnboarding: () => void;
  setShowWelcome: (show: boolean) => void;
  setUseQuickStartSongs: (use: boolean) => void;
  setUseQuickStartQuestions: (use: boolean) => void;
}

const initialState = {
  isNewUser: false,
  currentStep: 0 as OnboardingStep,
  completedSteps: [],
  skippedSteps: [],
  onboardingComplete: false,
  showWelcome: true,
  useQuickStartSongs: true,
  useQuickStartQuestions: true,
};

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setIsNewUser: (isNew: boolean) => {
        set({ isNewUser: isNew });
      },

      startOnboarding: () => {
        set({
          currentStep: 1,
          showWelcome: false,
          completedSteps: [],
          skippedSteps: [],
          onboardingComplete: false,
        });
      },

      setCurrentStep: (step: OnboardingStep) => {
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
          showWelcome: false,
        });
      },

      finishOnboarding: () => {
        set({
          onboardingComplete: true,
          currentStep: 0,
          showWelcome: false,
        });
      },

      resetOnboarding: () => {
        set(initialState);
      },

      setShowWelcome: (show: boolean) => {
        set({ showWelcome: show });
      },

      setUseQuickStartSongs: (use: boolean) => {
        set({ useQuickStartSongs: use });
      },

      setUseQuickStartQuestions: (use: boolean) => {
        set({ useQuickStartQuestions: use });
      },
    }),
    {
      name: "compakt-onboarding-storage",
      partialize: (state) => ({
        onboardingComplete: state.onboardingComplete,
        completedSteps: state.completedSteps,
        currentStep: state.currentStep,
      }),
    }
  )
);
