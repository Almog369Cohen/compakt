import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { requireAuth, isAuthError } from "@/lib/requireAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/hq/subscriptions
 * Get all subscriptions (staff/owner only)
 */
export async function GET(request: Request) {
  try {
    const auth = await requireAuth({ allowedRoles: ["staff", "owner"] });
    if (isAuthError(auth)) return auth;

    const supabase = getServiceSupabase();

    // Get URL params for filtering
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const plan = searchParams.get('plan');

    let query = supabase
      .from("subscriptions")
      .select(`
        id,
        profile_id,
        plan_key,
        status,
        started_at,
        expires_at,
        cancelled_at,
        payment_method,
        payment_reference,
        amount_paid,
        currency,
        coupon_id,
        notes,
        created_at,
        updated_at,
        profiles!inner (
          id,
          business_name,
          email,
          dj_slug,
          role
        ),
        coupons (
          code,
          name
        )
      `)
      .order("created_at", { ascending: false });

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }
    if (plan) {
      query = query.eq('plan_key', plan);
    }

    const { data: subscriptions, error } = await query;

    if (error) {
      console.error("Error fetching subscriptions:", error);
      return NextResponse.json(
        { error: "Failed to fetch subscriptions" },
        { status: 500 }
      );
    }

    // Calculate additional info
    const enrichedSubscriptions = subscriptions?.map(sub => {
      const now = new Date();
      const expiresAt = new Date(sub.expires_at);
      const daysRemaining = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      return {
        ...sub,
        daysRemaining,
        isExpiringSoon: daysRemaining <= 3 && daysRemaining > 0,
        isExpiredToday: daysRemaining === 0,
        profile: sub.profiles,
        coupon: sub.coupons
      };
    });

    return NextResponse.json({
      subscriptions: enrichedSubscriptions || []
    });

  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
