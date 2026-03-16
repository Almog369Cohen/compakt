import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { requireAuth, isAuthError } from "@/lib/requireAuth";
import { loadResolvedAccessByUserId } from "@/lib/access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (isAuthError(auth)) return auth;

    const supabase = getServiceSupabase();
    const { access } = await loadResolvedAccessByUserId(supabase, auth.userId);

    if (!access || (access.role !== "staff" && access.role !== "owner")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const searchParams = req.nextUrl.searchParams;
    const days = parseInt(searchParams.get("days") || "30", 10);

    // Get all profiles
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("created_at, plan, role, is_active")
      .order("created_at", { ascending: true });

    if (profilesError) {
      return NextResponse.json({ error: profilesError.message }, { status: 500 });
    }

    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    // Group by date
    const dailyData: Record<string, { total: number; premium: number; starter: number; active: number }> = {};

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const dateKey = date.toISOString().split("T")[0];
      dailyData[dateKey] = { total: 0, premium: 0, starter: 0, active: 0 };
    }

    // Count new users per day
    profiles.forEach((profile) => {
      const createdDate = new Date(profile.created_at);
      if (createdDate >= startDate && createdDate <= now) {
        const dateKey = createdDate.toISOString().split("T")[0];
        if (dailyData[dateKey]) {
          dailyData[dateKey].total++;
          if (profile.plan === "premium") dailyData[dateKey].premium++;
          if (profile.plan === "starter") dailyData[dateKey].starter++;
          if (profile.is_active) dailyData[dateKey].active++;
        }
      }
    });

    // Convert to array format for charts
    const chartData = Object.entries(dailyData)
      .map(([date, counts]) => ({
        date,
        total: counts.total,
        premium: counts.premium,
        starter: counts.starter,
        active: counts.active,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Calculate cumulative data
    let cumulativeTotal = 0;
    let cumulativePremium = 0;
    let cumulativeStarter = 0;

    const cumulativeData = chartData.map((day) => {
      cumulativeTotal += day.total;
      cumulativePremium += day.premium;
      cumulativeStarter += day.starter;

      return {
        date: day.date,
        total: cumulativeTotal,
        premium: cumulativePremium,
        starter: cumulativeStarter,
      };
    });

    return NextResponse.json({
      daily: chartData,
      cumulative: cumulativeData,
      period: {
        days,
        startDate: startDate.toISOString().split("T")[0],
        endDate: now.toISOString().split("T")[0],
      },
    });
  } catch (error) {
    console.error("Growth data error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load growth data" },
      { status: 500 }
    );
  }
}
