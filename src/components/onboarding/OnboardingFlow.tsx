"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useOnboardingStore } from "@/stores/onboardingStore";
import { WelcomeScreen } from "./WelcomeScreen";
import { OnboardingStepProfile } from "./steps/OnboardingStepProfile";
import { OnboardingStepSongs } from "./steps/OnboardingStepSongs";
import { OnboardingStepQuestions } from "./steps/OnboardingStepQuestions";
import { OnboardingStepLink } from "./steps/OnboardingStepLink";
import { SuccessCelebration } from "./SuccessCelebration";

export function OnboardingFlow() {
  const currentStep = useOnboardingStore((s) => s.currentStep);
  const showWelcome = useOnboardingStore((s) => s.showWelcome);
  const startOnboarding = useOnboardingStore((s) => s.startOnboarding);
  const skipOnboarding = useOnboardingStore((s) => s.skipOnboarding);
  const setCurrentStep = useOnboardingStore((s) => s.setCurrentStep);
  const completeStep = useOnboardingStore((s) => s.completeStep);
  const finishOnboarding = useOnboardingStore((s) => s.finishOnboarding);

  const [showCelebration, setShowCelebration] = useState(false);

  const handleStepComplete = (step: number) => {
    completeStep(step);
    
    if (step === 4) {
      // Last step - show celebration
      setShowCelebration(true);
    } else {
      // Move to next step
      setCurrentStep((step + 1) as any);
    }
  };

  const handleCelebrationComplete = () => {
    finishOnboarding();
  };

  if (showWelcome) {
    return (
      <WelcomeScreen
        onStart={startOnboarding}
        onSkip={skipOnboarding}
      />
    );
  }

  if (showCelebration) {
    return (
      <SuccessCelebration
        onComplete={handleCelebrationComplete}
      />
    );
  }

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
            <OnboardingStepProfile
              onComplete={() => handleStepComplete(1)}
              onSkip={() => {
                completeStep(1);
                setCurrentStep(2);
              }}
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
            <OnboardingStepSongs
              onComplete={() => handleStepComplete(2)}
              onBack={() => setCurrentStep(1)}
              onSkip={() => {
                completeStep(2);
                setCurrentStep(3);
              }}
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
            <OnboardingStepQuestions
              onComplete={() => handleStepComplete(3)}
              onBack={() => setCurrentStep(2)}
              onSkip={() => {
                completeStep(3);
                setCurrentStep(4);
              }}
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
            <OnboardingStepLink
              onComplete={() => handleStepComplete(4)}
              onBack={() => setCurrentStep(3)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
