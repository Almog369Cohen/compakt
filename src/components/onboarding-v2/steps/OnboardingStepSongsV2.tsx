"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Music, Sparkles, Check, Lock } from "lucide-react";
import { useOnboardingStoreV2 } from "@/stores/onboardingStoreV2";
import { QUICK_START_SONGS, QUICK_START_SONGS_COUNT } from "@/data/onboarding-songs";

interface OnboardingStepSongsV2Props {
  onComplete: () => void;
  onBack: () => void;
  onSkip: () => void;
  isTrialUser: boolean;
}

export function OnboardingStepSongsV2({ onComplete, onBack, onSkip, isTrialUser }: OnboardingStepSongsV2Props) {
  const setUseQuickStart = useOnboardingStoreV2((s) => s.setUseQuickStartSongs);
  const markUpsellSeen = useOnboardingStoreV2((s) => s.markUpsellSeen);

  const [showSpotifyUpsell, setShowSpotifyUpsell] = useState(false);

  const handleQuickStart = () => {
    setUseQuickStart(true);
    onComplete();
  };

  const handleManual = () => {
    setUseQuickStart(false);
    onComplete();
  };

  const handleSpotifyImport = () => {
    markUpsellSeen("spotify");
    setShowSpotifyUpsell(true);
  };

  const handleCloseSpotifyUpsell = () => {
    setShowSpotifyUpsell(false);
  };

  return (
    <div className="min-h-dvh flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl">
        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-secondary">שלב 2 מתוך 4</span>
            <span className="text-sm font-medium text-brand-blue">50%</span>
          </div>
          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: "25%" }}
              animate={{ width: "50%" }}
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
              <Music className="w-6 h-6 text-brand-blue" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">בואו נוסיף שירים!</h2>
              <p className="text-sm text-secondary">בחר איך תרצה להתחיל</p>
            </div>
          </div>

          {/* Options */}
          <div className="space-y-4 mb-6">
            {/* Quick Start Option */}
            <button
              onClick={handleQuickStart}
              className="w-full text-right p-6 rounded-xl border-2 border-brand-blue/20 hover:border-brand-blue/40 transition-all bg-brand-blue/5"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-brand-blue" />
                  <span className="font-bold text-lg">Quick Start - {QUICK_START_SONGS_COUNT} שירים פופולריים</span>
                </div>
                <div className="px-3 py-1 rounded-full bg-brand-green/20 text-brand-green text-xs font-medium">
                  מומלץ
                </div>
              </div>
              <p className="text-sm text-secondary mb-3">
                התחל עם רשימת שירים מוכנה ופופולרית שכוללת את הלהיטים האהובים ביותר
              </p>
              <div className="flex flex-wrap gap-2">
                {QUICK_START_SONGS.slice(0, 5).map((song, i) => (
                  <div key={i} className="text-xs px-2 py-1 rounded bg-white/5">
                    {song.title} - {song.artist}
                  </div>
                ))}
                <div className="text-xs px-2 py-1 rounded bg-white/5 text-secondary">
                  +{QUICK_START_SONGS_COUNT - 5} עוד
                </div>
              </div>
            </button>

            {/* Manual Option */}
            <button
              onClick={handleManual}
              className="w-full text-right p-6 rounded-xl border-2 border-white/10 hover:border-white/20 transition-all"
            >
              <div className="flex items-center gap-2 mb-2">
                <Music className="w-5 h-5 text-secondary" />
                <span className="font-bold text-lg">אתחיל ריק ואוסיף בעצמי</span>
              </div>
              <p className="text-sm text-secondary">
                התחל עם רשימה ריקה והוסף את השירים שלך אחד אחד
              </p>
            </button>
          </div>

          {/* Spotify Upsell */}
          <div className="p-6 rounded-xl border-2 border-brand-blue/20 bg-gradient-to-br from-brand-blue/5 to-transparent mb-6">
            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isTrialUser ? "bg-brand-blue/20" : "bg-white/5"
                }`}>
                {isTrialUser ? (
                  <Sparkles className="w-5 h-5 text-brand-blue" />
                ) : (
                  <Lock className="w-5 h-5 text-secondary" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-bold">Spotify Import</h3>
                  {isTrialUser && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-brand-blue/20 text-brand-blue">
                      כלול ב-Trial
                    </span>
                  )}
                </div>
                <p className="text-sm text-secondary mb-3">
                  ייבא את הפלייליסטים שלך מ-Spotify בלחיצת כפתור. חסוך שעות של עבודה ידנית!
                </p>
                <button
                  onClick={handleSpotifyImport}
                  disabled={!isTrialUser}
                  className={`text-sm font-medium ${isTrialUser
                      ? "text-brand-blue hover:text-brand-blue/80"
                      : "text-secondary cursor-not-allowed"
                    }`}
                >
                  {isTrialUser ? "ייבא מ-Spotify →" : "🔒 זמין ב-Premium"}
                </button>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button onClick={onBack} className="btn-secondary">
              <ArrowLeft className="w-5 h-5" />
              חזרה
            </button>
            <button onClick={onSkip} className="btn-secondary flex-1">
              דלג
            </button>
          </div>
        </motion.div>
      </div>

      {/* Spotify Upsell Modal */}
      {showSpotifyUpsell && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={handleCloseSpotifyUpsell}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-card p-8 max-w-lg w-full"
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-brand-blue/20 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-brand-blue" />
              </div>
              <h2 className="text-2xl font-bold mb-2">ייבא פלייליסטים מ-Spotify</h2>
              <p className="text-secondary">חסוך שעות של עבודה ידנית</p>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-red-400 text-sm">✗</span>
                </div>
                <div>
                  <div className="font-medium mb-1">ללא Spotify Import:</div>
                  <div className="text-sm text-secondary">הוספה ידנית של כל שיר אחד אחד - שעות של עבודה</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-brand-green/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-4 h-4 text-brand-green" />
                </div>
                <div>
                  <div className="font-medium mb-1">עם Spotify Import:</div>
                  <div className="text-sm text-secondary">ייבוא של 100+ שירים בלחיצה אחת - פחות מדקה</div>
                </div>
              </div>
            </div>

            {isTrialUser ? (
              <div className="space-y-3">
                <button className="btn-primary w-full">
                  <Sparkles className="w-5 h-5" />
                  חבר את Spotify
                </button>
                <button onClick={handleCloseSpotifyUpsell} className="btn-secondary w-full">
                  אמשיך בלי
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <button className="btn-primary w-full">
                  <Sparkles className="w-5 h-5" />
                  התחל Premium Trial (30 יום חינם)
                </button>
                <button onClick={handleCloseSpotifyUpsell} className="btn-secondary w-full">
                  אמשיך בלי
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
