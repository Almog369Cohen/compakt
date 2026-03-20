import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { requireAuth, isAuthError } from "@/lib/requireAuth";
import { getCouponAnalytics } from "@/lib/coupon";
import { loadAccessProfileByIdentity } from "@/lib/access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const auth = await requireAuth();
    if (isAuthError(auth)) return auth;

    // Only staff and owner can access coupon analytics
    const supabase = getServiceSupabase();
    const profile = await loadAccessProfileByIdentity(supabase, {
      profileId: auth.profileId,
      userId: auth.userId,
      email: auth.email,
    });

    if (!profile || !["staff", "owner"].includes(profile.role)) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    const analytics = await getCouponAnalytics(supabase);

    return NextResponse.json({
      success: true,
      analytics,
    });
  } catch (error) {
    console.error("Error loading coupon analytics:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
