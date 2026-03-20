import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { validateCoupon, logCouponEvent } from "@/lib/coupon";
import { requireAuth, isAuthError } from "@/lib/requireAuth";
import { loadAccessProfileByIdentity } from "@/lib/access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const auth = await requireAuth();
    if (isAuthError(auth)) return auth;

    const { code, planValue, planKey } = await request.json();

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

    // Validate coupon
    const validation = await validateCoupon(
      supabase,
      code,
      profile.id,
      planValue,
      planKey
    );

    // Log coupon view event
    if (validation.valid && validation.coupon) {
      await logCouponEvent(
        supabase,
        validation.coupon.id,
        "viewed",
        {
          plan_value: planValue,
          plan_key: planKey,
          profile_id: profile.id,
        },
        request.headers.get("x-forwarded-for") || undefined,
        request.headers.get("user-agent") || undefined
      );
    }

    return NextResponse.json(validation);
  } catch (error) {
    console.error("Error validating coupon:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
