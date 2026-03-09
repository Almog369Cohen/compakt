import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const supabaseUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Test DB connectivity if service key is available
  let dbReachable = false;
  let dbError: string | null = null;
  if (supabaseUrl && supabaseServiceKey) {
    try {
      const { getServiceSupabase } = await import("@/lib/supabase");
      const sb = getServiceSupabase();
      const { error } = await sb.from("profiles").select("id").limit(1);
      dbReachable = !error;
      if (error) dbError = error.message;
    } catch (e) {
      dbError = e instanceof Error ? e.message : "Unknown error";
    }
  }

  const allConfigured = supabaseUrl && supabaseAnonKey && supabaseServiceKey;

  return NextResponse.json(
    {
      ok: allConfigured && dbReachable,
      service: "compakt",
      env: process.env.NODE_ENV ?? "unknown",
      sha: process.env.NEXT_PUBLIC_GIT_SHA ?? process.env.GITHUB_SHA ?? null,
      timestamp: new Date().toISOString(),
      config: {
        supabase_url_set: supabaseUrl,
        supabase_anon_key_set: supabaseAnonKey,
        supabase_service_key_set: supabaseServiceKey,
        db_reachable: dbReachable,
        db_error: dbError,
      },
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      },
    }
  );
}
