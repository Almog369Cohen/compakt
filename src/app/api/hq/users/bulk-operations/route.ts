import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { requireAuth, isAuthError } from "@/lib/requireAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/hq/users/bulk-operations
 * 
 * Perform bulk operations on multiple users
 * Supports activate, deactivate, upgrade, downgrade, and delete operations
 */
export async function POST(req: Request) {
  try {
    const auth = await requireAuth({ allowedRoles: ["staff", "owner"] });
    if (isAuthError(auth)) return auth;

    const body = await req.json();
    const { type, targetIds, plan, role } = body;

    if (!type || !targetIds || !Array.isArray(targetIds) || targetIds.length === 0) {
      return NextResponse.json(
        { error: "Invalid request: type and targetIds are required" },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();
    let affected = 0;

    switch (type) {
      case "activate":
        const { error: activateError } = await supabase
          .from("profiles")
          .update({ is_active: true, updated_at: new Date().toISOString() })
          .in("id", targetIds);
        
        if (activateError) throw activateError;
        affected = targetIds.length;
        break;

      case "deactivate":
        const { error: deactivateError } = await supabase
          .from("profiles")
          .update({ is_active: false, updated_at: new Date().toISOString() })
          .in("id", targetIds);
        
        if (deactivateError) throw deactivateError;
        affected = targetIds.length;
        break;

      case "upgrade":
        if (!plan) {
          return NextResponse.json(
            { error: "Plan is required for upgrade operation" },
            { status: 400 }
          );
        }
        
        const { error: upgradeError } = await supabase
          .from("profiles")
          .update({ 
            plan, 
            updated_at: new Date().toISOString() 
          })
          .in("id", targetIds);
        
        if (upgradeError) throw upgradeError;
        affected = targetIds.length;
        break;

      case "downgrade":
        if (!plan) {
          return NextResponse.json(
            { error: "Plan is required for downgrade operation" },
            { status: 400 }
          );
        }
        
        const { error: downgradeError } = await supabase
          .from("profiles")
          .update({ 
            plan, 
            updated_at: new Date().toISOString() 
          })
          .in("id", targetIds);
        
        if (downgradeError) throw downgradeError;
        affected = targetIds.length;
        break;

      case "change_role":
        if (!role) {
          return NextResponse.json(
            { error: "Role is required for role change operation" },
            { status: 400 }
          );
        }
        
        // Only owners can change roles to staff/owner
        if (auth.role !== "owner" && (role === "staff" || role === "owner")) {
          return NextResponse.json(
            { error: "Only owners can assign staff or owner roles" },
            { status: 403 }
          );
        }
        
        const { error: roleError } = await supabase
          .from("profiles")
          .update({ 
            role, 
            updated_at: new Date().toISOString() 
          })
          .in("id", targetIds);
        
        if (roleError) throw roleError;
        affected = targetIds.length;
        break;

      case "delete":
        // Only owners can delete users
        if (auth.role !== "owner") {
          return NextResponse.json(
            { error: "Only owners can delete users" },
            { status: 403 }
          );
        }
        
        // First delete related data
        await Promise.all([
          supabase.from("songs").delete().in("dj_id", targetIds),
          supabase.from("questions").delete().in("dj_id", targetIds),
          supabase.from("events").delete().in("dj_id", targetIds),
        ]);
        
        // Then delete profiles
        const { error: deleteError } = await supabase
          .from("profiles")
          .delete()
          .in("id", targetIds);
        
        if (deleteError) throw deleteError;
        affected = targetIds.length;
        break;

      default:
        return NextResponse.json(
          { error: "Invalid operation type" },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      operation: type,
      affected,
      message: `Successfully ${type} ${affected} users`,
    });

  } catch (error) {
    console.error("Bulk operation error:", error);
    return NextResponse.json(
      { error: "Bulk operation failed" },
      { status: 500 }
    );
  }
}
