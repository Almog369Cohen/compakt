"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, User, Sparkles } from "lucide-react";
import { useProfileStore } from "@/stores/profileStore";

interface OnboardingStepProfileV2Props {
  onComplete: () => void;
  onSkip: () => void;
  isTrialUser: boolean;
}

export function OnboardingStepProfileV2({ onComplete, onSkip, isTrialUser }: OnboardingStepProfileV2Props) {
  const profile = useProfileStore((s) => s.profile);
  const setProfile = useProfileStore((s) => s.setProfile);

  const [businessName, setBusinessName] = useState(profile.businessName || "");
  const [djSlug, setDjSlug] = useState(profile.djSlug || "");

  const handleContinue = () => {
    setProfile({
      businessName: businessName.trim(),
      djSlug: djSlug.trim().toLowerCase(),
    });
    onComplete();
  };

  const canContinue = businessName.trim() && djSlug.trim();

  return (
    <div className="min-h-dvh flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl">
        {/* Trial Badge */}
        {isTrialUser && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center mb-4"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-blue/10 border border-brand-blue/20">
              <Sparkles className="w-4 h-4 text-brand-blue" />
              <span className="text-sm font-medium text-brand-blue">Premium Trial פעיל</span>
            </div>
          </motion.div>
        )}

        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-secondary">שלב 1 מתוך 4</span>
            <span className="text-sm font-medium text-brand-blue">25%</span>
          </div>
          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "25%" }}
              className="h-full bg-gradient-to-r from-brand-blue to-brand-green"
            />
          </div>
        </div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-8"
        >
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-brand-blue/10 flex items-center justify-center">
              <User className="w-6 h-6 text-brand-blue" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">בואו נכיר!</h2>
              <p className="text-sm text-secondary">ספר לנו קצת על עצמך</p>
            </div>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                שם העסק <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="DJ שמח"
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                קישור אישי <span className="text-red-400">*</span>
              </label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-secondary">compakt.app/dj/</span>
                <input
                  type="text"
                  value={djSlug}
                  onChange={(e) => setDjSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                  placeholder="dj-sameach"
                  className="input-field flex-1"
                />
              </div>
              <p className="text-xs text-muted mt-1">רק אותיות באנגלית, מספרים ומקפים</p>
            </div>

            <div className="p-4 rounded-lg bg-brand-blue/5 border border-brand-blue/10">
              <p className="text-sm text-secondary">
                💡 <strong>טיפ:</strong> תוכל להוסיף ביו, תמונות ופרטי קשר נוספים בהמשך בעריכת הפרופיל
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-8">
            <button
              onClick={onSkip}
              className="btn-secondary flex-1"
            >
              דלג
            </button>
            <button
              onClick={handleContinue}
              disabled={!canContinue}
              className="btn-primary flex-1"
            >
              המשך
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
