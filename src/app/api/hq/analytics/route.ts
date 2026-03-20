import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { requireAuth, isAuthError } from "@/lib/requireAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/hq/analytics
 * 
 * Returns comprehensive analytics data for the HQ dashboard
 * Includes user statistics, engagement metrics, and performance data
 */
export async function GET(req: Request) {
  try {
    const auth = await requireAuth({ allowedRoles: ["staff", "owner"] });
    if (isAuthError(auth)) return auth;

    const supabase = getServiceSupabase();
    const url = new URL(req.url);
    const timeframe = url.searchParams.get("timeframe") || "30d";
    const includeGuests = url.searchParams.get("includeGuests") === "true";

    // Calculate date range based on timeframe
    const endDate = new Date();
    const startDate = new Date();

    switch (timeframe) {
      case "7d":
        startDate.setDate(endDate.getDate() - 7);
        break;
      case "30d":
        startDate.setDate(endDate.getDate() - 30);
        break;
      case "90d":
        startDate.setDate(endDate.getDate() - 90);
        break;
      case "1y":
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(endDate.getDate() - 30);
    }

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    // Fetch analytics data in parallel
    const [
      usersResult,
      eventsResult,
      songsResult,
      questionsResult,
      trialsResult,
      engagementResult
    ] = await Promise.all([
      // User statistics
      supabase
        .from("profiles")
        .select("*")
        .gte("created_at", startDateStr)
        .lte("created_at", endDateStr),

      // Event statistics
      supabase
        .from("events")
        .select("*")
        .gte("created_at", startDateStr)
        .lte("created_at", endDateStr),

      // Song statistics
      supabase
        .from("songs")
        .select("*"),

      // Question statistics
      supabase
        .from("questions")
        .select("*"),

      // Trial statistics
      supabase
        .from("trial_periods")
        .select("*")
        .gte("trial_started_at", startDateStr)
        .lte("trial_started_at", endDateStr),

      // Engagement metrics (if guests data is available)
      includeGuests ? supabase
        .from("event_sessions")
        .select("*")
        .gte("created_at", startDateStr)
        .lte("created_at", endDateStr) : Promise.resolve({ data: [], error: null })
    ]);

    // Process user analytics
    const users = usersResult.data || [];
    const userStats = {
      total: users.length,
      newThisPeriod: users.filter(u => new Date(u.created_at) >= startDate).length,
      byRole: users.reduce((acc, user) => {
        acc[user.role || 'dj'] = (acc[user.role || 'dj'] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byPlan: users.reduce((acc, user) => {
        acc[user.plan || 'free'] = (acc[user.plan || 'free'] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      active: users.filter(u => u.is_active !== false).length,
      onboardingComplete: users.filter(u => u.onboarding_complete === true).length,
    };

    // Process event analytics
    const events = eventsResult.data || [];
    const eventStats = {
      total: events.length,
      newThisPeriod: events.filter(e => new Date(e.created_at) >= startDate).length,
      byStatus: events.reduce((acc, event) => {
        acc[event.status || 'draft'] = (acc[event.status || 'draft'] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      averageGuests: events.length > 0 ? Math.round(
        events.reduce((sum, e) => sum + (e.expected_guests || 0), 0) / events.length
      ) : 0,
    };

    // Process content analytics
    const songs = songsResult.data || [];
    const questions = questionsResult.data || [];
    const contentStats = {
      totalSongs: songs.length,
      totalQuestions: questions.length,
      averageSongsPerUser: users.length > 0 ? Math.round(songs.length / users.length) : 0,
      averageQuestionsPerUser: users.length > 0 ? Math.round(questions.length / users.length) : 0,
      songsByCategory: songs.reduce((acc, song) => {
        acc[song.category || 'other'] = (acc[song.category || 'other'] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      questionsByType: questions.reduce((acc, question) => {
        acc[question.question_type || 'text'] = (acc[question.question_type || 'text'] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };

    // Process trial analytics
    const trials = trialsResult.data || [];
    const trialStats = {
      total: trials.length,
      newThisPeriod: trials.length,
      conversionRate: trials.length > 0 ? Math.round(
        (trials.filter(t => t.converted_to_paid === true).length / trials.length) * 100
      ) : 0,
      averageDuration: trials.length > 0 ? Math.round(
        trials.reduce((sum, t) => {
          if (t.trial_ended_at && t.trial_started_at) {
            return sum + (new Date(t.trial_ended_at).getTime() - new Date(t.trial_started_at).getTime()) / (1000 * 60 * 60 * 24);
          }
          return sum;
        }, 0) / trials.length
      ) : 0,
      byPlan: trials.reduce((acc, trial) => {
        acc[trial.converted_to_plan || 'none'] = (acc[trial.converted_to_plan || 'none'] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };

    // Process engagement analytics
    const engagementStats = includeGuests && engagementResult.data ? {
      totalSessions: engagementResult.data.length,
      uniqueGuests: new Set(engagementResult.data.map(s => s.phone_number)).size,
      averageSessionDuration: engagementResult.data.length > 0 ? Math.round(
        engagementResult.data.reduce((sum, s) => {
          if (s.last_active_at && s.created_at) {
            return sum + (new Date(s.last_active_at).getTime() - new Date(s.created_at).getTime()) / (1000 * 60);
          }
          return sum;
        }, 0) / engagementResult.data.length
      ) : 0,
      completionRate: engagementResult.data.length > 0 ? Math.round(
        (engagementResult.data.filter(s => s.phone_verified === true).length / engagementResult.data.length) * 100
      ) : 0,
    } : {
      totalSessions: 0,
      uniqueGuests: 0,
      averageSessionDuration: 0,
      completionRate: 0,
    };

    // Calculate growth metrics
    const previousPeriodStart = new Date(startDate);
    previousPeriodStart.setDate(previousPeriodStart.getDate() - (endDate.getDate() - startDate.getDate()));
    const previousPeriodEnd = startDate;

    const [previousUsers, previousEvents] = await Promise.all([
      supabase
        .from("profiles")
        .select("created_at")
        .gte("created_at", previousPeriodStart.toISOString().split('T')[0])
        .lte("created_at", previousPeriodEnd.toISOString().split('T')[0]),

      supabase
        .from("events")
        .select("created_at")
        .gte("created_at", previousPeriodStart.toISOString().split('T')[0])
        .lte("created_at", previousPeriodEnd.toISOString().split('T')[0]),
    ]);

    const growthMetrics = {
      userGrowth: previousUsers.data && previousUsers.data.length > 0 ? Math.round(
        ((users.length - previousUsers.data.length) / previousUsers.data.length) * 100
      ) : 0,
      eventGrowth: previousEvents.data && previousEvents.data.length > 0 ? Math.round(
        ((events.length - previousEvents.data.length) / previousEvents.data.length) * 100
      ) : 0,
    };

    // Compile final analytics response
    const analytics = {
      timeframe,
      period: {
        start: startDateStr,
        end: endDateStr,
      },
      users: userStats,
      events: eventStats,
      content: contentStats,
      trials: trialStats,
      engagement: engagementStats,
      growth: growthMetrics,
      summary: {
        totalUsers: userStats.total,
        totalEvents: eventStats.total,
        totalSongs: contentStats.totalSongs,
        totalQuestions: contentStats.totalQuestions,
        activeUsers: userStats.active,
        conversionRate: trialStats.conversionRate,
        userGrowth: growthMetrics.userGrowth,
        eventGrowth: growthMetrics.eventGrowth,
      },
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json(analytics);

  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics data" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/hq/analytics/export
 * 
 * Export analytics data to CSV/Excel format
 */
export async function POST(req: Request) {
  try {
    const auth = await requireAuth({ allowedRoles: ["staff", "owner"] });
    if (isAuthError(auth)) return auth;

    const body = await req.json();
    const { format = "csv", timeframe = "30d" } = body;

    // Get analytics data
    const analyticsResponse = await GET(req);
    const analytics = await analyticsResponse.json();

    if (format === "csv") {
      // Convert analytics to CSV format
      const csvData = convertToCSV(analytics);

      return new NextResponse(csvData, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="compakt-analytics-${timeframe}.csv"`,
        },
      });
    } else {
      // For Excel, we'd need a library like xlsx
      return NextResponse.json(
        { error: "Excel export not yet implemented" },
        { status: 501 }
      );
    }

  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      { error: "Failed to export analytics" },
      { status: 500 }
    );
  }
}

/**
 * Convert analytics data to CSV format
 */
function convertToCSV(analytics: any): string {
  const headers = [
    "Metric",
    "Value",
    "Period",
    "Generated At"
  ];

  const rows = [
    ["Total Users", analytics.users.total, analytics.timeframe, analytics.generatedAt],
    ["New Users", analytics.users.newThisPeriod, analytics.timeframe, analytics.generatedAt],
    ["Active Users", analytics.users.active, analytics.timeframe, analytics.generatedAt],
    ["Total Events", analytics.events.total, analytics.timeframe, analytics.generatedAt],
    ["New Events", analytics.events.newThisPeriod, analytics.timeframe, analytics.generatedAt],
    ["Total Songs", analytics.content.totalSongs, analytics.timeframe, analytics.generatedAt],
    ["Total Questions", analytics.content.totalQuestions, analytics.timeframe, analytics.generatedAt],
    ["Total Trials", analytics.trials.total, analytics.timeframe, analytics.generatedAt],
    ["Conversion Rate", `${analytics.trials.conversionRate}%`, analytics.timeframe, analytics.generatedAt],
    ["User Growth", `${analytics.growth.userGrowth}%`, analytics.timeframe, analytics.generatedAt],
    ["Event Growth", `${analytics.growth.eventGrowth}%`, analytics.timeframe, analytics.generatedAt],
  ];

  const csvContent = [
    headers.join(","),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
  ].join("\n");

  return csvContent;
}
