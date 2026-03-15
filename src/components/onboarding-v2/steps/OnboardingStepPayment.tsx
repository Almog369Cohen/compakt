"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Lock, Check, AlertCircle, ExternalLink } from "lucide-react";
import { useAdminStore } from "@/stores/adminStore";

interface OnboardingStepPaymentProps {
  onComplete: () => void;
  onSkip: () => void;
}

export function OnboardingStepPayment({ onSkip }: OnboardingStepPaymentProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const userId = useAdminStore((s) => s.userId);
  const userEmail = useAdminStore((s) => s.userEmail);

  const handleProceedToPayment = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      if (!userId || !userEmail) {
        setError('חסרים פרטי משתמש. אנא נסה שוב.');
        setIsProcessing(false);
        return;
      }

      const response = await fetch('/api/payment/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          email: userEmail,
          plan: 'premium'
        })
      });

      const data = await response.json();

      if (!response.ok || !data.paymentUrl) {
        throw new Error(data.error || 'Failed to create payment session');
      }

      window.location.href = data.paymentUrl;

    } catch (err) {
      console.error('Payment error:', err);
      setError('אירעה שגיאה. אנא נסה שוב.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="w-16 h-16 rounded-full bg-brand-blue/10 flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8 text-brand-blue" />
        </div>
        <h2 className="text-3xl font-bold mb-2">תשלום מאובטח</h2>
        <p className="text-secondary">
          מעבר לדף התשלום המאובטח של Morning
        </p>
      </motion.div>

      {/* Trust Signals */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-4 mb-6 border border-brand-green/20"
      >
        <div className="flex items-start gap-3 mb-3">
          <Lock className="w-5 h-5 text-brand-green mt-0.5 flex-shrink-0" />
          <div>
            <div className="font-medium mb-1">תשלום מאובטח 🔒</div>
            <div className="text-sm text-secondary">
              לא נחייב אותך עד תום 14 ימי הניסיון • ביטול בכל עת
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center gap-3 pt-3 border-t border-white/5">
          <div className="text-xs text-muted flex items-center gap-1">
            <Lock className="w-3 h-3" />
            256-bit SSL
          </div>
          <span className="text-muted">•</span>
          <div className="text-xs text-muted">PCI DSS Compliant</div>
          <span className="text-muted">•</span>
          <div className="text-xs text-muted">Secured by Morning</div>
        </div>
      </motion.div>

      {/* Pricing Info */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card p-4 mb-6 border border-brand-blue/20"
      >
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-brand-blue mt-0.5 flex-shrink-0" />
          <div>
            <div className="font-medium mb-1">מה קורה אחרי 14 ימים?</div>
            <div className="text-sm text-secondary mb-2">
              אם תבחר להמשיך, נחייב ₪149/חודש (30% הנחה לחודשיים ראשונים = ₪104)
            </div>
            <div className="text-xs text-muted">
              תקבל תזכורת 3 ימים לפני סיום תקופת הניסיון
            </div>
          </div>
        </div>
      </motion.div>

      {/* Money-back Guarantee */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="glass-card p-4 mb-6 border border-brand-green/20 bg-brand-green/5"
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-brand-green/20 flex items-center justify-center flex-shrink-0">
            <Check className="w-5 h-5 text-brand-green" />
          </div>
          <div>
            <div className="font-medium mb-1">🛡️ אחריות החזר כספי מלא</div>
            <div className="text-sm text-secondary">
              לא מרוצה? 100% החזר כספי תוך 30 יום - ללא שאלות
            </div>
          </div>
        </div>
      </motion.div>

      {/* Payment Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card p-6 mb-6"
      >
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-blue to-brand-green flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-white" />
          </div>

          <h3 className="text-xl font-bold mb-2">
            מעבר לתשלום מאובטח
          </h3>

          <p className="text-secondary mb-6">
            אתה עומד לעבור לדף התשלום המאובטח של Morning<br />
            (חשבונית ירוקה)
          </p>

          <div className="glass-card p-4 mb-6">
            <div className="space-y-3 text-sm text-right">
              <div className="flex items-center justify-between">
                <span className="text-secondary">תוכנית:</span>
                <span className="font-medium">Premium</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-secondary">מחיר:</span>
                <span className="font-medium">₪149/חודש</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-secondary">תקופת ניסיון:</span>
                <span className="font-medium text-brand-green">14 יום חינם</span>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleProceedToPayment}
            disabled={isProcessing}
            className="btn-primary w-full"
          >
            {isProcessing ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                מעביר...
              </>
            ) : (
              <>
                <ExternalLink className="w-5 h-5" />
                מעבר לתשלום מאובטח
              </>
            )}
          </button>

          {/* Payment Methods */}
          <div className="mt-4 pt-4 border-t border-white/5">
            <p className="text-xs text-center text-muted mb-2">אמצעי תשלום מקובלים:</p>
            <div className="flex items-center justify-center gap-3">
              <div className="px-3 py-1.5 rounded bg-white/5 text-xs font-medium">Visa</div>
              <div className="px-3 py-1.5 rounded bg-white/5 text-xs font-medium">Mastercard</div>
              <div className="px-3 py-1.5 rounded bg-white/5 text-xs font-medium">Amex</div>
              <div className="px-3 py-1.5 rounded bg-white/5 text-xs font-medium">Isracard</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Skip Option */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-center"
      >
        <div className="glass-card p-4 mb-4 border border-yellow-500/20 bg-yellow-500/5">
          <p className="text-sm text-secondary mb-2">
            💡 <strong>רוצה לנסות קודם?</strong>
          </p>
          <p className="text-xs text-muted mb-3">
            תוכל להתחיל בתוכנית Starter החינמית ולשדרג מתי שתרצה
          </p>
          <button
            onClick={onSkip}
            className="text-sm text-brand-blue hover:text-brand-green transition-colors font-medium"
          >
            המשך ב-Starter בחינם →
          </button>
        </div>
        <p className="text-xs text-muted">
          95% מה-DJs משדרגים ל-Premium אחרי שהם רואים את היתרונות
        </p>
      </motion.div>
    </div>
  );
}
