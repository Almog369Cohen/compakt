import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { applyCoupon, logCouponEvent } from "@/lib/coupon";
import { requireAuth, isAuthError } from "@/lib/requireAuth";
import { loadAccessProfileByIdentity } from "@/lib/access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const auth = await requireAuth();
    if (isAuthError(auth)) return auth;

    const { code, subscriptionId, planValue, planKey } = await request.json();

    if (!code) {
      return NextResponse.json(
        { error: "Coupon code is required" },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();
    
    // Get user profile
    const profile = await loadAccessProfileByIdentity(supabase, {
      profileId: auth.profileId,
      userId: auth.userId,
      email: auth.email,
    });

    if (!profile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    // Apply coupon
    const application = await applyCoupon(
      supabase,
      code,
      profile.id,
      subscriptionId,
      planValue,
      planKey
    );

    if (application.success) {
      // Log successful application
      if (application.coupon_details) {
        await logCouponEvent(
          supabase,
          application.coupon_details.id,
          "applied",
          {
            profile_id: profile.id,
            subscription_id: subscriptionId,
            discount_amount: application.discount_amount,
            plan_value: planValue,
            plan_key: planKey,
            usage_id: application.usage_id,
          },
          request.headers.get("x-forwarded-for") || undefined,
          request.headers.get("user-agent") || undefined
        );
      }

      // If coupon triggers trial, start trial
      if (application.coupon_details?.trial_trigger) {
        try {
          const trialResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/trials/start`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              planKey: planKey || "pro",
              trialDays: 14,
              source: "coupon_triggered",
            }),
          });

          if (trialResponse.ok) {
            const trialData = await trialResponse.json();
            console.log("Trial started from coupon:", trialData.trialId);
          }
        } catch (trialError) {
          console.error("Failed to start trial from coupon:", trialError);
          // Don't fail the coupon application if trial fails
        }
      }
    }

    return NextResponse.json(application);
  } catch (error) {
    console.error("Error applying coupon:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
