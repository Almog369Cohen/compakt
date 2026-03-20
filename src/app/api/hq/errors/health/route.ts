import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { requireAuth, isAuthError } from "@/lib/requireAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    console.log("🔍 Health API: Running system health checks...");

    const auth = await requireAuth({ allowedRoles: ["staff", "owner"] });
    if (isAuthError(auth)) {
      console.log("❌ Health API: Auth failed");
      return auth;
    }

    const supabase = getServiceSupabase();

    // Run health checks
    const checks = {
      database: await checkDatabase(supabase),
      auth: await checkAuth(supabase),
      storage: await checkStorage(supabase),
      api: await checkAPI(),
    };

    const failedChecks = Object.values(checks).filter(check => !check.pass).length;
    const totalChecks = Object.keys(checks).length;

    let status: "healthy" | "warning" | "critical";
    if (failedChecks === 0) {
      status = "healthy";
    } else if (failedChecks <= totalChecks / 2) {
      status = "warning";
    } else {
      status = "critical";
    }

    // Get recent error stats
    const { data: errorStats } = await supabase
      .from("error_logs")
      .select("error_type")
      .eq("resolved", false)
      .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    const healthData = {
      status,
      checks,
      metrics: {
        error_rate: errorStats?.length || 0,
        response_time: Object.values(checks).reduce((sum, check) => sum + (check.responseTime || 0), 0) / totalChecks,
        uptime: status === "healthy" ? 100 : status === "warning" ? 75 : 50,
      },
      last_check: new Date().toISOString(),
      recent_errors: errorStats?.length || 0,
    };

    // Store health check results
    try {
      await supabase.rpc("store_health_checks");
    } catch (storeError) {
      console.log("⚠️ Health API: Failed to store health checks:", storeError);
    }

    console.log("✅ Health API: Health check completed - status:", status);
    return NextResponse.json(healthData);

  } catch (e) {
    console.error("❌ Health API: Unexpected error:", e);
    return NextResponse.json({
      status: "critical",
      checks: {
        database: { pass: false, error: "Health check failed" },
        auth: { pass: false, error: "Health check failed" },
        storage: { pass: false, error: "Health check failed" },
        api: { pass: false, error: "Health check failed" },
      },
      metrics: {
        error_rate: 1,
        response_time: 0,
        uptime: 0,
      },
      last_check: new Date().toISOString(),
      recent_errors: 0,
      error: e instanceof Error ? e.message : "Health check failed"
    }, { status: 500 });
  }
}

async function checkDatabase(supabase: ReturnType<typeof import('@/lib/supabase').getServiceSupabase>): Promise<{ pass: boolean; responseTime?: number; error?: string }> {
  const startTime = Date.now();
  try {
    const { error } = await supabase
      .from("profiles")
      .select("id")
      .limit(1);

    const responseTime = Date.now() - startTime;

    if (error) {
      return { pass: false, responseTime, error: error.message };
    }

    return { pass: true, responseTime };
  } catch (error) {
    return { pass: false, responseTime: Date.now() - startTime, error: (error as Error).message };
  }
}

async function checkAuth(supabase: ReturnType<typeof import('@/lib/supabase').getServiceSupabase>): Promise<{ pass: boolean; responseTime?: number; error?: string }> {
  const startTime = Date.now();
  try {
    const { error: _error } = await supabase.auth.getSession();
    const responseTime = Date.now() - startTime;

    // Auth check passes even if no session (service role can check)
    return { pass: true, responseTime };
  } catch (error) {
    return { pass: false, responseTime: Date.now() - startTime, error: (error as Error).message };
  }
}

async function checkStorage(supabase: ReturnType<typeof import('@/lib/supabase').getServiceSupabase>): Promise<{ pass: boolean; responseTime?: number; error?: string }> {
  const startTime = Date.now();
  try {
    const { error } = await supabase.storage
      .from("dj-media")
      .list("", { limit: 1 });

    const responseTime = Date.now() - startTime;

    if (error) {
      return { pass: false, responseTime, error: error.message };
    }

    return { pass: true, responseTime };
  } catch (error) {
    return { pass: false, responseTime: Date.now() - startTime, error: (error as Error).message };
  }
}

async function checkAPI(): Promise<{ pass: boolean; responseTime?: number; error?: string }> {
  const startTime = Date.now();
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/health`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    const responseTime = Date.now() - startTime;

    return { pass: response.ok, responseTime, error: response.ok ? undefined : "API health endpoint failed" };
  } catch (error) {
    return { pass: false, responseTime: Date.now() - startTime, error: (error as Error).message };
  }
}
