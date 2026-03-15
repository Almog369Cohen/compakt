"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Check, Zap } from "lucide-react";
import type { PlanKey } from "@/lib/access";
import { PLANS } from "@/stores/pricingStore";

interface PlanSelectorProps {
  onSelectPlan: (plan: PlanKey) => void;
  defaultPlan?: PlanKey;
}

export function PlanSelector({ onSelectPlan, defaultPlan = "premium" }: PlanSelectorProps) {
  const [selectedPlan, setSelectedPlan] = useState<PlanKey>(defaultPlan);

  const handleSelect = (plan: PlanKey) => {
    setSelectedPlan(plan);
  };

  const handleContinue = () => {
    onSelectPlan(selectedPlan);
  };

  const premiumPlan = PLANS.find((p) => p.key === "premium");
  const starterPlan = PLANS.find((p) => p.key === "starter");

  return (
    <div className="min-h-dvh gradient-hero flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            בחר את התוכנית שלך
          </h1>
          <p className="text-lg text-secondary">
            התחל עם 30 יום חינם של Premium או התחל בחינם לתמיד
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Premium Trial Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <button
              onClick={() => handleSelect("premium")}
              className={`w-full text-right transition-all ${selectedPlan === "premium"
                ? "ring-2 ring-brand-blue"
                : "hover:ring-1 hover:ring-white/20"
                }`}
            >
              <div className="glass-card p-6 relative overflow-hidden">
                {/* Recommended Badge */}
                <div className="absolute top-4 left-4">
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-blue text-white text-xs font-medium">
                    <Sparkles className="w-3 h-3" />
                    <span>מומלץ!</span>
                  </div>
                </div>

                {/* Selected Indicator */}
                {selectedPlan === "premium" && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-4 right-4"
                  >
                    <div className="w-6 h-6 rounded-full bg-brand-blue flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  </motion.div>
                )}

                <div className="mt-8 mb-4">
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-3xl font-bold">Premium Trial</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-brand-blue">30 יום חינם</span>
                  </div>
                  <div className="text-sm text-secondary mt-1">
                    אחר כך {premiumPlan?.currency}{premiumPlan?.price}/{premiumPlan?.interval === "month" ? "חודש" : "שנה"}
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  {premiumPlan?.features.slice(0, 6).map((feature, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-brand-green mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-white/10">
                  <div className="flex items-center gap-2 text-brand-green text-sm font-medium">
                    <Sparkles className="w-4 h-4" />
                    <span>+ 50% הנחה לחודשיים הראשונים</span>
                  </div>
                </div>
              </div>
            </button>
          </motion.div>

          {/* Starter Free Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <button
              onClick={() => handleSelect("starter")}
              className={`w-full text-right transition-all ${selectedPlan === "starter"
                ? "ring-2 ring-brand-blue"
                : "hover:ring-1 hover:ring-white/20"
                }`}
            >
              <div className="glass-card p-6 relative">
                {/* Selected Indicator */}
                {selectedPlan === "starter" && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-4 right-4"
                  >
                    <div className="w-6 h-6 rounded-full bg-brand-blue flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  </motion.div>
                )}

                <div className="mb-4">
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-3xl font-bold">Starter</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-brand-green">חינם לתמיד</span>
                  </div>
                  <div className="text-sm text-secondary mt-1">
                    עם מגבלות שימוש
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  {starterPlan?.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-brand-green mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-white/10">
                  <div className="flex items-center gap-2 text-secondary text-sm">
                    <Zap className="w-4 h-4" />
                    <span>אפשר לשדרג בכל עת</span>
                  </div>
                </div>
              </div>
            </button>
          </motion.div>
        </div>

        {/* Warning for Starter */}
        {selectedPlan === "starter" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-4 mb-6 border border-yellow-500/20"
          >
            <div className="flex items-start gap-3">
              <div className="text-2xl">💡</div>
              <div>
                <div className="font-medium mb-1">טיפ: רוב ה-DJs מתחילים ב-Premium Trial</div>
                <div className="text-sm text-secondary">
                  עם ה-trial תוכל לנסות את כל הפיצ&apos;רים ללא הגבלה ל-14 יום, ורק אז להחליט אם לשדרג.
                  ללא חיוב בתקופת הניסיון • ביטול בכל עת.
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Continue Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center"
        >
          <button
            onClick={handleContinue}
            className="btn-primary text-lg px-8 py-4"
          >
            {selectedPlan === "premium" ? (
              <>
                <Sparkles className="w-5 h-5" />
                התחל את ה-Trial
              </>
            ) : (
              <>
                <Zap className="w-5 h-5" />
                התחל בחינם
              </>
            )}
          </button>

          <p className="text-xs text-muted mt-4">
            {selectedPlan === "premium"
              ? "ללא כרטיס אשראי • ביטול בכל עת"
              : "אפשר לשדרג בכל שלב • ללא התחייבות"
            }
          </p>
        </motion.div>

        {/* Comparison Link */}
        <div className="text-center mt-8">
          <button className="text-sm text-secondary hover:text-foreground transition-colors">
            השווה את כל התוכניות →
          </button>
        </div>
      </div>
    </div>
  );
}
