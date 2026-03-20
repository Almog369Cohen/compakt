"use client";

import { useState, useEffect } from "react";
import { Plus, Tag, Trash2, BarChart3, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type Coupon,
  type CouponAnalytics
} from "@/lib/coupon";

interface CouponManagerProps {
  className?: string;
}

export function CouponManager({ className }: CouponManagerProps) {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [analytics, setAnalytics] = useState<CouponAnalytics[]>([]);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    discountType: "percentage" as "percentage" | "fixed_amount" | "free_trial",
    discountValue: "",
    maxUses: "",
    validDays: "30",
    minPlanValue: "",
    applicablePlans: ["starter", "pro", "premium", "enterprise"],
    firstTimeOnly: false,
    trialTrigger: false,
  });

  useEffect(() => {
    loadCoupons();
    loadAnalytics();
  }, []);

  const loadCoupons = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/hq/coupons");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load coupons");
      }

      setCoupons(data.coupons || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load coupons");
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      const response = await fetch("/api/hq/coupons/analytics");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load analytics");
      }

      setAnalytics(data.analytics || []);
    } catch (err) {
      console.error("Failed to load analytics:", err);
    }
  };

  const handleCreateCoupon = async () => {
    try {
      setCreating(true);
      setError(null);

      // Validate form
      if (!formData.name || !formData.discountValue) {
        setError("Name and discount value are required");
        return;
      }

      const response = await fetch("/api/hq/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          discountType: formData.discountType,
          discountValue: parseFloat(formData.discountValue),
          maxUses: formData.maxUses ? parseInt(formData.maxUses) : null,
          validDays: parseInt(formData.validDays),
          minPlanValue: formData.minPlanValue ? parseFloat(formData.minPlanValue) : null,
          applicablePlans: formData.applicablePlans,
          firstTimeOnly: formData.firstTimeOnly,
          trialTrigger: formData.trialTrigger,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create coupon");
      }

      setSuccess("Coupon created successfully!");
      setShowCreateForm(false);
      setFormData({
        name: "",
        description: "",
        discountType: "percentage",
        discountValue: "",
        maxUses: "",
        validDays: "30",
        minPlanValue: "",
        applicablePlans: ["starter", "pro", "premium", "enterprise"],
        firstTimeOnly: false,
        trialTrigger: false,
      });

      await loadCoupons();
      await loadAnalytics();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create coupon");
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateCoupon = async (couponId: string, updates: Partial<Coupon>) => {
    try {
      setError(null);

      const response = await fetch(`/api/hq/coupons/${couponId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update coupon");
      }

      setSuccess("Coupon updated successfully!");
      await loadCoupons();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update coupon");
    }
  };

  const handleDeleteCoupon = async (couponId: string) => {
    if (!confirm("Are you sure you want to deactivate this coupon?")) return;

    try {
      setError(null);

      const response = await fetch(`/api/hq/coupons/${couponId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete coupon");
      }

      setSuccess("Coupon deactivated successfully!");
      await loadCoupons();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete coupon");
    }
  };

  const getCouponStatus = (coupon: Coupon) => {
    if (!coupon.is_active) return { text: "לא פעיל", color: "text-gray-600" };
    if (new Date(coupon.valid_until) < new Date()) return { text: "פג תוקף", color: "text-red-600" };
    if (coupon.max_uses && coupon.used_count >= coupon.max_uses) return { text: "מוגבל", color: "text-yellow-600" };
    return { text: "פעיל", color: "text-green-600" };
  };

  const formatDiscountText = (coupon: Coupon) => {
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

  const getUsagePercentage = (coupon: Coupon) => {
    if (!coupon.max_uses) return 0;
    return Math.min((coupon.used_count / coupon.max_uses) * 100, 100);
  };

  if (loading) {
    return (
      <div className={cn("glass-card p-6 animate-pulse", className)}>
        <div className="h-6 bg-glass rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-glass rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Tag className="w-5 h-5" />
          ניהול קופונים
        </h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="btn-primary text-sm flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          צור קופון חדש
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="glass-card p-4 text-red-600 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="glass-card p-4 text-green-600 text-sm">
          {success}
        </div>
      )}

      {/* Create Form */}
      {showCreateForm && (
        <div className="glass-card p-6">
          <h3 className="font-medium mb-4">צור קופון חדש</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">שם הקופון</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-glass bg-transparent"
                placeholder="לדוגמה: הנחת השקה"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">תיאור</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-glass bg-transparent"
                placeholder="תיאור קצר של הקופון"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">סוג הנחה</label>
              <select
                value={formData.discountType}
                onChange={(e) => setFormData({ ...formData, discountType: e.target.value as any })}
                className="w-full px-3 py-2 rounded-lg border border-glass bg-transparent"
              >
                <option value="percentage">אחוז הנחה</option>
                <option value="fixed_amount">סכום קבוע</option>
                <option value="free_trial">ניסיון חינם</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                ערך הנחה {formData.discountType === "percentage" ? "(%)" : formData.discountType === "fixed_amount" ? "(₪)" : ""}
              </label>
              <input
                type="number"
                value={formData.discountValue}
                onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-glass bg-transparent"
                placeholder={formData.discountType === "percentage" ? "10" : "50"}
                min="0"
                max={formData.discountType === "percentage" ? "100" : undefined}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">מספר שימושים מקסימלי</label>
              <input
                type="number"
                value={formData.maxUses}
                onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-glass bg-transparent"
                placeholder="השאר ריק ללא הגבלה"
                min="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">תקופת תוקף (ימים)</label>
              <input
                type="number"
                value={formData.validDays}
                onChange={(e) => setFormData({ ...formData, validDays: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-glass bg-transparent"
                placeholder="30"
                min="1"
                max="365"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 mt-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.firstTimeOnly}
                onChange={(e) => setFormData({ ...formData, firstTimeOnly: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm">ללקוחות חדשים בלבד</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.trialTrigger}
                onChange={(e) => setFormData({ ...formData, trialTrigger: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm">מפעיל ניסיון אוטומטית</span>
            </label>
          </div>

          <div className="flex gap-2 mt-6">
            <button
              onClick={handleCreateCoupon}
              disabled={creating}
              className="btn-primary flex items-center gap-2"
            >
              {creating ? "יוצר..." : "צור קופון"}
            </button>
            <button
              onClick={() => setShowCreateForm(false)}
              className="btn-secondary"
            >
              ביטול
            </button>
          </div>
        </div>
      )}

      {/* Coupons List */}
      <div className="space-y-3">
        {coupons.length === 0 ? (
          <div className="glass-card p-8 text-center text-muted">
            <Tag className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>אין קופונים פעילים</p>
          </div>
        ) : (
          coupons.map((coupon) => {
            const status = getCouponStatus(coupon);
            const couponAnalytics = analytics.find(a => a.coupon_id === coupon.id);

            return (
              <div key={coupon.id} className="glass-card p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-medium">{coupon.name}</p>
                    <p className="text-sm text-muted">{coupon.code}</p>
                    <p className="text-sm font-medium text-brand-blue">
                      {formatDiscountText(coupon)}
                    </p>
                  </div>
                  <div className="text-left">
                    <p className={cn("text-sm font-medium", status.color)}>
                      {status.text}
                    </p>
                    <p className="text-xs text-muted">
                      {coupon.used_count} / {coupon.max_uses || "∞"} שימושים
                    </p>
                  </div>
                </div>

                {/* Usage Progress */}
                {coupon.max_uses && (
                  <div className="mb-3">
                    <div className="w-full bg-glass rounded-full h-2">
                      <div
                        className={cn(
                          "h-2 rounded-full transition-all",
                          getUsagePercentage(coupon) < 50 && "bg-green-500",
                          getUsagePercentage(coupon) >= 50 && getUsagePercentage(coupon) < 80 && "bg-yellow-500",
                          getUsagePercentage(coupon) >= 80 && "bg-red-500"
                        )}
                        style={{ width: `${getUsagePercentage(coupon)}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Analytics */}
                {couponAnalytics && (
                  <div className="grid grid-cols-4 gap-4 text-xs mb-3">
                    <div className="text-center">
                      <p className="font-medium">{couponAnalytics.total_views}</p>
                      <p className="text-muted">צפיות</p>
                    </div>
                    <div className="text-center">
                      <p className="font-medium">{couponAnalytics.total_applications}</p>
                      <p className="text-muted">שימושים</p>
                    </div>
                    <div className="text-center">
                      <p className="font-medium">{couponAnalytics.conversion_rate}%</p>
                      <p className="text-muted">המרה</p>
                    </div>
                    <div className="text-center">
                      <p className="font-medium">₪{couponAnalytics.total_discount}</p>
                      <p className="text-muted">חיסכון כולל</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-muted">
                  <div className="flex items-center gap-4">
                    <span>תוקף עד: {new Date(coupon.valid_until).toLocaleDateString("he-IL")}</span>
                    {coupon.first_time_only && <span>ללקוחות חדשים</span>}
                    {coupon.trial_trigger && <span>מפעיל ניסיון</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedCoupon(coupon)}
                      className="p-1.5 rounded hover:bg-white/5 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteCoupon(coupon.id)}
                      className="p-1.5 rounded hover:bg-red-50 text-red-600 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
