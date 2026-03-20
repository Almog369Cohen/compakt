"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Zap, Clock, ArrowLeft } from "lucide-react";

interface UpgradePromptProps {
  trialEndsAt: string;
  plan: string;
  onUpgrade?: () => void;
}

export function UpgradePrompt({ trialEndsAt, plan, onUpgrade }: UpgradePromptProps) {
  const [daysRemaining, setDaysRemaining] = useState(0);
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const calculateDaysRemaining = () => {
      const now = new Date();
      const endsAt = new Date(trialEndsAt);
      const diff = endsAt.getTime() - now.getTime();
      const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
      setDaysRemaining(days);
      
      // Show prompt when 3 days or less remaining
      if (days <= 3 && days > 0) {
        setShowPrompt(true);
      }
    };

    calculateDaysRemaining();
    const interval = setInterval(calculateDaysRemaining, 1000 * 60 * 60); // Update every hour

    return () => clearInterval(interval);
  }, [trialEndsAt]);

  const handleUpgrade = async () => {
    if (onUpgrade) {
      onUpgrade();
      return;
    }

    // Default: create payment link
    try {
      const response = await fetch('/api/payments/create-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionId: 'current' // Will be handled by API
        })
      });

      const data = await response.json();
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      }
    } catch (error) {
      console.error('Failed to create payment link:', error);
    }
  };

  if (dismissed || !showPrompt || daysRemaining <= 0) {
    return null;
  }

  const planPrices: Record<string, string> = {
    pro: '₪55',
    premium: '₪89',
    enterprise: '₪150'
  };

  const price = planPrices[plan.toLowerCase()] || '₪55';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4"
      >
        <div className="bg-gradient-to-r from-[#059cc0] to-[#03b28c] rounded-2xl shadow-2xl p-6 text-white relative overflow-hidden">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-40 h-40 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-40 h-40 bg-white rounded-full translate-x-1/2 translate-y-1/2" />
          </div>

          {/* Close button */}
          <button
            onClick={() => setDismissed(true)}
            className="absolute top-4 left-4 p-2 rounded-lg hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Content */}
          <div className="relative flex items-center gap-6">
            {/* Icon */}
            <div className="hidden md:flex items-center justify-center w-16 h-16 rounded-full bg-white/20 flex-shrink-0">
              <Clock className="w-8 h-8" />
            </div>

            {/* Text */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-5 h-5" />
                <h3 className="text-lg font-bold">
                  {daysRemaining === 1 
                    ? 'נשאר יום אחד לתקופת הניסיון!' 
                    : `נשארו ${daysRemaining} ימים לתקופת הניסיון!`}
                </h3>
              </div>
              <p className="text-white/90 text-sm mb-4">
                כדי להמשיך ליהנות מכל הפיצ'רים, שדרגו עכשיו ל-{plan} Plan
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleUpgrade}
                  className="group flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-[#059cc0] font-semibold hover:shadow-lg hover:-translate-y-0.5 transition-all"
                >
                  שדרגו עכשיו - {price}/חודש
                  <ArrowLeft className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={() => setDismissed(true)}
                  className="text-sm text-white/80 hover:text-white transition-colors"
                >
                  אזכירו לי מאוחר יותר
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// Compact version for sidebar
export function UpgradePromptCompact({ trialEndsAt, plan }: Omit<UpgradePromptProps, 'onUpgrade'>) {
  const [daysRemaining, setDaysRemaining] = useState(0);

  useEffect(() => {
    const calculateDaysRemaining = () => {
      const now = new Date();
      const endsAt = new Date(trialEndsAt);
      const diff = endsAt.getTime() - now.getTime();
      const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
      setDaysRemaining(days);
    };

    calculateDaysRemaining();
    const interval = setInterval(calculateDaysRemaining, 1000 * 60 * 60);

    return () => clearInterval(interval);
  }, [trialEndsAt]);

  if (daysRemaining <= 0) {
    return null;
  }

  const planPrices: Record<string, string> = {
    pro: '₪55',
    premium: '₪89',
    enterprise: '₪150'
  };

  const price = planPrices[plan.toLowerCase()] || '₪55';

  return (
    <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-green-50 border border-[#e5e7eb]">
      <div className="flex items-center gap-2 mb-2">
        <Clock className="w-4 h-4 text-[#059cc0]" />
        <span className="text-sm font-semibold text-[#1f1f21]">
          {daysRemaining === 1 ? 'יום אחד נותר' : `${daysRemaining} ימים נותרו`}
        </span>
      </div>
      <p className="text-xs text-[#4b5563] mb-3">
        תקופת הניסיון שלך מסתיימת בקרוב
      </p>
      <a
        href="/upgrade"
        className="block w-full text-center py-2 px-4 rounded-lg bg-gradient-to-r from-[#059cc0] to-[#03b28c] text-white text-sm font-semibold hover:shadow-lg transition-all"
      >
        שדרג ל-{price}/חודש
      </a>
    </div>
  );
}
