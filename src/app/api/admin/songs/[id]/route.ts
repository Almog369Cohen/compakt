import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { requireAuth, isAuthError } from "@/lib/requireAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAuth();
    if (isAuthError(auth)) return auth;
    if (!auth.profileId) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const songId = params.id?.trim();
    if (!songId) {
      return NextResponse.json({ error: "Missing song id" }, { status: 400 });
    }

    const body = (await req.json()) as { data?: Record<string, unknown> };
    const data = body.data || {};
    const row: Record<string, unknown> = {};

    if (data.title !== undefined) row.title = data.title;
    if (data.artist !== undefined) row.artist = data.artist;
    if (data.coverUrl !== undefined) row.cover_url = data.coverUrl;
    if (data.previewUrl !== undefined) row.preview_url = data.previewUrl;
    if (data.externalLink !== undefined) row.external_link = data.externalLink;
    if (data.category !== undefined) row.category = data.category;
    if (data.tags !== undefined) row.tags = data.tags;
    if (data.energy !== undefined) row.energy = data.energy;
    if (data.language !== undefined) row.language = data.language;
    if (data.isSafe !== undefined) row.is_safe = data.isSafe;
    if (data.isActive !== undefined) row.is_active = data.isActive;
    if (data.sortOrder !== undefined) row.sort_order = data.sortOrder;

    if (Object.keys(row).length === 0) {
      return NextResponse.json({ ok: true });
    }

    const supabase = getServiceSupabase();
    const { error } = await supabase
      .from("songs")
      .update(row)
      .eq("id", songId)
      .eq("dj_id", auth.profileId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to update song" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAuth();
    if (isAuthError(auth)) return auth;
    if (!auth.profileId) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const songId = params.id?.trim();
    if (!songId) {
      return NextResponse.json({ error: "Missing song id" }, { status: 400 });
    }

    const supabase = getServiceSupabase();
    const { error } = await supabase
      .from("songs")
      .delete()
      .eq("id", songId)
      .eq("dj_id", auth.profileId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to delete song" },
      { status: 500 }
    );
  }
}
