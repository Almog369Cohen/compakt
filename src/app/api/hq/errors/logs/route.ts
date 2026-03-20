import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { requireAuth, isAuthError } from "@/lib/requireAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    console.log("🔍 Errors API: Loading error logs...");
    
    const auth = await requireAuth({ allowedRoles: ["staff", "owner"] });
    if (isAuthError(auth)) {
      console.log("❌ Errors API: Auth failed");
      return auth;
    }

    console.log("✅ Errors API: Auth successful for role:", auth.role);
    
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const resolved = searchParams.get("resolved");
    const errorType = searchParams.get("errorType");

    const supabase = getServiceSupabase();
    
    let query = supabase
      .from("error_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (resolved !== null) {
      query = query.eq("resolved", resolved === "true");
    }

    if (errorType) {
      query = query.eq("error_type", errorType);
    }

    const { data, error } = await query;

    if (error) {
      console.log("❌ Errors API: Query error:", error.message);
      return NextResponse.json({ 
        logs: [],
        error: error.message 
      }, { status: 500 });
    }

    console.log("✅ Errors API: Successfully loaded", data?.length || 0, "error logs");
    return NextResponse.json({ 
      logs: data || [],
      total: data?.length || 0
    });
    
  } catch (e) {
    console.error("❌ Errors API: Unexpected error:", e);
    return NextResponse.json({ 
      logs: [],
      error: e instanceof Error ? e.message : "Failed to load error logs"
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    console.log("🔍 Errors API: Creating error log...");
    
    const auth = await requireAuth({ allowedRoles: ["staff", "owner"] });
    if (isAuthError(auth)) {
      console.log("❌ Errors API: Auth failed");
      return auth;
    }

    const {
      error_type,
      error_message,
      stack_trace,
      component,
      action,
      context,
      resolved
    } = await request.json();

    if (!error_type || !error_message) {
      return NextResponse.json(
        { error: "Error type and message are required" },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();
    
    const { data, error } = await supabase
      .from("error_logs")
      .insert({
        error_type,
        error_message,
        stack_trace,
        user_id: auth.userId,
        profile_id: auth.profileId,
        component,
        action,
        context,
        resolved: resolved || false,
        resolved_at: resolved ? new Date().toISOString() : null,
        resolved_by: resolved ? auth.userId : null
      })
      .select()
      .single();

    if (error) {
      console.log("❌ Errors API: Insert error:", error.message);
      return NextResponse.json({ 
        error: error.message 
      }, { status: 500 });
    }

    console.log("✅ Errors API: Error log created successfully");
    return NextResponse.json({ 
      success: true,
      log: data
    });
    
  } catch (e) {
    console.error("❌ Errors API: Unexpected error:", e);
    return NextResponse.json({ 
      error: e instanceof Error ? e.message : "Failed to create error log"
    }, { status: 500 });
  }
}
