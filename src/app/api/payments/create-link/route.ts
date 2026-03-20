import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { requireAuth, isAuthError } from "@/lib/requireAuth";
import { getPriceAmount } from "@/lib/pricing";
import type { PlanKey } from "@/lib/access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/payments/create-link
 * Create payment link for Morning (Green Invoice)
 */
export async function POST(request: Request) {
  try {
    const auth = await requireAuth();
    if (isAuthError(auth)) return auth;

    const { subscriptionId } = await request.json();

    if (!subscriptionId) {
      return NextResponse.json(
        { error: "Subscription ID is required" },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    // Get subscription details
    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .select(`
        id,
        profile_id,
        plan_key,
        status,
        profiles!inner (
          id,
          business_name,
          email
        )
      `)
      .eq('id', subscriptionId)
      .single();

    if (subError || !subscription) {
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 }
      );
    }

    // Verify user owns this subscription
    if (subscription.profile_id !== auth.profileId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    const plan = subscription.plan_key as PlanKey;
    const amount = getPriceAmount(plan);

    if (!amount) {
      return NextResponse.json(
        { error: "Invalid plan" },
        { status: 400 }
      );
    }

    // Create payment link with Morning API
    const morningApiKey = process.env.MORNING_API_KEY;
    const morningApiUrl = process.env.MORNING_API_URL || 'https://api.greeninvoice.co.il/api/v1';

    if (!morningApiKey) {
      console.error("Morning API key not configured");
      return NextResponse.json(
        { error: "Payment system not configured" },
        { status: 500 }
      );
    }

    const response = await fetch(`${morningApiUrl}/payments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${morningApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 1, // One-time charge
        amount: amount,
        currency: 'ILS',
        description: `Compakt - ${String(plan).charAt(0).toUpperCase() + String(plan).slice(1)} Plan`,
        successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success`,
        cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/payment/cancel`,
        metadata: {
          subscriptionId: subscription.id,
          profileId: subscription.profile_id,
          plan: plan
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Morning API error:", errorData);
      return NextResponse.json(
        { error: "Failed to create payment link" },
        { status: 500 }
      );
    }

    const paymentData = await response.json();

    // Log payment link creation
    await supabase
      .from("subscription_events")
      .insert({
        subscription_id: subscription.id,
        event_type: 'payment_link_created',
        event_data: {
          payment_id: paymentData.id,
          amount: amount,
          plan: plan
        }
      });

    return NextResponse.json({
      success: true,
      paymentUrl: paymentData.url,
      amount: amount,
      currency: 'ILS',
      plan: plan
    });

  } catch (error) {
    console.error("Create payment link error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
