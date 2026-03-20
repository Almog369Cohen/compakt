import type { SupabaseClient } from "@supabase/supabase-js";

export interface Coupon {
  id: string;
  code: string;
  name: string;
  description: string | null;
  discount_type: "percentage" | "fixed_amount" | "free_trial";
  discount_value: number;
  discount_currency: string;
  max_uses: number | null;
  used_count: number;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  min_plan_value: number | null;
  applicable_plans: string[];
  first_time_only: boolean;
  trial_trigger: boolean;
}

export interface CouponUsage {
  id: string;
  coupon_id: string;
  profile_id: string;
  subscription_id: string | null;
  discount_applied: number;
  discount_currency: string;
  used_at: string;
  created_at: string;
}

export interface CouponValidation {
  valid: boolean;
  error?: string;
  coupon?: {
    id: string;
    code: string;
    name: string;
    discount_type: "percentage" | "fixed_amount" | "free_trial";
    discount_value: number;
    discount_currency: string;
    trial_trigger: boolean;
  };
}

export interface CouponApplication {
  success: boolean;
  error?: string;
  usage_id?: string;
  discount_amount?: number;
  discount_currency?: string;
  coupon_details?: any;
}

export interface CouponAnalytics {
  coupon_id: string;
  coupon_name: string;
  coupon_code: string;
  total_views: number;
  total_applications: number;
  total_discount: number;
  conversion_rate: number;
  created_at: string;
}

export async function validateCoupon(
  service: SupabaseClient,
  code: string,
  profileId?: string,
  planValue?: number,
  planKey?: string
): Promise<CouponValidation> {
  try {
    const { data, error } = await service.rpc("validate_coupon", {
      p_code: code,
      p_profile_id: profileId,
      p_plan_value: planValue,
      p_plan_key: planKey,
    });

    if (error) throw error;

    return data as CouponValidation;
  } catch (error) {
    console.error("Error validating coupon:", error);
    return {
      valid: false,
      error: error instanceof Error ? error.message : "Failed to validate coupon",
    };
  }
}

export async function applyCoupon(
  service: SupabaseClient,
  code: string,
  profileId: string,
  subscriptionId?: string,
  planValue?: number,
  planKey?: string
): Promise<CouponApplication> {
  try {
    const { data, error } = await service.rpc("apply_coupon", {
      p_code: code,
      p_profile_id: profileId,
      p_subscription_id: subscriptionId,
      p_plan_value: planValue,
      p_plan_key: planKey,
    });

    if (error) throw error;

    return data as CouponApplication;
  } catch (error) {
    console.error("Error applying coupon:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to apply coupon",
    };
  }
}

export async function createCoupon(
  service: SupabaseClient,
  name: string,
  discountType: "percentage" | "fixed_amount" | "free_trial",
  discountValue: number,
  options: {
    description?: string;
    maxUses?: number;
    validDays?: number;
    minPlanValue?: number;
    applicablePlans?: string[];
    firstTimeOnly?: boolean;
    trialTrigger?: boolean;
    createdBy?: string;
  } = {}
): Promise<{ couponId: string; success: boolean; error?: string }> {
  try {
    const { data, error } = await service.rpc("create_coupon", {
      p_name: name,
      p_description: options.description || null,
      p_discount_type: discountType,
      p_discount_value: discountValue,
      p_max_uses: options.maxUses || null,
      p_valid_days: options.validDays || 30,
      p_min_plan_value: options.minPlanValue || null,
      p_applicable_plans: options.applicablePlans || ["starter", "pro", "premium", "enterprise"],
      p_first_time_only: options.firstTimeOnly || false,
      p_trial_trigger: options.trialTrigger || false,
      p_created_by: options.createdBy || null,
    });

    if (error) throw error;

    return {
      couponId: data,
      success: true,
    };
  } catch (error) {
    return {
      couponId: "",
      success: false,
      error: error instanceof Error ? error.message : "Failed to create coupon",
    };
  }
}

export async function getCoupons(
  service: SupabaseClient,
  options: {
    active?: boolean;
    includeExpired?: boolean;
    createdBy?: string;
    limit?: number;
  } = {}
): Promise<Coupon[]> {
  try {
    let query = service
      .from("coupons")
      .select("*")
      .order("created_at", { ascending: false });

    if (options.active !== undefined) {
      query = query.eq("is_active", options.active);
    }

    if (!options.includeExpired) {
      query = query.gte("valid_until", new Date().toISOString());
    }

    if (options.createdBy) {
      query = query.eq("created_by", options.createdBy);
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) throw error;

    return (data || []) as Coupon[];
  } catch (error) {
    console.error("Error getting coupons:", error);
    return [];
  }
}

