import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { requireAuth, isAuthError } from "@/lib/requireAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const auth = await requireAuth();
    if (isAuthError(auth)) return auth;
    if (!auth.profileId) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const supabase = getServiceSupabase();
    let query = supabase.from("songs").select("*");

    // For bypass users, load all songs (admin view)
    if (auth.profileId === "bypass") {
      query = query.order("sort_order", { ascending: true });
    } else {
      query = query.eq("dj_id", auth.profileId).order("sort_order", { ascending: true });
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ songs: data || [] });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load songs" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireAuth();
    if (isAuthError(auth)) return auth;
    if (!auth.profileId) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const body = (await req.json()) as {
      song?: {
        id: string;
        title: string;
        artist: string;
        coverUrl?: string;
        previewUrl?: string;
        externalLink?: string;
        category: string;
        tags: string[];
        energy: number;
        language: string;
        isSafe: boolean;
        isActive: boolean;
        sortOrder: number;
      };
    };

    if (!body.song) {
      return NextResponse.json({ error: "Missing song" }, { status: 400 });
    }

    const supabase = getServiceSupabase();
    const song = body.song;
    const { error } = await supabase.from("songs").insert({
      id: song.id,
      dj_id: auth.profileId,
      title: song.title,
      artist: song.artist,
      cover_url: song.coverUrl || "",
      preview_url: song.previewUrl || "",
      external_link: song.externalLink || "",
      category: song.category,
      tags: song.tags,
      energy: song.energy,
      language: song.language,
      is_safe: song.isSafe,
      is_active: song.isActive,
      sort_order: song.sortOrder,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to create song" },
      { status: 500 }
    );
  }
}
