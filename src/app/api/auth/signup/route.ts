import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/auth/signup
 * Simple signup with automatic trial - no coupon required
 */
export async function POST(request: Request) {
  try {
    const { email, password, businessName, plan = 'pro' } = await request.json();

    // Validate input
    if (!email || !password || !businessName) {
      return NextResponse.json(
        { error: "כל השדות נדרשים" },
        { status: 400 }
      );
    }

    // Validate plan
    const validPlans = ['starter', 'pro', 'premium', 'enterprise'];
    if (!validPlans.includes(plan)) {
      return NextResponse.json(
        { error: "חבילה לא תקפה" },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    // 1. Create auth user
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

    // 2. Create profile with trial
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 7); // 7 days trial

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .insert({
        user_id: authData.user.id,
        email: email,
        business_name: businessName,
        role: 'dj',
        plan: plan,
        is_active: true,
        subscription_status: 'trialing',
        trial_ends_at: trialEndsAt.toISOString()
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

    // 3. Create trial subscription
    const { data: subscription, error: subscriptionError } = await supabase
      .from("subscriptions")
      .insert({
        profile_id: profile.id,
        plan_key: plan,
        status: 'trial',
        started_at: new Date().toISOString(),
        expires_at: trialEndsAt.toISOString(),
        payment_method: 'trial'
      })
      .select()
      .single();

    if (subscriptionError) {
      console.error("Subscription creation error:", subscriptionError);
      // Don't fail the signup, but log the error
    }

    // 4. Log subscription event
    if (subscription) {
      await supabase
        .from("subscription_events")
        .insert({
          subscription_id: subscription.id,
          event_type: 'trial_started',
          event_data: {
            plan: plan,
            trial_days: 7,
            trial_ends_at: trialEndsAt.toISOString()
          }
        });
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
          role: profile.role,
          trialEndsAt: trialEndsAt.toISOString()
        }
      },
      subscription: subscription ? {
        id: subscription.id,
        status: 'trial',
        expiresAt: trialEndsAt.toISOString(),
        daysRemaining: 7
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