export async function getCoupon(
  service: SupabaseClient,
  couponId: string
): Promise<Coupon | null> {
  try {
    const { data, error } = await service
      .from("coupons")
      .select("*")
      .eq("id", couponId)
      .single();

    if (error) throw error;

    return data as Coupon;
  } catch (error) {
    console.error("Error getting coupon:", error);
    return null;
  }
}

export async function getCouponByCode(
  service: SupabaseClient,
  code: string
): Promise<Coupon | null> {
  try {
    const { data, error } = await service
      .from("coupons")
      .select("*")
      .eq("code", code)
      .single();

    if (error) throw error;

    return data as Coupon;
  } catch (error) {
    console.error("Error getting coupon by code:", error);
    return null;
  }
}

export async function updateCoupon(
  service: SupabaseClient,
  couponId: string,
  updates: Partial<Omit<Coupon, "id" | "code" | "created_at" | "updated_at" | "used_count">>
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await service
      .from("coupons")
      .update(updates)
      .eq("id", couponId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update coupon",
    };
  }
}

export async function deleteCoupon(
  service: SupabaseClient,
  couponId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await service
      .from("coupons")
      .update({ is_active: false })
      .eq("id", couponId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete coupon",
    };
  }
}

export async function getCouponUsages(
  service: SupabaseClient,
  couponId?: string,
  profileId?: string
): Promise<CouponUsage[]> {
  try {
    let query = service
      .from("coupon_usages")
      .select(`
        *,
        coupons!inner (
          code,
          name,
          discount_type,
          discount_value
        ),
        profiles!inner (
          business_name,
          email
        )
      `)
      .order("used_at", { ascending: false });

    if (couponId) {
      query = query.eq("coupon_id", couponId);
    }

    if (profileId) {
      query = query.eq("profile_id", profileId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return (data || []) as CouponUsage[];
  } catch (error) {
    console.error("Error getting coupon usages:", error);
    return [];
  }
}

export async function getCouponAnalytics(
  service: SupabaseClient,
  couponId?: string
): Promise<CouponAnalytics[]> {
  try {
    const { data, error } = await service.rpc("get_coupon_analytics", {
      p_coupon_id: couponId,
    });

    if (error) throw error;

    return (data || []) as CouponAnalytics[];
  } catch (error) {
    console.error("Error getting coupon analytics:", error);
    return [];
  }
}

export async function logCouponEvent(
  service: SupabaseClient,
  couponId: string,
  eventType: "viewed" | "applied" | "expired" | "deactivated",
  eventData?: Record<string, unknown>,
  ipAddress?: string,
  userAgent?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await service.from("coupon_analytics").insert({
      coupon_id: couponId,
      event_type: eventType,
      event_data: eventData || {},
      ip_address: ipAddress,
      user_agent: userAgent,
    });

    if (error) throw error;

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to log coupon event",
    };
  }
}

// Helper functions
export function formatDiscountText(coupon: Coupon): string {
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
}

export function isCouponValid(coupon: Coupon): boolean {
  return (
    coupon.is_active &&
    new Date(coupon.valid_from) <= new Date() &&
    new Date(coupon.valid_until) >= new Date() &&
    (coupon.max_uses === null || coupon.used_count < coupon.max_uses)
  );
}

export function getCouponStatus(coupon: Coupon): "active" | "expired" | "used_up" | "inactive" {
  if (!coupon.is_active) return "inactive";
  if (new Date(coupon.valid_until) < new Date()) return "expired";
  if (coupon.max_uses && coupon.used_count >= coupon.max_uses) return "used_up";
  return "active";
}

export function getCouponStatusColor(status: string): string {
  switch (status) {
    case "active":
      return "text-green-600";
    case "expired":
      return "text-red-600";
    case "used_up":
      return "text-yellow-600";
    case "inactive":
      return "text-gray-600";
    default:
      return "text-gray-600";
  }
}

export function calculateDiscountAmount(
  coupon: Coupon,
  planValue: number
): number {
  switch (coupon.discount_type) {
    case "percentage":
      return planValue * (coupon.discount_value / 100);
    case "fixed_amount":
      return coupon.discount_value;
    case "free_trial":
      return 0;
    default:
      return 0;
  }
}
