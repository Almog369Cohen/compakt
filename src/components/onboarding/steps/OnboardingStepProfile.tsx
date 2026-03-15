"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, User } from "lucide-react";
import { useProfileStore } from "@/stores/profileStore";

interface OnboardingStepProfileProps {
  onComplete: () => void;
  onSkip: () => void;
}

export function OnboardingStepProfile({ onComplete, onSkip }: OnboardingStepProfileProps) {
  const profile = useProfileStore((s) => s.profile);
  const setProfile = useProfileStore((s) => s.setProfile);

  const [businessName, setBusinessName] = useState(profile.businessName || "");
  const [djSlug, setDjSlug] = useState(profile.djSlug || "");
  const [bio, setBio] = useState(profile.bio || "");
  const [whatsappNumber, setWhatsappNumber] = useState(profile.whatsappNumber || "");

  const handleContinue = () => {
    setProfile({
      businessName: businessName.trim(),
      djSlug: djSlug.trim().toLowerCase(),
      bio: bio.trim(),
      whatsappNumber: whatsappNumber.trim(),
    });
    onComplete();
  };

  const canContinue = businessName.trim() && djSlug.trim();

  return (
    <div className="min-h-dvh flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl">
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

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-3xl p-8 md:p-10"
        >
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-brand-blue/20 flex items-center justify-center">
              <User className="w-6 h-6 text-brand-blue" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">פרופיל בסיסי</h2>
              <p className="text-sm text-secondary">בואו נתחיל עם הפרטים החשובים</p>
            </div>
          </div>

          {/* Form */}
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2">
                שם העסק שלך <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder='לדוגמה: "DJ משה כהן"'
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-brand-blue focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                כתובת ייחודית (slug) <span className="text-red-400">*</span>
              </label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-secondary">compakt.app/dj/</span>
                <input
                  type="text"
                  value={djSlug}
                  onChange={(e) => setDjSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                  placeholder="moshe-cohen"
                  className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-brand-blue focus:outline-none transition-colors"
                  dir="ltr"
                />
              </div>
              <p className="text-xs text-secondary mt-1">רק אותיות אנגליות, מספרים ומקפים</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                טקסט היכרות קצר
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="ספרו קצת על עצמכם... (2-3 משפטים)"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-brand-blue focus:outline-none transition-colors min-h-[100px] resize-y"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                WhatsApp / טלפון
              </label>
              <input
                type="tel"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="050-1234567"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-brand-blue focus:outline-none transition-colors"
                dir="ltr"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/10">
            <button
              onClick={onSkip}
              className="text-sm text-secondary hover:text-foreground transition-colors"
            >
              דלג לעכשיו
            </button>
            <button
              onClick={handleContinue}
              disabled={!canContinue}
              className="btn-primary px-6 py-3 rounded-xl font-semibold inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              המשך
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
