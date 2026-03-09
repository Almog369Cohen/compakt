import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { createRouteClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

/**
 * POST /api/admin/ensure-profile
 * Body: { userId, email? }
 *
 * Idempotent: returns existing profile or creates a minimal one.
 * Uses service role to bypass RLS (new users have no profile row yet).
 */
export async function POST() {
  try {
    // Auth: validate session, derive userId from token (ignore client body)
    const routeClient = createRouteClient();
    const { data: { user }, error: authErr } = await routeClient.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const userId = user.id;
    const email = user.email ?? undefined;

    const supabase = getServiceSupabase();

    // Check if profile already exists
    const { data: existing, error: selectError } = await supabase
      .from("profiles")
      .select("id, user_id, business_name, role")
      .eq("user_id", userId)
      .maybeSingle();

    if (selectError) {
      return NextResponse.json({ error: selectError.message }, { status: 500 });
    }

    if (existing) {
      return NextResponse.json({
        profile: existing,
        created: false,
      });
    }

    // Create minimal profile for new user
    const newRow: Record<string, unknown> = {
      user_id: userId,
      business_name: "",
      role: "dj",
    };

    // Add email if provided (column may exist in live DB)
    if (email) {
      newRow.email = email;
    }

    const { data: created, error: insertError } = await supabase
      .from("profiles")
      .insert(newRow)
      .select("id, user_id, business_name, role")
      .single();

    if (insertError) {
      // If email column doesn't exist, retry without it
      if (insertError.message.includes("email") || insertError.code === "42703") {
        delete newRow.email;
        const { data: retried, error: retryError } = await supabase
          .from("profiles")
          .insert(newRow)
          .select("id, user_id, business_name, role")
          .single();

        if (retryError) {
          return NextResponse.json({ error: retryError.message }, { status: 500 });
        }

        return NextResponse.json({ profile: retried, created: true });
      }

      // If role column doesn't exist, retry without it
      if (insertError.message.includes("role") || insertError.code === "42703") {
        delete newRow.role;
        delete newRow.email;
        const { data: retried, error: retryError } = await supabase
          .from("profiles")
          .insert(newRow)
          .select("id, user_id, business_name")
          .single();

        if (retryError) {
          return NextResponse.json({ error: retryError.message }, { status: 500 });
        }

        return NextResponse.json({ profile: retried, created: true });
      }

      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ profile: created, created: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to ensure profile" },
      { status: 500 }
    );
  }
}
