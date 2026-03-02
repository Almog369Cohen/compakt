import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";

export const runtime = "nodejs";

/** GET /api/admin/events?profileId=xxx — load DJ events */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const profileId = searchParams.get("profileId");
    if (!profileId) {
      return NextResponse.json({ error: "profileId required" }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // Try loading from dj_events table first (new schema)
    const { data: djEvents, error: djError } = await supabase
      .from("dj_events")
      .select("*")
      .eq("dj_id", profileId)
      .order("date_time", { ascending: false, nullsFirst: false });

    if (!djError && djEvents) {
      // Load screenshots
      const eventIds = djEvents.map((e: Record<string, unknown>) => e.id);
      let screenshots: Record<string, unknown>[] = [];
      if (eventIds.length > 0) {
        const { data: ssData } = await supabase
          .from("event_screenshots")
          .select("*")
          .in("event_id", eventIds)
          .order("sort_order", { ascending: true });
        screenshots = ssData || [];
      }

      const enriched = djEvents.map((e: Record<string, unknown>) => ({
        ...e,
        screenshots: screenshots.filter((s: Record<string, unknown>) => s.event_id === e.id),
      }));

      return NextResponse.json({ events: enriched });
    }

    // Fallback: return empty if table doesn't exist
    if (djError?.message?.includes("dj_events")) {
      return NextResponse.json({
        events: [],
        warning: "טבלת dj_events לא קיימת. הריצו migration 014.",
      });
    }

    return NextResponse.json({ events: [], error: djError?.message });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 500 }
    );
  }
}

/** POST /api/admin/events — create/update/delete event */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, profileId, eventId, data: eventData } = body;

    const supabase = getServiceSupabase();

    if (action === "create") {
      const { data, error } = await supabase
        .from("dj_events")
        .insert({
          dj_id: profileId,
          name: eventData?.name || "אירוע חדש",
          date_time: eventData?.date_time || null,
          venue: eventData?.venue || "",
          status: eventData?.status || "upcoming",
          notes: eventData?.notes || "",
        })
        .select("*")
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ event: { ...data, screenshots: [] } });
    }

    if (action === "update") {
      const updateData: Record<string, unknown> = {};
      if (eventData?.name !== undefined) updateData.name = eventData.name;
      if (eventData?.date_time !== undefined) updateData.date_time = eventData.date_time;
      if (eventData?.venue !== undefined) updateData.venue = eventData.venue;
      if (eventData?.status !== undefined) updateData.status = eventData.status;
      if (eventData?.notes !== undefined) updateData.notes = eventData.notes;
      updateData.updated_at = new Date().toISOString();

      const { error } = await supabase
        .from("dj_events")
        .update(updateData)
        .eq("id", eventId);

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true });
    }

    if (action === "delete") {
      const { error } = await supabase
        .from("dj_events")
        .delete()
        .eq("id", eventId);

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true });
    }

    if (action === "add_screenshot") {
      const { data, error } = await supabase
        .from("event_screenshots")
        .insert({
          event_id: eventId,
          image_url: eventData?.image_url,
          sort_order: eventData?.sort_order || 0,
        })
        .select("*")
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ screenshot: data });
    }

    if (action === "remove_screenshot") {
      const { error } = await supabase
        .from("event_screenshots")
        .delete()
        .eq("id", eventData?.screenshot_id);

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 500 }
    );
  }
}
