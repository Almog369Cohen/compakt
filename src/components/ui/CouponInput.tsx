"use client";

import { useState } from "react";
import { Tag, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { type CouponValidation, type CouponApplication } from "@/lib/coupon";

interface CouponInputProps {
  planValue?: number;
  planKey?: string;
  onCouponApplied?: (discount: number, couponDetails: any) => void;
  className?: string;
  disabled?: boolean;
}

export function CouponInput({
  planValue,
  planKey,
  onCouponApplied,
  className,
  disabled = false
}: CouponInputProps) {
  const [code, setCode] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [validation, setValidation] = useState<CouponValidation | null>(null);
  const [application, setApplication] = useState<CouponApplication | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleValidateCoupon = async () => {
    if (!code.trim()) return;

    setIsValidating(true);
    setError(null);
    setValidation(null);

    try {
      const response = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code.trim(),
          planValue,
          planKey,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to validate coupon");
      }

      setValidation(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to validate coupon");
      setValidation(null);
    } finally {
      setIsValidating(false);
    }
  };

  const handleApplyCoupon = async () => {
    if (!validation?.valid || !validation.coupon) return;

    setIsApplying(true);
    setError(null);

    try {
      const response = await fetch("/api/coupons/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code.trim(),
          planValue,
          planKey,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to apply coupon");
      }

      setApplication(data);

      if (data.success && onCouponApplied) {
        onCouponApplied(data.discount_amount || 0, data.coupon_details);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to apply coupon");
      setApplication(null);
    } finally {
      setIsApplying(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (validation?.valid) {
        handleApplyCoupon();
      } else {
        handleValidateCoupon();
      }
    }
  };

  const formatDiscountText = (coupon: CouponValidation["coupon"]) => {
    if (!coupon) return "";

    switch (coupon.discount_type) {
      case "percentage":
        return `${coupon.discount_value}% הנחה`;
      case "fixed_amount":
        return `₪${coupon.discount_value} הנחה`;
      case "free_trial":
        return "ניסיון חינם";
      default:
        return "הנחה";
    }
  };

  const showSuccess = application?.success || validation?.valid;
  const showError = error || (validation && !validation.valid);

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Tag className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              setValidation(null);
              setApplication(null);
              setError(null);
            }}
            onKeyDown={handleKeyDown}
            placeholder="הכנס קוד קופון"
            disabled={disabled || isApplying}
            className={cn(
              "w-full pl-3 pr-10 py-2 rounded-xl border transition-all",
              "bg-transparent border-glass focus:border-brand-blue",
              "placeholder:text-muted",
              showSuccess && "border-green-500 bg-green-50/50",
              showError && "border-red-500 bg-red-50/50",
              (disabled || isApplying) && "opacity-50 cursor-not-allowed"
            )}
          />
        </div>

        {!validation?.valid ? (
          <button
            onClick={handleValidateCoupon}
            disabled={!code.trim() || isValidating || disabled}
            className="btn-primary px-4 py-2 flex items-center gap-2"
          >
            {isValidating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "אימות"
            )}
          </button>
        ) : (
          <button
            onClick={handleApplyCoupon}
            disabled={isApplying || disabled}
            className="btn-primary px-4 py-2 flex items-center gap-2"
          >
            {isApplying ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "שימוש"
            )}
          </button>
        )}
      </div>

      {/* Validation Result */}
      {validation && (
        <div className={cn(
          "p-3 rounded-lg text-sm flex items-center gap-2",
          validation.valid
            ? "bg-green-50 border border-green-200 text-green-800"
            : "bg-red-50 border border-red-200 text-red-800"
        )}>
          {validation.valid ? (
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
          ) : (
            <XCircle className="w-4 h-4 flex-shrink-0" />
          )}
          <div>
            {validation.valid ? (
              <div>
                <p className="font-medium">קופון תקיף!</p>
                <p className="text-xs mt-1">
                  {validation.coupon && formatDiscountText(validation.coupon)} - {validation.coupon?.name}
                </p>
              </div>
            ) : (
              <p>{validation.error}</p>
            )}
          </div>
        </div>
      )}

      {/* Application Result */}
      {application && (
        <div className={cn(
          "p-3 rounded-lg text-sm",
          application.success
            ? "bg-green-50 border border-green-200 text-green-800"
            : "bg-red-50 border border-red-200 text-red-800"
        )}>
          {application.success ? (
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <div>
                <p className="font-medium">הקופון נוצל בהצלחה!</p>
                {application.discount_amount && (
                  <p className="text-xs mt-1">
                    חיסכון: ₪{application.discount_amount}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4" />
              <p>{application.error}</p>
            </div>
          )}
        </div>
      )}

      {/* Error Display */}
      {error && !validation && !application && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
          <div className="flex items-center gap-2">
            <XCircle className="w-4 h-4" />
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Coupon Info */}
      {validation?.valid && validation.coupon && (
        <div className="text-xs text-muted space-y-1">
          {validation.coupon.trial_trigger && (
            <p>✓ הקופון יפעיל תקופת ניסיון אוטומטית</p>
          )}
        </div>
      )}
    </div>
  );
}
