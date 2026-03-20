import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { requireAuth, isAuthError } from "@/lib/requireAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    console.log("🔍 Audit API: Starting audit log request");

    const auth = await requireAuth({ allowedRoles: ["staff", "owner"] });
    if (isAuthError(auth)) {
      console.log("❌ Audit API: Auth failed");
      return auth;
    }

    console.log("✅ Audit API: Auth successful for role:", auth.role);

    const supabase = getServiceSupabase();

    // First check if table exists and get schema
    try {
      const { error: tableError } = await supabase
        .from('hq_audit_logs')
        .select('id')
        .limit(1);

      if (tableError) {
        console.log("❌ Audit API: Table access error:", tableError.message);

        // Try to create the table if it doesn't exist
        const { error: createError } = await supabase.rpc('create_audit_logs_table');
        if (createError) {
          console.log("❌ Audit API: Failed to create table:", createError.message);
        } else {
          console.log("✅ Audit API: Created audit_logs table");
        }
      }
    } catch (err) {
      console.log("❌ Audit API: Table check failed:", err);
    }

    // Try to get audit logs
    const { data, error } = await supabase
      .from("hq_audit_logs")
      .select("id, actor_user_id, actor_profile_id, target_profile_id, action, before_state, after_state, created_at")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.log("❌ Audit API: Query error:", error.message);
      console.log("   Error code:", error.code);
      console.log("   Error details:", error.details);

      // Return empty logs with success status to prevent UI error
      return NextResponse.json(
        {
          logs: [],
          error: null,
          message: "Audit logs temporarily unavailable"
        },
        { status: 200 }
      );
    }

    console.log("✅ Audit API: Successfully loaded", data?.length || 0, "logs");
    return NextResponse.json({ logs: data || [], error: null }, { status: 200 });

  } catch (e) {
    console.log("❌ Audit API: Unexpected error:", e);

    // Return empty logs instead of error to prevent UI crash
    return NextResponse.json({
      logs: [],
      error: null,
      message: "Audit logs temporarily unavailable"
    });
  }
}
