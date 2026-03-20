import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/auth/signup-with-coupon
 * Create account with coupon code - creates profile + subscription
 */
export async function POST(request: Request) {
  try {
    const { email, password, businessName, couponCode } = await request.json();

    // Validate input
    if (!email || !password || !businessName || !couponCode) {
      return NextResponse.json(
        { error: "כל השדות נדרשים" },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    // 1. Validate coupon first
    const { data: coupon, error: couponError } = await supabase
      .from("coupons")
      .select("id, code, applicable_plans, trial_duration_days, subscription_duration_days, max_uses, used_count, is_active, valid_from, valid_until")
      .eq("code", couponCode.toUpperCase())
      .single();

    if (couponError || !coupon) {
      return NextResponse.json(
        { error: "קופון לא תקף" },
        { status: 400 }
      );
    }

    if (!coupon.is_active) {
      return NextResponse.json(
        { error: "קופון לא פעיל" },
        { status: 400 }
      );
    }

    // Check validity dates
    const now = new Date();
    if (now < new Date(coupon.valid_from) || now > new Date(coupon.valid_until)) {
      return NextResponse.json(
        { error: "הקופון אינו תקף כרגע" },
        { status: 400 }
      );
    }

    // Check max uses
    if (coupon.max_uses !== null && coupon.used_count >= coupon.max_uses) {
      return NextResponse.json(
        { error: "הקופון הגיע למספר השימושים המקסימלי" },
        { status: 400 }
      );
    }

    // 2. Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          business_name: businessName,
        }
      }
    });

    if (authError) {
      console.error("Auth signup error:", authError);
      return NextResponse.json(
        { error: authError.message === "User already registered" ? "המייל כבר רשום במערכת" : "שגיאה ביצירת חשבון" },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: "שגיאה ביצירת משתמש" },
        { status: 500 }
      );
    }

    // 3. Create profile
    const plan = coupon.applicable_plans?.[0] || 'pro';
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .insert({
        user_id: authData.user.id,
        email: email,
        business_name: businessName,
        role: 'dj',
        plan: plan,
        is_active: true,
        subscription_status: 'trialing'
      })
      .select()
      .single();

    if (profileError || !profile) {
      console.error("Profile creation error:", profileError);
      // Cleanup: delete auth user if profile creation failed
      await supabase.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { error: "שגיאה ביצירת פרופיל" },
        { status: 500 }
      );
    }

    // 4. Create subscription using SQL function
    const { data: subscriptionId, error: subscriptionError } = await supabase
      .rpc('create_subscription_from_coupon', {
        p_profile_id: profile.id,
        p_coupon_code: couponCode.toUpperCase()
      });

    if (subscriptionError) {
      console.error("Subscription creation error:", subscriptionError);
      // Don't fail the signup, but log the error
      // The user can still use the system, just without subscription tracking
    }

    // 5. Return success with session
    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        profile: {
          id: profile.id,
          businessName: profile.business_name,
          plan: profile.plan,
          role: profile.role
        }
      },
      subscription: subscriptionId ? {
        id: subscriptionId,
        status: 'trial',
        trialDays: coupon.trial_duration_days || 7
      } : null,
      session: authData.session
    });

  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "שגיאה כללית בהרשמה" },
      { status: 500 }
    );
  }
}
