import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const id = typeof body?.id === "string" ? body.id.trim() : "";
    const eventId = typeof body?.eventId === "string" ? body.eventId.trim() : "";
    const songId = typeof body?.songId === "string" ? body.songId.trim() : "";
    const action = typeof body?.action === "string" ? body.action.trim() : "";
    const reasonChips = Array.isArray(body?.reasonChips)
      ? body.reasonChips.filter((chip: unknown): chip is string => typeof chip === "string")
      : [];

    if (!id || !eventId || !songId || !action) {
      return NextResponse.json({ error: "Missing swipe payload" }, { status: 400 });
    }

    const supabase = getServiceSupabase();
    const { error } = await supabase.from("swipes").upsert(
      {
        id,
        event_id: eventId,
        song_id: songId,
        action,
        reason_chips: JSON.stringify(reasonChips),
      },
      { onConflict: "id" }
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to persist swipe" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const id = typeof body?.id === "string" ? body.id.trim() : "";

    if (!id) {
      return NextResponse.json({ error: "Missing swipe id" }, { status: 400 });
    }

    const supabase = getServiceSupabase();
    const { error } = await supabase.from("swipes").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete swipe" },
      { status: 500 }
    );
  }
}
