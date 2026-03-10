import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { requireAuth, isAuthError } from "@/lib/requireAuth";
import { mapProfileRow, resolveAccess } from "@/lib/access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/hq/profiles
 * Staff/owner only — returns all profiles for HQ dashboard.
 */
export async function GET() {
  try {
    const auth = await requireAuth({ allowedRoles: ["staff", "owner"] });
    if (isAuthError(auth)) return auth;

    const supabase = getServiceSupabase();

    const { data, error } = await supabase
      .from("profiles")
      .select("id, user_id, business_name, dj_slug, role, email, plan, is_active, feature_overrides, notes, managed_by, created_at, updated_at")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      profiles: (data || []).map((profile) => {
        const mapped = mapProfileRow(profile as Record<string, unknown>);
        return {
          ...mapped,
          access: resolveAccess(mapped),
        };
      }),
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 500 }
    );
  }
}
