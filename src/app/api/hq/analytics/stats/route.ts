import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { requireAuth, isAuthError } from "@/lib/requireAuth";
import { loadResolvedAccessByUserId } from "@/lib/access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const auth = await requireAuth();
    if (isAuthError(auth)) return auth;

    const supabase = getServiceSupabase();
    const { access } = await loadResolvedAccessByUserId(supabase, auth.userId);

    if (!access || (access.role !== "staff" && access.role !== "owner")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get all profiles
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, role, plan, is_active, created_at");

    if (profilesError) {
      return NextResponse.json({ error: profilesError.message }, { status: 500 });
    }

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Calculate stats
    const totalUsers = profiles.length;
    const activeUsers = profiles.filter((p) => p.is_active).length;
    const premiumUsers = profiles.filter((p) => p.plan === "premium").length;
    const starterUsers = profiles.filter((p) => p.plan === "starter").length;
    const staffUsers = profiles.filter((p) => p.role === "staff" || p.role === "owner").length;

    const newUsersLast7Days = profiles.filter(
      (p) => new Date(p.created_at) >= sevenDaysAgo
    ).length;

    const newUsersLast30Days = profiles.filter(
      (p) => new Date(p.created_at) >= thirtyDaysAgo
    ).length;

    // Calculate conversion rate (starter to premium)
    const conversionRate = totalUsers > 0 ? (premiumUsers / totalUsers) * 100 : 0;

    // Calculate revenue projection (Premium users × ₪149)
    const monthlyRevenue = premiumUsers * 149;
    const yearlyRevenue = monthlyRevenue * 12;

    // Get inactive users (30+ days without activity)
    const inactiveUsers = profiles.filter((p) => {
      if (!p.is_active) return true;
      // Could add more sophisticated activity tracking here
      return false;
    }).length;

    // Plan distribution
    const planDistribution = {
      starter: starterUsers,
      premium: premiumUsers,
      pro: profiles.filter((p) => p.plan === "pro").length,
    };

    // Role distribution
    const roleDistribution = {
      dj: profiles.filter((p) => p.role === "dj").length,
      staff: profiles.filter((p) => p.role === "staff").length,
      owner: profiles.filter((p) => p.role === "owner").length,
    };

    return NextResponse.json({
      overview: {
        totalUsers,
        activeUsers,
        activePercentage: totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0,
        premiumUsers,
        starterUsers,
        staffUsers,
        inactiveUsers,
      },
      growth: {
        newUsersLast7Days,
        newUsersLast30Days,
      },
      conversion: {
        rate: conversionRate,
        starterToPremium: premiumUsers,
        potentialUpgrades: starterUsers,
      },
      revenue: {
        monthly: monthlyRevenue,
        yearly: yearlyRevenue,
        perUser: 149,
      },
      distribution: {
        plans: planDistribution,
        roles: roleDistribution,
      },
    });
  } catch (error) {
    console.error("Analytics stats error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load stats" },
      { status: 500 }
    );
  }
}
