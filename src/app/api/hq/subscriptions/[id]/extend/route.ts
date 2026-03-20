import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { requireAuth, isAuthError } from "@/lib/requireAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/hq/subscriptions/[id]/extend
 * Extend subscription by specified days (staff/owner only)
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAuth({ allowedRoles: ["staff", "owner"] });
    if (isAuthError(auth)) return auth;

    const { days, paymentReference } = await request.json();

    if (!days || days <= 0) {
      return NextResponse.json(
        { error: "Valid number of days is required" },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    // Call SQL function to extend subscription
    const { error } = await supabase.rpc('extend_subscription', {
      p_subscription_id: params.id,
      p_days: days,
      p_payment_reference: paymentReference || null
    });

    if (error) {
      console.error("Error extending subscription:", error);
      return NextResponse.json(
        { error: error.message || "Failed to extend subscription" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Subscription extended by ${days} days`
    });

  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
