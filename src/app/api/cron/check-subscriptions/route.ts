import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/cron/check-subscriptions
 * Check and expire subscriptions (run daily via cron)
 * Can be called manually or via cron service
 */
export async function GET(request: Request) {
  try {
    // Optional: Add cron secret verification
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const supabase = getServiceSupabase();

    // Call SQL function to check and expire subscriptions
    const { data: expiredSubscriptions, error } = await supabase
      .rpc('check_expired_subscriptions');

    if (error) {
      console.error("Error checking subscriptions:", error);
      return NextResponse.json(
        { error: "Failed to check subscriptions" },
        { status: 500 }
      );
    }

    const trialsExpired = expiredSubscriptions?.filter((s: any) => s.event_type === 'trial_expired').length || 0;
    const subscriptionsExpired = expiredSubscriptions?.filter((s: any) => s.event_type === 'expired').length || 0;

    console.log(`Subscription check completed: ${trialsExpired} trials expired, ${subscriptionsExpired} subscriptions expired`);

    return NextResponse.json({
      success: true,
      trialsExpired,
      subscriptionsExpired,
      totalExpired: expiredSubscriptions?.length || 0,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
