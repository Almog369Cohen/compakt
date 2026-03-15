"use client";

import { motion } from "framer-motion";
import { AlertCircle, ArrowRight, Calendar, Music, HelpCircle } from "lucide-react";
import { usePricingStore, getPlanByKey, isWithinLimits } from "@/stores/pricingStore";
import { useAdminStore } from "@/stores/adminStore";

interface UsageLimitsWarningProps {
  onUpgrade: () => void;
}

export function UsageLimitsWarning({ onUpgrade }: UsageLimitsWarningProps) {
  const currentPlan = usePricingStore((s) => s.currentPlan);
  const songs = useAdminStore((s) => s.songs);
  const questions = useAdminStore((s) => s.questions);
  
  // For now, we'll count events as 0 - this should be updated when events are tracked
  const eventsCount = 0;
  
  const usage = {
    events: eventsCount,
    songs: songs.length,
    questions: questions.length,
  };

  const { withinLimits, exceeded } = isWithinLimits(currentPlan, usage);
  const plan = getPlanByKey(currentPlan);

  if (withinLimits || !plan) return null;

  const getExceededMessage = () => {
    const messages: string[] = [];
    
    if (exceeded.includes("events") && plan.limits.events !== null) {
      messages.push(`${usage.events}/${plan.limits.events} אירועים`);
    }
    if (exceeded.includes("songs") && plan.limits.songs !== null) {
      messages.push(`${usage.songs}/${plan.limits.songs} שירים`);
    }
    if (exceeded.includes("questions") && plan.limits.questions !== null) {
      messages.push(`${usage.questions}/${plan.limits.questions} שאלות`);
    }
    
    return messages.join(" • ");
  };

  const getWarningMessage = () => {
    const messages: string[] = [];
    
    if (exceeded.includes("events")) {
      messages.push("הגעת למגבלת האירועים");
    }
    if (exceeded.includes("songs")) {
      messages.push("הגעת למגבלת השירים");
    }
    if (exceeded.includes("questions")) {
      messages.push("הגעת למגבלת השאלות");
    }
    
    return messages.join(", ");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 p-4 rounded-xl border-2 border-orange-500/30 bg-gradient-to-r from-orange-500/10 to-red-500/10"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <div className="font-bold mb-1">
              ⚠️ {getWarningMessage()}
            </div>
            <div className="text-sm text-secondary mb-3">
              {getExceededMessage()}
            </div>
            
            <div className="flex flex-wrap gap-4 text-sm">
              {exceeded.includes("events") && plan.limits.events !== null && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-orange-400" />
                  <span>אירועים: {usage.events}/{plan.limits.events}</span>
                </div>
              )}
              {exceeded.includes("songs") && plan.limits.songs !== null && (
                <div className="flex items-center gap-2">
                  <Music className="w-4 h-4 text-orange-400" />
                  <span>שירים: {usage.songs}/{plan.limits.songs}</span>
                </div>
              )}
              {exceeded.includes("questions") && plan.limits.questions !== null && (
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-orange-400" />
                  <span>שאלות: {usage.questions}/{plan.limits.questions}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={onUpgrade}
          className="btn-primary whitespace-nowrap bg-orange-500 hover:bg-orange-600"
        >
          שדרג לפרו
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}
