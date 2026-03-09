import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { requireAuth, isAuthError } from "@/lib/requireAuth";
import {
  canManageFeatureOverrides,
  canManageUsers,
  canPromoteOwner,
  FEATURE_KEYS,
  loadAccessProfileById,
  loadResolvedAccessByUserId,
  normalizePlan,
  normalizeRole,
  sanitizeFeatureOverrides,
  writeAuditLog,
} from "@/lib/access";

export const runtime = "nodejs";

export async function PATCH(req: Request, context: { params: { id: string } }) {
  try {
    const auth = await requireAuth({ allowedRoles: ["staff", "owner"] });
    if (isAuthError(auth)) return auth;

    const profileId = context.params.id;
    if (!profileId) {
      return NextResponse.json({ error: "Missing profile id" }, { status: 400 });
    }

    const supabase = getServiceSupabase();
    const actor = await loadResolvedAccessByUserId(supabase, auth.userId);
    if (!canManageUsers(actor.access)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const target = await loadAccessProfileById(supabase, profileId);
    if (!target) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const body = await req.json();
    const updateRow: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
      managed_by: auth.profileId || null,
    };

    if (body.role !== undefined) {
      const nextRole = normalizeRole(body.role);
      if (nextRole === "owner" && !canPromoteOwner(actor.access)) {
        return NextResponse.json({ error: "Only owners can grant owner role" }, { status: 403 });
      }
      updateRow.role = nextRole;
    }

    if (body.plan !== undefined) {
      updateRow.plan = normalizePlan(body.plan);
    }

    if (body.is_active !== undefined) {
      if (target.user_id === auth.userId && body.is_active === false) {
        return NextResponse.json({ error: "You cannot deactivate your own account" }, { status: 400 });
      }
      updateRow.is_active = Boolean(body.is_active);
    }

    if (body.notes !== undefined) {
      updateRow.notes = typeof body.notes === "string" ? body.notes : null;
    }

    if (body.feature_overrides !== undefined) {
      if (!canManageFeatureOverrides(actor.access)) {
        return NextResponse.json({ error: "Only owners can manage feature overrides" }, { status: 403 });
      }
      const sanitized = sanitizeFeatureOverrides(body.feature_overrides);
      for (const key of Object.keys(body.feature_overrides || {})) {
        if (!FEATURE_KEYS.includes(key as (typeof FEATURE_KEYS)[number])) {
          return NextResponse.json({ error: `Unknown feature key: ${key}` }, { status: 400 });
        }
      }
      updateRow.feature_overrides = sanitized;
    }

    const beforeState = {
      role: target.role,
      plan: target.plan,
      is_active: target.is_active,
      notes: target.notes,
      feature_overrides: target.feature_overrides,
    };

    const { data, error } = await supabase
      .from("profiles")
      .update(updateRow)
      .eq("id", profileId)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await writeAuditLog(supabase, {
      actorUserId: auth.userId,
      actorProfileId: auth.profileId,
      targetProfileId: profileId,
      action: "profile_updated",
      beforeState,
      afterState: {
        role: data.role,
        plan: data.plan,
        is_active: data.is_active,
        notes: data.notes,
        feature_overrides: data.feature_overrides,
      },
    });

    return NextResponse.json({ profile: data });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 500 }
    );
  }
}
