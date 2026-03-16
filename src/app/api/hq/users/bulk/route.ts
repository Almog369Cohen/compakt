import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { requireAuth, isAuthError } from "@/lib/requireAuth";
import { loadResolvedAccessByUserId } from "@/lib/access";
import type { RoleKey, PlanKey } from "@/lib/access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface BulkUpdateRequest {
  profileIds: string[];
  updates: {
    role?: RoleKey;
    plan?: PlanKey;
    is_active?: boolean;
  };
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (isAuthError(auth)) return auth;

    const supabase = getServiceSupabase();
    const { access } = await loadResolvedAccessByUserId(supabase, auth.userId);

    if (!access || (access.role !== "staff" && access.role !== "owner")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body: BulkUpdateRequest = await req.json();
    const { profileIds, updates } = body;

    if (!profileIds || profileIds.length === 0) {
      return NextResponse.json({ error: "No profiles selected" }, { status: 400 });
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No updates provided" }, { status: 400 });
    }

    // Check if trying to update owner role without permission
    if (updates.role === "owner" && access.role !== "owner") {
      return NextResponse.json({ error: "Only owners can promote to owner" }, { status: 403 });
    }

    // Perform bulk update
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (updates.role !== undefined) updateData.role = updates.role;
    if (updates.plan !== undefined) updateData.plan = updates.plan;
    if (updates.is_active !== undefined) updateData.is_active = updates.is_active;

    const { error: updateError } = await supabase
      .from("profiles")
      .update(updateData)
      .in("id", profileIds);

    if (updateError) {
      console.error("Bulk update error:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Create audit log for bulk action
    const auditPromises = profileIds.map((profileId) =>
      supabase.from("audit_log").insert({
        actor_user_id: auth.userId,
        actor_profile_id: auth.profileId,
        target_profile_id: profileId,
        action: "bulk_update",
        after_state: updates,
      })
    );

    await Promise.all(auditPromises);

    return NextResponse.json({
      success: true,
      updated: profileIds.length,
    });
  } catch (error) {
    console.error("Bulk update error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update" },
      { status: 500 }
    );
  }
}
