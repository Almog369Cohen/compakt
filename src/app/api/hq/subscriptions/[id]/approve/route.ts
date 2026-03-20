import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { requireAuth, isAuthError } from "@/lib/requireAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/hq/subscriptions/[id]/approve
 * Approve payment and convert trial to paid (staff/owner only)
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAuth({ allowedRoles: ["staff", "owner"] });
    if (isAuthError(auth)) return auth;

    const { paymentReference, amount } = await request.json();

    if (!paymentReference) {
      return NextResponse.json(
        { error: "Payment reference is required" },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    // Get subscription
    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .select("id, profile_id, plan_key, status")
      .eq('id', params.id)
      .single();

    if (subError || !subscription) {
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 }
      );
    }

    if (subscription.status !== 'trial') {
      return NextResponse.json(
        { error: "Subscription is not in trial status" },
        { status: 400 }
      );
    }

    // Convert trial to paid using SQL function
    const { error: convertError } = await supabase.rpc('convert_trial_to_paid', {
      p_subscription_id: params.id,
      p_payment_reference: paymentReference,
      p_amount_paid: amount || null
    });

    if (convertError) {
      console.error("Error converting trial to paid:", convertError);
      return NextResponse.json(
        { error: convertError.message || "Failed to approve subscription" },
        { status: 500 }
      );
    }

    // Log approval by staff
    await supabase
      .from("subscription_events")
      .insert({
        subscription_id: params.id,
        event_type: 'payment_received',
        event_data: {
          payment_reference: paymentReference,
          amount_paid: amount,
          approved_by: auth.profileId
        },
        created_by: auth.profileId
      });

    return NextResponse.json({
      success: true,
      message: "Subscription approved successfully"
    });

  } catch (error) {
    console.error("Approve subscription error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
