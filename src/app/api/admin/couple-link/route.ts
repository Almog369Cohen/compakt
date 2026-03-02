import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";

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
    const body = await req.json();
    const { profileId, eventType, coupleNameA, coupleNameB, eventDate, venue } = body;

    if (!profileId) {
      return NextResponse.json({ error: "Missing profileId" }, { status: 400 });
    }

    const supabase = getServiceSupabase();
    const token = generateMagicToken();

    const { data, error } = await supabase
      .from("events")
      .insert({
        dj_id: profileId,
        magic_token: token,
        event_type: eventType || "wedding",
        couple_name_a: coupleNameA || "",
        couple_name_b: coupleNameB || "",
        event_date: eventDate || "",
        venue: venue || "",
        current_stage: 0,
      })
      .select("id, magic_token")
      .single();

    if (error) {
      console.error("Failed to create couple event:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      eventId: data.id,
      magicToken: data.magic_token,
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
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const profileId = searchParams.get("profileId");

    if (!profileId) {
      return NextResponse.json({ error: "profileId required" }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // Try with dj_id filter first; if column doesn't exist (migration 016 not run), return empty
    let data: Record<string, unknown>[] | null = null;
    const { data: d, error } = await supabase
      .from("events")
      .select("*")
      .eq("dj_id", profileId)
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
