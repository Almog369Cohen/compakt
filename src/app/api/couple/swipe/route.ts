import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { validateBody, isValidationError } from "@/lib/apiValidation";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const swipeSchema = z.object({
  id: z.string().min(1),
  eventId: z.string().min(1),
  songId: z.string().min(1),
  action: z.enum(["like", "dislike", "super_like", "unsure"]),
  reasonChips: z.array(z.string()).default([]),
});

const deleteSwipeSchema = z.object({
  id: z.string().min(1, "Missing swipe id"),
});

export async function POST(req: Request) {
  try {
    const parsed = await validateBody(req, swipeSchema);
    if (isValidationError(parsed)) return parsed.error;
    const { id, eventId, songId, action, reasonChips } = parsed.data;

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
    const parsed = await validateBody(req, deleteSwipeSchema);
    if (isValidationError(parsed)) return parsed.error;
    const { id } = parsed.data;

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
