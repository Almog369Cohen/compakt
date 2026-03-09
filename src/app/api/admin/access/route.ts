import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { requireAuth, isAuthError } from "@/lib/requireAuth";
import { loadAccessProfileByUserId, resolveAccess } from "@/lib/access";

export const runtime = "nodejs";

export async function GET() {
  try {
    const auth = await requireAuth();
    if (isAuthError(auth)) return auth;

    const supabase = getServiceSupabase();
    const profile = await loadAccessProfileByUserId(supabase, auth.userId);

    return NextResponse.json({
      profile,
      access: profile ? resolveAccess(profile) : null,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 500 }
    );
  }
}
