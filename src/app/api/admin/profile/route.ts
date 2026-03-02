import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";

export const runtime = "nodejs";

/** GET /api/admin/profile?userId=xxx  — load profile by user_id */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const slug = searchParams.get("slug");
    const first = searchParams.get("first");

    const supabase = getServiceSupabase();

    if (slug) {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("dj_slug", slug)
        .single();
      if (error) return NextResponse.json({ error: error.message }, { status: 404 });
      return NextResponse.json(data);
    }

    // Legacy auth fallback: return first available profile
    if (first === "true") {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      return NextResponse.json({ data: data || null });
    }

    if (!userId) {
      return NextResponse.json({ error: "userId or slug required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error || !data) {
      return NextResponse.json({ data: null });
    }

    return NextResponse.json({ data });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}

/** POST /api/admin/profile — upsert profile */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, profileId, row } = body;

    if (!row) {
      return NextResponse.json({ error: "Missing row data" }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // Try update by profileId first
    if (profileId) {
      const { data, error } = await supabase
        .from("profiles")
        .update(row)
        .eq("id", profileId)
        .select("id")
        .single();
      if (!error && data?.id) {
        return NextResponse.json({ profileId: data.id });
      }
    }

    // Try find by userId and update
    if (userId) {
      const { data: existing } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", userId)
        .limit(1)
        .maybeSingle();

      if (existing?.id) {
        const { data, error } = await supabase
          .from("profiles")
          .update(row)
          .eq("id", existing.id)
          .select("id")
          .single();
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ profileId: data?.id });
      }
    }

    // Insert new
    const { data, error } = await supabase
      .from("profiles")
      .insert(row)
      .select("id")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ profileId: data?.id });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}
