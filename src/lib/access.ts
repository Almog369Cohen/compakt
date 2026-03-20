import type { SupabaseClient } from "@supabase/supabase-js";

function isUuid(value: string | null | undefined) {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export const PLAN_KEYS = ["starter", "pro", "premium", "enterprise"] as const;
export const FEATURE_KEYS = [
  "analytics",
  "couple_links",
  "google_calendar_sync",
  "spotify_import",
  "image_uploads",
  "custom_branding",
  "advanced_questions",
  "upsells",
  "hq_access",
  "team_access",
] as const;
export const ROLE_KEYS = ["dj", "staff", "owner"] as const;

export type PlanKey = (typeof PLAN_KEYS)[number];
export type FeatureKey = (typeof FEATURE_KEYS)[number];
export type RoleKey = (typeof ROLE_KEYS)[number];
export type FeatureOverrides = Partial<Record<FeatureKey, boolean>>;

export interface AccessProfile {
  id: string;
  user_id: string | null;
  clerk_user_id: string | null;
  business_name: string;
  dj_slug: string | null;
  role: RoleKey;
  email: string | null;
  plan: PlanKey;
  is_active: boolean;
  feature_overrides: FeatureOverrides;
  notes: string | null;
  managed_by: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface ResolvedAccess {
  role: RoleKey;
  plan: PlanKey;
  isActive: boolean;
  features: Record<FeatureKey, boolean>;
  capabilities: {
    canAccessHQ: boolean;
    canManageUsers: boolean;
    canManageRoles: boolean;
    canManagePlans: boolean;
    canManageFeatureOverrides: boolean;
    canPromoteOwner: boolean;
  };
}

const PLAN_FEATURE_MATRIX: Record<PlanKey, FeatureKey[]> = {
  starter: ["couple_links", "advanced_questions"],
  pro: ["couple_links", "advanced_questions", "analytics", "google_calendar_sync", "image_uploads", "upsells"],
  premium: ["couple_links", "advanced_questions", "analytics", "google_calendar_sync", "image_uploads", "upsells", "spotify_import", "custom_branding"],
  enterprise: ["couple_links", "advanced_questions", "analytics", "google_calendar_sync", "image_uploads", "upsells", "spotify_import", "custom_branding", "team_access"],
};

export function normalizeRole(role: unknown): RoleKey {
  return typeof role === "string" && ROLE_KEYS.includes(role as RoleKey) ? (role as RoleKey) : "dj";
}

export function normalizePlan(plan: unknown): PlanKey {
  return typeof plan === "string" && PLAN_KEYS.includes(plan as PlanKey) ? (plan as PlanKey) : "starter";
}

export function sanitizeFeatureOverrides(value: unknown): FeatureOverrides {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const result: FeatureOverrides = {};
  for (const key of FEATURE_KEYS) {
    const raw = (value as Record<string, unknown>)[key];
    if (typeof raw === "boolean") result[key] = raw;
  }
  return result;
}

export function mapProfileRow(row: Record<string, unknown>): AccessProfile {
  return {
    id: String(row.id || ""),
    user_id: typeof row.user_id === "string" ? row.user_id : null,
    clerk_user_id: typeof row.clerk_user_id === "string" ? row.clerk_user_id : null,
    business_name: typeof row.business_name === "string" ? row.business_name : "",
    dj_slug: typeof row.dj_slug === "string" ? row.dj_slug : null,
    role: normalizeRole(row.role),
    email: typeof row.email === "string" ? row.email : null,
    plan: normalizePlan(row.plan),
    is_active: row.is_active !== false,
    feature_overrides: sanitizeFeatureOverrides(row.feature_overrides),
    notes: typeof row.notes === "string" ? row.notes : null,
    managed_by: typeof row.managed_by === "string" ? row.managed_by : null,
    created_at: typeof row.created_at === "string" ? row.created_at : "",
    updated_at: typeof row.updated_at === "string" ? row.updated_at : null,
  };
}

export function resolveAccess(profile: Pick<AccessProfile, "role" | "plan" | "is_active" | "feature_overrides">): ResolvedAccess {
  const role = normalizeRole(profile.role);
  const plan = normalizePlan(profile.plan);
  const isActive = profile.is_active !== false;
  const features = Object.fromEntries(FEATURE_KEYS.map((key) => [key, false])) as Record<FeatureKey, boolean>;

  for (const feature of PLAN_FEATURE_MATRIX[plan]) {
    features[feature] = true;
  }

  for (const [key, value] of Object.entries(sanitizeFeatureOverrides(profile.feature_overrides))) {
    features[key as FeatureKey] = Boolean(value);
  }

  if (role === "staff" || role === "owner") {
    features.hq_access = true;
  }

  return {
    role,
    plan,
    isActive,
    features,
    capabilities: {
      canAccessHQ: role === "staff" || role === "owner",
      canManageUsers: role === "staff" || role === "owner",
      canManageRoles: role === "staff" || role === "owner",
      canManagePlans: role === "staff" || role === "owner",
      canManageFeatureOverrides: role === "owner",
      canPromoteOwner: role === "owner",
    },
  };
}

export function hasFeature(access: ResolvedAccess, feature: FeatureKey): boolean {
  if (!access.isActive) return false;
  return access.features[feature] === true;
}

export async function loadResolvedAccessByUserId(service: SupabaseClient, userId: string) {
  const profile = await loadAccessProfileByIdentity(service, { userId });
  return {
    profile,
    access: profile ? resolveAccess(profile) : null,
  };
}

export async function loadResolvedAccessByIdentity(
  service: SupabaseClient,
  identity: { userId?: string | null; email?: string | null; profileId?: string | null }
) {
  const profile = await loadAccessProfileByIdentity(service, identity);
  return {
    profile,
    access: profile ? resolveAccess(profile) : null,
  };
}

export async function loadAccessProfileByIdentity(
  service: SupabaseClient,
  identity: { userId?: string | null; email?: string | null; profileId?: string | null }
): Promise<AccessProfile | null> {
  if (identity.profileId) {
    const byId = await loadAccessProfileById(service, identity.profileId);
    if (byId) return byId;
  }

  if (identity.userId) {
    const { data: byClerkId, error: clerkError } = await service
      .from("profiles")
      .select("*")
      .eq("clerk_user_id", identity.userId)
      .maybeSingle();

    if (!clerkError && byClerkId) return mapProfileRow(byClerkId as Record<string, unknown>);

    const { data: bySupabaseId, error: userError } = await service
      .from("profiles")
      .select("*")
      .eq("user_id", identity.userId)
      .maybeSingle();

    if (!userError && bySupabaseId) return mapProfileRow(bySupabaseId as Record<string, unknown>);
  }

  if (identity.email) {
    const { data, error } = await service
      .from("profiles")
      .select("*")
      .eq("email", identity.email)
      .maybeSingle();

    if (!error && data) return mapProfileRow(data as Record<string, unknown>);
  }

  return null;
}

export function canManageFeatureOverrides(access: ResolvedAccess | null): boolean {
  return Boolean(access?.capabilities.canManageFeatureOverrides);
}

export function canManageUsers(access: ResolvedAccess | null): boolean {
  return Boolean(access?.capabilities.canManageUsers);
}

export function canPromoteOwner(access: ResolvedAccess | null): boolean {
  return Boolean(access?.capabilities.canPromoteOwner);
}

export async function loadAccessProfileByUserId(service: SupabaseClient, userId: string): Promise<AccessProfile | null> {
  return loadAccessProfileByIdentity(service, { userId });
}

export async function loadAccessProfileById(service: SupabaseClient, profileId: string): Promise<AccessProfile | null> {
  const { data, error } = await service
    .from("profiles")
    .select("*")
    .eq("id", profileId)
    .maybeSingle();

  if (error || !data) return null;
  return mapProfileRow(data as Record<string, unknown>);
}

export async function writeAuditLog(
  service: SupabaseClient,
  input: {
    actorUserId: string;
    actorProfileId: string;
    targetProfileId: string;
    action: string;
    beforeState?: Record<string, unknown> | null;
    afterState?: Record<string, unknown> | null;
  }
) {
  const { error } = await service.from("hq_audit_logs").insert({
    actor_user_id: isUuid(input.actorUserId) ? input.actorUserId : null,
    actor_profile_id: input.actorProfileId,
    target_profile_id: input.targetProfileId,
    action: input.action,
    before_state: input.beforeState || null,
    after_state: input.afterState || null,
  });

  if (error) {
    console.error("Failed to write HQ audit log:", error.message);
  }
}
