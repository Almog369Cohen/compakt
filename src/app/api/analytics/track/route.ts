import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";

export const runtime = "nodejs";

/**
 * POST /api/analytics/track
 * Body: { events: [{ eventName, category, eventId?, sessionId?, djId?, metadata?, pagePath? }] }
 *
 * Fire-and-forget analytics tracking. Accepts single or batch events.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const userAgent = req.headers.get("user-agent") || "";
    const referrer = req.headers.get("referer") || "";

    // Accept single event or batch
    const events = Array.isArray(body.events)
      ? body.events
      : [body];

    if (events.length === 0) {
      return NextResponse.json({ ok: true });
    }

    const supabase = getServiceSupabase();

    const rows = events.map((e: Record<string, unknown>) => ({
      event_name: e.eventName || e.event_name || "unknown",
      category: e.category || "couple",
      event_id: e.eventId || e.event_id || null,
      session_id: e.sessionId || e.session_id || null,
      dj_id: e.djId || e.dj_id || null,
      metadata: e.metadata || {},
      page_path: e.pagePath || e.page_path || null,
      referrer,
      user_agent: userAgent,
    }));

    const { error } = await supabase
      .from("analytics_events")
      .insert(rows);

    if (error) {
      // Don't fail — analytics should never block the user
      console.error("Analytics insert error:", error.message);
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Analytics track error:", e);
    // Always return 200 — analytics should never fail the client
    return NextResponse.json({ ok: true });
  }
}

/**
 * GET /api/analytics/track?djId=xxx&from=2024-01-01&to=2024-12-31
 * 
 * Returns aggregated analytics for a DJ's events.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const djId = searchParams.get("djId");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const eventId = searchParams.get("eventId");

    if (!djId && !eventId) {
      return NextResponse.json({ error: "djId or eventId required" }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    let query = supabase
      .from("analytics_events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1000);

    if (djId) query = query.eq("dj_id", djId);
    if (eventId) query = query.eq("event_id", eventId);
    if (from) query = query.gte("created_at", from);
    if (to) query = query.lte("created_at", to);

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Aggregate stats
    const events = data || [];
    const stats = computeStats(events);

    return NextResponse.json({ raw: events, stats });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 500 }
    );
  }
}

interface AnalyticsRow {
  event_name: string;
  category: string;
  event_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

function computeStats(events: AnalyticsRow[]) {
  const coupleEvents = events.filter((e) => e.category === "couple");
  const adminEvents = events.filter((e) => e.category === "admin");

  // Funnel: link_open → session_start → stage_1 → stage_2 → stage_3 → session_complete
  const funnelSteps = [
    "link_open",
    "phone_verified",
    "session_start",
    "stage_enter_1",
    "stage_enter_2",
    "stage_enter_3",
    "stage_enter_4",
    "session_complete",
  ];

  const funnel = funnelSteps.map((step) => ({
    step,
    count: coupleEvents.filter((e) => e.event_name === step).length,
  }));

  // Breakpoints: stages where people drop off
  const stageEnters: Record<string, number> = {};
  const stageCompletes: Record<string, number> = {};
  coupleEvents.forEach((e) => {
    if (e.event_name.startsWith("stage_enter_")) {
      const stage = e.event_name.replace("stage_enter_", "");
      stageEnters[stage] = (stageEnters[stage] || 0) + 1;
    }
    if (e.event_name.startsWith("stage_complete_")) {
      const stage = e.event_name.replace("stage_complete_", "");
      stageCompletes[stage] = (stageCompletes[stage] || 0) + 1;
    }
  });

  const breakpoints = Object.keys(stageEnters).map((stage) => ({
    stage,
    entered: stageEnters[stage] || 0,
    completed: stageCompletes[stage] || 0,
    dropRate:
      stageEnters[stage] > 0
        ? Math.round(
            ((stageEnters[stage] - (stageCompletes[stage] || 0)) / stageEnters[stage]) * 100
          )
        : 0,
  }));

  // Average time per stage (from metadata.duration_ms)
  const stageDurations: Record<string, number[]> = {};
  coupleEvents
    .filter((e) => e.event_name.startsWith("stage_complete_") && e.metadata?.duration_ms)
    .forEach((e) => {
      const stage = e.event_name.replace("stage_complete_", "");
      if (!stageDurations[stage]) stageDurations[stage] = [];
      stageDurations[stage].push(e.metadata.duration_ms as number);
    });

  const avgStageDuration = Object.entries(stageDurations).map(([stage, durations]) => ({
    stage,
    avgMs: Math.round(durations.reduce((a, b) => a + b, 0) / durations.length),
    count: durations.length,
  }));

  // Unique events (by event_id)
  const uniqueEventIds = new Set(coupleEvents.filter((e) => e.event_id).map((e) => e.event_id));
  const completedEventIds = new Set(
    coupleEvents.filter((e) => e.event_name === "session_complete" && e.event_id).map((e) => e.event_id)
  );

  return {
    totalEvents: events.length,
    coupleEvents: coupleEvents.length,
    adminEvents: adminEvents.length,
    uniqueSessions: uniqueEventIds.size,
    completedSessions: completedEventIds.size,
    completionRate:
      uniqueEventIds.size > 0
        ? Math.round((completedEventIds.size / uniqueEventIds.size) * 100)
        : 0,
    funnel,
    breakpoints,
    avgStageDuration,
  };
}
