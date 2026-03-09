import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { requireAuth, isAuthError } from "@/lib/requireAuth";
import { hasFeature, loadResolvedAccessByUserId } from "@/lib/access";
import { generateEventNumber } from "@/lib/utils";

export const runtime = "nodejs";

function generateMagicToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
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

    const body = await req.json();
    const { eventType, coupleNameA, coupleNameB, eventDate, venue } = body;

    const token = generateMagicToken();
    const eventNumber = generateEventNumber();

    const { data, error } = await supabase
      .from("events")
      .insert({
        dj_id: profileId,
        magic_token: token,
        token: eventNumber,
        event_type: eventType || "wedding",
        couple_name_a: coupleNameA || "",
        couple_name_b: coupleNameB || "",
        event_date: eventDate || "",
        venue: venue || "",
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

    // Fetch events linked to this DJ + unlinked events (created directly by couples)
    let data: Record<string, unknown>[] | null = null;
    const { data: d, error } = await supabase
      .from("events")
      .select("*")
      .or(`dj_id.eq.${profileId},dj_id.is.null`)
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

        return {
          ...event,
          answerCount: answerCount || 0,
          swipeCount: swipeCount || 0,
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
