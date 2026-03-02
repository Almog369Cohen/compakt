import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";

export const runtime = "nodejs";

interface HealthCheck {
  name: string;
  status: "pass" | "fail" | "warn";
  detail: string;
  count?: number;
}

/**
 * GET /api/admin/db-health?profileId=xxx
 *
 * Automated DB health check. Returns list of checks with pass/fail/warn.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const profileId = searchParams.get("profileId");

    const supabase = getServiceSupabase();
    const checks: HealthCheck[] = [];

    // 1. Tables exist
    const tables = ["profiles", "events", "answers", "swipes", "requests", "songs", "questions", "upsells"];
    for (const table of tables) {
      const { error } = await supabase.from(table).select("id", { count: "exact", head: true });
      checks.push({
        name: `table_exists_${table}`,
        status: error ? "fail" : "pass",
        detail: error ? `Table "${table}" not accessible: ${error.message}` : `Table "${table}" accessible`,
      });
    }

    // Optional tables (may not exist if migrations not run)
    for (const table of ["event_sessions", "analytics_events", "dj_events", "event_screenshots"]) {
      const { error } = await supabase.from(table).select("id", { count: "exact", head: true });
      checks.push({
        name: `table_exists_${table}`,
        status: error ? "warn" : "pass",
        detail: error ? `Table "${table}" missing (run migration): ${error.message}` : `Table "${table}" accessible`,
      });
    }

    // 2. Profile-specific checks
    if (profileId) {
      // Songs count
      const { count: songCount } = await supabase
        .from("songs")
        .select("*", { count: "exact", head: true })
        .eq("dj_id", profileId);
      checks.push({
        name: "dj_has_songs",
        status: (songCount ?? 0) > 0 ? "pass" : "fail",
        detail: (songCount ?? 0) > 0 ? `DJ has ${songCount} songs in DB` : "DJ has 0 songs in DB — couples will see empty song list!",
        count: songCount ?? 0,
      });

      // Questions count
      const { count: questionCount } = await supabase
        .from("questions")
        .select("*", { count: "exact", head: true })
        .eq("dj_id", profileId);
      checks.push({
        name: "dj_has_questions",
        status: (questionCount ?? 0) > 0 ? "pass" : "fail",
        detail: (questionCount ?? 0) > 0 ? `DJ has ${questionCount} questions in DB` : "DJ has 0 questions in DB — couples will see no questions!",
        count: questionCount ?? 0,
      });

      // Upsells count
      const { count: upsellCount } = await supabase
        .from("upsells")
        .select("*", { count: "exact", head: true })
        .eq("dj_id", profileId);
      checks.push({
        name: "dj_has_upsells",
        status: (upsellCount ?? 0) > 0 ? "pass" : "warn",
        detail: (upsellCount ?? 0) > 0 ? `DJ has ${upsellCount} upsells` : "No upsells configured (optional)",
        count: upsellCount ?? 0,
      });

      // Events linked to DJ
      const { count: eventCount, error: eventErr } = await supabase
        .from("events")
        .select("*", { count: "exact", head: true })
        .eq("dj_id", profileId);
      if (eventErr && eventErr.message.includes("does not exist")) {
        checks.push({
          name: "events_linked_to_dj",
          status: "warn",
          detail: "events.dj_id column missing — run migration 016",
        });
      } else {
        checks.push({
          name: "events_linked_to_dj",
          status: "pass",
          detail: `DJ has ${eventCount ?? 0} couple questionnaire events`,
          count: eventCount ?? 0,
        });
      }
    }

    // 3. Global integrity checks

    // Orphan answers (event_id points to non-existent event)
    const { data: orphanAnswers } = await supabase
      .from("answers")
      .select("id, event_id")
      .not("event_id", "in", `(SELECT id FROM events)`)
      .limit(5);
    // Use a different approach since subquery isn't supported in PostgREST
    const { data: allAnswerEventIds } = await supabase.from("answers").select("event_id");
    const { data: allEventIds } = await supabase.from("events").select("id");
    const eventIdSet = new Set((allEventIds || []).map((e) => e.id));
    const orphanAnswerCount = (allAnswerEventIds || []).filter((a) => !eventIdSet.has(a.event_id)).length;
    checks.push({
      name: "no_orphan_answers",
      status: orphanAnswerCount === 0 ? "pass" : "fail",
      detail: orphanAnswerCount === 0 ? "No orphan answers" : `${orphanAnswerCount} answers reference non-existent events!`,
      count: orphanAnswerCount,
    });

    // Orphan swipes
    const { data: allSwipeEventIds } = await supabase.from("swipes").select("event_id");
    const orphanSwipeCount = (allSwipeEventIds || []).filter((s) => !eventIdSet.has(s.event_id)).length;
    checks.push({
      name: "no_orphan_swipes",
      status: orphanSwipeCount === 0 ? "pass" : "fail",
      detail: orphanSwipeCount === 0 ? "No orphan swipes" : `${orphanSwipeCount} swipes reference non-existent events!`,
      count: orphanSwipeCount,
    });

    // Events without dj_id
    const { data: nodjEvents } = await supabase
      .from("events")
      .select("id")
      .is("dj_id", null);
    const nodjCount = nodjEvents?.length ?? 0;
    checks.push({
      name: "events_have_dj_id",
      status: nodjCount === 0 ? "pass" : "warn",
      detail: nodjCount === 0 ? "All events have dj_id" : `${nodjCount} events have no dj_id (orphan or old)`,
      count: nodjCount,
    });

    // Verified sessions with missing phone on event
    try {
      const { data: badSessions } = await supabase
        .from("event_sessions")
        .select("id, event_id, phone_number")
        .eq("phone_verified", true);

      if (badSessions && badSessions.length > 0) {
        const sessionEventIds = badSessions.map((s) => s.event_id);
        const { data: sessionEvents } = await supabase
          .from("events")
          .select("id, phone_number")
          .in("id", sessionEventIds);

        const missingPhoneCount = (sessionEvents || []).filter((e) => !e.phone_number).length;
        checks.push({
          name: "verified_sessions_have_phone",
          status: missingPhoneCount === 0 ? "pass" : "warn",
          detail: missingPhoneCount === 0
            ? "All verified sessions have phone on event"
            : `${missingPhoneCount} verified sessions but event.phone_number is NULL`,
          count: missingPhoneCount,
        });
      } else {
        checks.push({
          name: "verified_sessions_have_phone",
          status: "pass",
          detail: "No verified sessions yet",
        });
      }
    } catch {
      checks.push({
        name: "verified_sessions_have_phone",
        status: "warn",
        detail: "event_sessions table not available (run migration 016)",
      });
    }

    // Summary
    const failCount = checks.filter((c) => c.status === "fail").length;
    const warnCount = checks.filter((c) => c.status === "warn").length;
    const passCount = checks.filter((c) => c.status === "pass").length;

    return NextResponse.json({
      healthy: failCount === 0,
      summary: { pass: passCount, warn: warnCount, fail: failCount },
      checks,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Health check failed" },
      { status: 500 }
    );
  }
}
