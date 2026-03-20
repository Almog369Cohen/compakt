import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { requireAuth, isAuthError } from "@/lib/requireAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log("🔍 Errors API: Resolving error:", params.id);
    
    const auth = await requireAuth({ allowedRoles: ["staff", "owner"] });
    if (isAuthError(auth)) {
      console.log("❌ Errors API: Auth failed");
      return auth;
    }

    const errorId = params.id;

    if (!errorId) {
      return NextResponse.json(
        { error: "Error ID is required" },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();
    
    const { data, error } = await supabase
      .from("error_logs")
      .update({
        resolved: true,
        resolved_at: new Date().toISOString(),
        resolved_by: auth.userId,
      })
      .eq("id", errorId)
      .select()
      .single();

    if (error) {
      console.log("❌ Errors API: Resolve error:", error.message);
      return NextResponse.json({ 
        error: error.message 
      }, { status: 500 });
    }

    console.log("✅ Errors API: Error resolved successfully");
    return NextResponse.json({ 
      success: true,
      log: data
    });
    
  } catch (e) {
    console.error("❌ Errors API: Unexpected error:", e);
    return NextResponse.json({ 
      error: e instanceof Error ? e.message : "Failed to resolve error"
    }, { status: 500 });
  }
}
