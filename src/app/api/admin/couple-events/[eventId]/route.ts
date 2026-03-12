import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { requireAuth, isAuthError } from "@/lib/requireAuth";
import { hasFeature, loadResolvedAccessByUserId } from "@/lib/access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: {
    eventId: string;
  };
};

export async function GET(_req: Request, { params }: RouteContext) {
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
    const ownerIds = Array.from(
      new Set([auth.userId, profileId].filter((value): value is string => Boolean(value)))
    );

    const eventId = params.eventId;
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

    const [answersResult, swipesResult, requestsResult, questionsResult, songsResult] = await Promise.all([
      supabase.from("answers").select("*").eq("event_id", eventId).order("created_at", { ascending: true }),
      supabase.from("swipes").select("*").eq("event_id", eventId).order("created_at", { ascending: false }),
      supabase.from("requests").select("*").eq("event_id", eventId).order("created_at", { ascending: false }),
      supabase.from("questions").select("*").eq("dj_id", profileId).order("sort_order", { ascending: true }),
      supabase.from("songs").select("*").eq("dj_id", profileId).order("sort_order", { ascending: true }),
    ]);

    if (answersResult.error || swipesResult.error || requestsResult.error) {
      const firstError = answersResult.error || swipesResult.error || requestsResult.error;
      return NextResponse.json({ error: firstError?.message || "Failed to load event detail" }, { status: 500 });
    }

    return NextResponse.json({
      event,
      answers: answersResult.data || [],
      swipes: swipesResult.data || [],
      requests: requestsResult.data || [],
      questions: questionsResult.data || [],
      songs: songsResult.data || [],
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 500 }
    );
  }
}
