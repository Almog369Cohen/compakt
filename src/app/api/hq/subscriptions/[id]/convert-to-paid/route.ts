import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { requireAuth, isAuthError } from "@/lib/requireAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/hq/subscriptions/[id]/convert-to-paid
 * Convert trial subscription to paid (staff/owner only)
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAuth({ allowedRoles: ["staff", "owner"] });
    if (isAuthError(auth)) return auth;

    const { paymentReference, amountPaid } = await request.json();

    if (!paymentReference) {
      return NextResponse.json(
        { error: "Payment reference is required" },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    // Call SQL function to convert trial to paid
    const { error } = await supabase.rpc('convert_trial_to_paid', {
      p_subscription_id: params.id,
      p_payment_reference: paymentReference,
      p_amount_paid: amountPaid || null
    });

    if (error) {
      console.error("Error converting trial to paid:", error);
      return NextResponse.json(
        { error: error.message || "Failed to convert subscription" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Subscription converted to paid successfully"
    });

  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
