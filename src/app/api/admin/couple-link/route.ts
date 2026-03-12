import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { requireAuth, isAuthError } from "@/lib/requireAuth";
import { hasFeature, loadResolvedAccessByUserId } from "@/lib/access";
import { generateEventNumber } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function generateMagicToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

function isUuid(value: string | null | undefined) {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

/**
 * POST /api/admin/couple-link
 * Body: { profileId, eventType?, coupleNameA?, coupleNameB?, eventDate?, venue? }
 *
 * Creates a couple questionnaire event linked to a specific DJ and returns the magic link.
 */
export async function POST(req: Request) {
  try {
    const auth = await requireAuth();
    if (isAuthError(auth)) return auth;
    const supabase = getServiceSupabase();
    const { access } = await loadResolvedAccessByUserId(supabase, auth.userId);
    if (!access || !hasFeature(access, "couple_links")) {
      return NextResponse.json({ error: "Feature not enabled for this account" }, { status: 403 });
    }
    const profileId = auth.profileId;
    if (!profileId) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }
    const eventOwnerId = isUuid(auth.userId) ? auth.userId : profileId;

    const body = await req.json();
    const { action, eventId, eventType, coupleNameA, coupleNameB, eventDate, venue, contactPhone } = body;

    const ownerIds = Array.from(new Set([auth.userId, profileId].filter((value): value is string => Boolean(value))));

    if (action === "get_event_detail") {
      if (!eventId) {
        return NextResponse.json({ error: "Missing eventId" }, { status: 400 });
      }

      const { data: event, error: eventError } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId)
        .in("dj_id", ownerIds)
        .maybeSingle();

      if (eventError) {
        return NextResponse.json({ error: eventError.message }, { status: 500 });
      }

      if (!event) {
        return NextResponse.json({ error: "Event not found" }, { status: 404 });
      }

      const [answersResult, swipesResult, requestsResult] = await Promise.all([
        supabase.from("answers").select("*").eq("event_id", eventId).order("created_at", { ascending: true }),
        supabase.from("swipes").select("*").eq("event_id", eventId).order("created_at", { ascending: false }),
        supabase.from("requests").select("*").eq("event_id", eventId).order("created_at", { ascending: false }),
      ]);

      if (answersResult.error || swipesResult.error || requestsResult.error) {
        const firstError = answersResult.error || swipesResult.error || requestsResult.error;
        return NextResponse.json({ error: firstError?.message || "Failed to load event detail" }, { status: 500 });
      }

      const answerQuestionIds = Array.from(
        new Set((answersResult.data || []).map((answer: Record<string, unknown>) => answer.question_id).filter((value): value is string => typeof value === "string" && value.length > 0))
      );
      const swipeSongIds = Array.from(
        new Set((swipesResult.data || []).map((swipe: Record<string, unknown>) => swipe.song_id).filter((value): value is string => typeof value === "string" && value.length > 0))
      );

      const [questionsResult, songsResult] = await Promise.all([
        answerQuestionIds.length > 0
          ? supabase.from("questions").select("*").in("id", answerQuestionIds).order("sort_order", { ascending: true })
          : Promise.resolve({ data: [], error: null }),
        swipeSongIds.length > 0
          ? supabase.from("songs").select("*").in("id", swipeSongIds)
          : Promise.resolve({ data: [], error: null }),
      ]);

      return NextResponse.json({
        event,
        answers: answersResult.data || [],
        swipes: swipesResult.data || [],
        requests: requestsResult.data || [],
        questions: questionsResult.data || [],
        songs: songsResult.data || [],
      });
    }

    if (action === "update_event_meta") {
      if (!eventId) {
        return NextResponse.json({ error: "Missing eventId" }, { status: 400 });
      }

      const { data: existingEvent, error: existingEventError } = await supabase
        .from("events")
        .select("id")
        .eq("id", eventId)
        .in("dj_id", ownerIds)
        .maybeSingle();

      if (existingEventError) {
        return NextResponse.json({ error: existingEventError.message }, { status: 500 });
      }

      if (!existingEvent) {
        return NextResponse.json({ error: "Event not found" }, { status: 404 });
      }

      const { error: updateError } = await supabase
        .from("events")
        .update({
          event_date: eventDate || "",
          venue: venue || "",
        })
        .eq("id", eventId);

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      return NextResponse.json({ ok: true });
    }

    const token = generateMagicToken();
    const eventNumber = generateEventNumber();

    const { data, error } = await supabase
      .from("events")
      .insert({
        dj_id: eventOwnerId,
        magic_token: token,
        token: eventNumber,
        event_type: eventType || "wedding",
        couple_name_a: coupleNameA || "",
        couple_name_b: coupleNameB || "",
        event_date: eventDate || "",
        venue: venue || "",
        phone_number: contactPhone || "",
        current_stage: 0,
      })
      .select("id, magic_token, token")
      .single();

    if (error) {
      console.error("Failed to create couple event:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      eventId: data.id,
      magicToken: data.magic_token,
      eventNumber: data.token,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/couple-link?profileId=xxx
 *
 * Lists all couple questionnaire events for a DJ.
 */
export async function GET() {
  try {
    const auth = await requireAuth();
    if (isAuthError(auth)) return auth;
    const supabase = getServiceSupabase();
    const { access } = await loadResolvedAccessByUserId(supabase, auth.userId);
    if (!access || !hasFeature(access, "couple_links")) {
      return NextResponse.json({ error: "Feature not enabled for this account" }, { status: 403 });
    }
    const profileId = auth.profileId;
    if (!profileId) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }
    const ownerIds = Array.from(new Set([auth.userId, profileId].filter((value): value is string => Boolean(value))));

    let data: Record<string, unknown>[] | null = null;
    const { data: d, error } = await supabase
      .from("events")
      .select("*")
      .in("dj_id", ownerIds)
      .order("created_at", { ascending: false });

    if (error) {
      if (error.message.includes("does not exist")) {
        // dj_id column not yet added — return empty list gracefully
        return NextResponse.json({ events: [], warning: "הריצו migration 016 כדי לחבר אירועים ל-DJ" });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    data = d;

    // Enrich with answer/swipe counts
    const enriched = await Promise.all(
      (data || []).map(async (event) => {
        const { count: answerCount } = await supabase
          .from("answers")
          .select("*", { count: "exact", head: true })
          .eq("event_id", event.id);

        const { count: swipeCount } = await supabase
          .from("swipes")
          .select("*", { count: "exact", head: true })
          .eq("event_id", event.id);

        const { count: requestCount } = await supabase
          .from("requests")
          .select("*", { count: "exact", head: true })
          .eq("event_id", event.id);

        return {
          ...event,
          answerCount: answerCount || 0,
          swipeCount: swipeCount || 0,
          requestCount: requestCount || 0,
          isComplete: (event.current_stage as number) >= 4,
        };
      })
    );

    return NextResponse.json({ events: enriched });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 500 }
    );
  }
}
