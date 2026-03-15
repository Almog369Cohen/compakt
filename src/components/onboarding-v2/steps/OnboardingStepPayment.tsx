"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CreditCard, Lock, Check, AlertCircle } from "lucide-react";

interface OnboardingStepPaymentProps {
  onComplete: () => void;
  onSkip: () => void;
}

export function OnboardingStepPayment({ onComplete, onSkip }: OnboardingStepPaymentProps) {
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState(false);

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, "");
    const chunks = cleaned.match(/.{1,4}/g);
    return chunks ? chunks.join(" ") : cleaned;
  };

  const formatExpiry = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length >= 2) {
      return cleaned.slice(0, 2) + "/" + cleaned.slice(2, 4);
    }
    return cleaned;
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\s/g, "");
    if (value.length <= 16 && /^\d*$/.test(value)) {
      setCardNumber(value);
      if (errors.cardNumber) {
        setErrors({ ...errors, cardNumber: "" });
      }
    }
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value.length <= 4) {
      setExpiry(value);
      if (errors.expiry) {
        setErrors({ ...errors, expiry: "" });
      }
    }
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.length <= 3 && /^\d*$/.test(value)) {
      setCvv(value);
      if (errors.cvv) {
        setErrors({ ...errors, cvv: "" });
      }
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (cardNumber.length !== 16) {
      newErrors.cardNumber = "מספר כרטיס חייב להכיל 16 ספרות";
    }

    if (expiry.length !== 4) {
      newErrors.expiry = "תוקף לא תקין";
    } else {
      const month = parseInt(expiry.slice(0, 2));
      const year = parseInt("20" + expiry.slice(2, 4));
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;

      if (month < 1 || month > 12) {
        newErrors.expiry = "חודש לא תקין";
      } else if (year < currentYear || (year === currentYear && month < currentMonth)) {
        newErrors.expiry = "הכרטיס פג תוקף";
      }
    }

    if (cvv.length !== 3) {
      newErrors.cvv = "CVV חייב להכיל 3 ספרות";
    }

    if (!cardHolder.trim()) {
      newErrors.cardHolder = "שם בעל הכרטיס חובה";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsProcessing(true);

    // Simulate processing
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setIsProcessing(false);
    onComplete();
  };

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="w-16 h-16 rounded-full bg-brand-blue/10 flex items-center justify-center mx-auto mb-4">
          <CreditCard className="w-8 h-8 text-brand-blue" />
        </div>
        <h2 className="text-3xl font-bold mb-2">פרטי תשלום</h2>
        <p className="text-secondary">
          הכנס את פרטי הכרטיס שלך כדי להתחיל את תקופת הניסיון
        </p>
      </motion.div>

      {/* Trust Signals */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-4 mb-6 border border-brand-green/20"
      >
        <div className="flex items-start gap-3">
          <Lock className="w-5 h-5 text-brand-green mt-0.5 flex-shrink-0" />
          <div>
            <div className="font-medium mb-1">תשלום מאובטח 🔒</div>
            <div className="text-sm text-secondary">
              לא נחייב אותך עד תום 14 ימי הניסיון • ביטול בכל עת • הצפנת SSL
            </div>
          </div>
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

      {/* Payment Form */}
      <motion.form
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        onSubmit={handleSubmit}
        className="glass-card p-6 mb-6"
      >
        <div className="space-y-4">
          {/* Card Number */}
          <div>
            <label className="block text-sm font-medium mb-2">
              מספר כרטיס אשראי
            </label>
            <div className="relative">
              <input
                type="text"
                value={formatCardNumber(cardNumber)}
                onChange={handleCardNumberChange}
                placeholder="1234 5678 9012 3456"
                className={`input-field pr-12 ${errors.cardNumber ? "border-red-500" : ""}`}
                dir="ltr"
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 flex gap-1">
                <div className="w-8 h-5 bg-gradient-to-r from-blue-600 to-blue-400 rounded opacity-60" />
                <div className="w-8 h-5 bg-gradient-to-r from-orange-600 to-orange-400 rounded opacity-60" />
              </div>
            </div>
            {errors.cardNumber && (
              <p className="text-xs text-red-500 mt-1">{errors.cardNumber}</p>
            )}
          </div>

          {/* Expiry & CVV */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                תוקף (MM/YY)
              </label>
              <input
                type="text"
                value={formatExpiry(expiry)}
                onChange={handleExpiryChange}
                placeholder="12/25"
                className={`input-field ${errors.expiry ? "border-red-500" : ""}`}
                dir="ltr"
              />
              {errors.expiry && (
                <p className="text-xs text-red-500 mt-1">{errors.expiry}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                CVV
              </label>
              <input
                type="text"
                value={cvv}
                onChange={handleCvvChange}
                placeholder="123"
                className={`input-field ${errors.cvv ? "border-red-500" : ""}`}
                dir="ltr"
              />
              {errors.cvv && (
                <p className="text-xs text-red-500 mt-1">{errors.cvv}</p>
              )}
            </div>
          </div>

          {/* Card Holder */}
          <div>
            <label className="block text-sm font-medium mb-2">
              שם בעל הכרטיס
            </label>
            <input
              type="text"
              value={cardHolder}
              onChange={(e) => {
                setCardHolder(e.target.value);
                if (errors.cardHolder) {
                  setErrors({ ...errors, cardHolder: "" });
                }
              }}
              placeholder="ישראל ישראלי"
              className={`input-field ${errors.cardHolder ? "border-red-500" : ""}`}
            />
            {errors.cardHolder && (
              <p className="text-xs text-red-500 mt-1">{errors.cardHolder}</p>
            )}
          </div>

          {/* ID Number (Optional) */}
          <div>
            <label className="block text-sm font-medium mb-2">
              ת.ז. (אופציונלי)
            </label>
            <input
              type="text"
              value={idNumber}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "");
                if (value.length <= 9) {
                  setIdNumber(value);
                }
              }}
              placeholder="123456789"
              className="input-field"
              dir="ltr"
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isProcessing}
          className="btn-primary w-full mt-6"
        >
          {isProcessing ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              מעבד...
            </>
          ) : (
            <>
              <Check className="w-5 h-5" />
              התחל 14 יום חינם
            </>
          )}
        </button>

        {/* Security Icons */}
        <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted">
          <div className="flex items-center gap-1">
            <Lock className="w-3 h-3" />
            <span>SSL מאובטח</span>
          </div>
          <span>•</span>
          <span>PCI DSS Compliant</span>
        </div>
      </motion.form>

      {/* Skip Option */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-center"
      >
        <button
          onClick={onSkip}
          className="text-secondary hover:text-foreground transition-colors text-sm"
        >
          דלג - המשך בתוכנית Starter בחינם →
        </button>
        <p className="text-xs text-muted mt-2">
          תוכל תמיד לשדרג מאוחר יותר
        </p>
      </motion.div>
    </div>
  );
}
