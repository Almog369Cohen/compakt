import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/coupons/validate-public
 * Public endpoint for validating coupons during signup (no auth required)
 */
export async function POST(request: Request) {
  try {
    const { code } = await request.json();

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { valid: false, error: "Coupon code is required" },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    // Get coupon details
    const { data: coupon, error } = await supabase
      .from("coupons")
      .select("id, code, name, discount_type, discount_value, applicable_plans, trial_duration_days, subscription_duration_days, max_uses, used_count, valid_from, valid_until, is_active")
      .eq("code", code.toUpperCase())
      .single();

    if (error || !coupon) {
      return NextResponse.json({
        valid: false,
        error: "קופון לא תקף"
      });
    }

    // Check if coupon is active
    if (!coupon.is_active) {
      return NextResponse.json({
        valid: false,
        error: "קופון לא פעיל"
      });
    }

    // Check validity dates
    const now = new Date();
    const validFrom = new Date(coupon.valid_from);
    const validUntil = new Date(coupon.valid_until);

    if (now < validFrom) {
      return NextResponse.json({
        valid: false,
        error: "הקופון עדיין לא תקף"
      });
    }

    if (now > validUntil) {
      return NextResponse.json({
        valid: false,
        error: "הקופון פג תוקף"
      });
    }

    // Check max uses
    if (coupon.max_uses !== null && coupon.used_count >= coupon.max_uses) {
      return NextResponse.json({
        valid: false,
        error: "הקופון הגיע למספר השימושים המקסימלי"
      });
    }

    // Return valid coupon details
    return NextResponse.json({
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        name: coupon.name,
        plan: coupon.applicable_plans?.[0] || 'pro',
        trialDays: coupon.trial_duration_days || 7,
        subscriptionDays: coupon.subscription_duration_days || 30,
        discountType: coupon.discount_type,
        discountValue: coupon.discount_value
      }
    });
  } catch (error) {
    console.error("Error validating coupon:", error);
    return NextResponse.json(
      { valid: false, error: "שגיאה באימות הקופון" },
      { status: 500 }
    );
  }
}
