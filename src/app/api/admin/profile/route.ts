import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { requireAuth, isAuthError } from "@/lib/requireAuth";

export const runtime = "nodejs";

/** GET /api/admin/profile  — load own profile (session-scoped) */
export async function GET() {
  try {
    const auth = await requireAuth();
    if (isAuthError(auth)) return auth;

    const supabase = getServiceSupabase();

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", auth.userId)
      .single();

    if (error || !data) {
      return NextResponse.json({ data: null });
    }

    return NextResponse.json({ data });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}

/** POST /api/admin/profile — upsert own profile (session-scoped) */
export async function POST(req: Request) {
  try {
    const auth = await requireAuth();
    if (isAuthError(auth)) return auth;

    const body = await req.json();
    const { row } = body;

    if (!row) {
      return NextResponse.json({ error: "Missing row data" }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // Always scope to the authenticated user's profile
    if (auth.profileId) {
      const { data, error } = await supabase
        .from("profiles")
        .update(row)
        .eq("id", auth.profileId)
        .select("id")
        .single();
      if (!error && data?.id) {
        return NextResponse.json({ profileId: data.id });
      }
    }

    // Fallback: find by userId and update
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", auth.userId)
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

    // Insert new (with user_id attached)
    const { data, error } = await supabase
      .from("profiles")
      .insert({ ...row, user_id: auth.userId })
      .select("id")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ profileId: data?.id });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 500 });
  }
}
