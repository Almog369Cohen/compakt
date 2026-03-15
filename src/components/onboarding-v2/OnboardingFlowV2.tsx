"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useOnboardingStoreV2, type OnboardingStepV2 } from "@/stores/onboardingStoreV2";
import { usePricingStore } from "@/stores/pricingStore";
import { useProfileStore } from "@/stores/profileStore";
import type { PlanKey } from "@/lib/access";
import { PreOnboardingLanding } from "./PreOnboardingLanding";
import { PlanSelector } from "./PlanSelector";
import { OnboardingStepProfileV2 } from "./steps/OnboardingStepProfileV2";
import { OnboardingStepSongsV2 } from "./steps/OnboardingStepSongsV2";
import { OnboardingStepQuestionsV2 } from "./steps/OnboardingStepQuestionsV2";
import { OnboardingStepLinkV2 } from "./steps/OnboardingStepLinkV2";
import { OnboardingChecklistV2 } from "./OnboardingChecklistV2";

export function OnboardingFlowV2() {
  const showPreOnboarding = useOnboardingStoreV2((s) => s.showPreOnboarding);
  const showPlanSelector = useOnboardingStoreV2((s) => s.showPlanSelector);
  const currentStep = useOnboardingStoreV2((s) => s.currentStep);
  const selectedPlan = useOnboardingStoreV2((s) => s.selectedPlan);
  const isTrialUser = useOnboardingStoreV2((s) => s.isTrialUser);

  const setShowPreOnboarding = useOnboardingStoreV2((s) => s.setShowPreOnboarding);
  const setShowPlanSelector = useOnboardingStoreV2((s) => s.setShowPlanSelector);
  const selectPlan = useOnboardingStoreV2((s) => s.selectPlan);
  const startOnboarding = useOnboardingStoreV2((s) => s.startOnboarding);
  const setCurrentStep = useOnboardingStoreV2((s) => s.setCurrentStep);
  const completeStep = useOnboardingStoreV2((s) => s.completeStep);
  const finishOnboarding = useOnboardingStoreV2((s) => s.finishOnboarding);

  const startTrial = usePricingStore((s) => s.startTrial);
  const profileId = useProfileStore((s) => s.profileId);

  const [showCelebration, setShowCelebration] = useState(false);

  // Handle trial start when plan is selected
  useEffect(() => {
    if (selectedPlan === "premium" && isTrialUser && profileId && currentStep === 1) {
      // Start trial in background
      startTrial(profileId, 30).catch((error) => {
        console.error("Failed to start trial:", error);
      });
    }
  }, [selectedPlan, isTrialUser, profileId, currentStep, startTrial]);

  const handleStartTrial = () => {
    setShowPreOnboarding(false);
    setShowPlanSelector(true);
  };

  const handleStartFree = () => {
    selectPlan("starter");
    startOnboarding();
  };

  const handlePlanSelected = (plan: PlanKey) => {
    selectPlan(plan);
    startOnboarding();
  };

  const handleStepComplete = (step: number) => {
    completeStep(step);

    if (step === 4) {
      // Last step - show celebration
      setShowCelebration(true);
    } else {
      // Move to next step
      setCurrentStep((step + 1) as OnboardingStepV2);
    }
  };

  const handleCelebrationComplete = () => {
    finishOnboarding();
  };

  // Show pre-onboarding landing
  if (showPreOnboarding) {
    return (
      <PreOnboardingLanding
        onStartTrial={handleStartTrial}
        onStartFree={handleStartFree}
      />
    );
  }

  // Show plan selector
  if (showPlanSelector) {
    return (
      <PlanSelector
        onSelectPlan={handlePlanSelected}
        defaultPlan="premium"
      />
    );
  }

  // Show celebration/checklist
  if (showCelebration) {
    return (
      <OnboardingChecklistV2
        onComplete={handleCelebrationComplete}
        isTrialUser={isTrialUser}
      />
    );
  }

  // Show onboarding steps
  return (
    <div className="min-h-dvh gradient-hero">
      <AnimatePresence mode="wait">
        {currentStep === 1 && (
          <motion.div
            key="step-1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <OnboardingStepProfileV2
              onComplete={() => handleStepComplete(1)}
              onSkip={() => {
                completeStep(1);
                setCurrentStep(2);
              }}
              isTrialUser={isTrialUser}
            />
          </motion.div>
        )}

        {currentStep === 2 && (
          <motion.div
            key="step-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <OnboardingStepSongsV2
              onComplete={() => handleStepComplete(2)}
              onBack={() => setCurrentStep(1)}
              onSkip={() => {
                completeStep(2);
                setCurrentStep(3);
              }}
              isTrialUser={isTrialUser}
            />
          </motion.div>
        )}

        {currentStep === 3 && (
          <motion.div
            key="step-3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <OnboardingStepQuestionsV2
              onComplete={() => handleStepComplete(3)}
              onBack={() => setCurrentStep(2)}
              onSkip={() => {
                completeStep(3);
                setCurrentStep(4);
              }}
              isTrialUser={isTrialUser}
            />
          </motion.div>
        )}

        {currentStep === 4 && (
          <motion.div
            key="step-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <OnboardingStepLinkV2
              onComplete={() => handleStepComplete(4)}
              onBack={() => setCurrentStep(3)}
              isTrialUser={isTrialUser}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
