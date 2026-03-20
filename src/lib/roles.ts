/**
 * Role-based access control system for Compakt
 * Defines permissions, feature flags, and hierarchy
 */

export type Role = "dj" | "staff" | "owner" | "admin";

export type Feature = 
  | "analytics"
  | "couple_links"
  | "google_calendar_sync"
  | "spotify_import"
  | "image_uploads"
  | "custom_branding"
  | "advanced_questions"
  | "upsells"
  | "hq_access"
  | "team_access"
  | "payment_processing"
  | "bulk_operations"
  | "api_access"
  | "trial_management"
  | "user_management";

export interface RolePermissions {
  [key: string]: {
    features: Record<Feature, boolean>;
    canManageUsers: boolean;
    canManageBilling: boolean;
    canViewAnalytics: boolean;
    canAccessHQ: boolean;
    maxEvents: number;
    maxSongs: number;
    apiRateLimit: number;
  };
}

export const ROLE_PERMISSIONS: RolePermissions = {
  dj: {
    features: {
      analytics: false,
      couple_links: true,
      google_calendar_sync: false,
      spotify_import: false,
      image_uploads: false,
      custom_branding: false,
      advanced_questions: false,
      upsells: false,
     hq_access: false,
      team_access: false,
      payment_processing: false,
      bulk_operations: false,
      api_access: false,
      trial_management: false,
      user_management: false,
    },
    canManageUsers: false,
    canManageBilling: false,
    canViewAnalytics: false,
    canAccessHQ: false,
    maxEvents: 5,
    maxSongs: 50,
    apiRateLimit: 100,
  },
  staff: {
    features: {
      analytics: true,
      couple_links: true,
      google_calendar_sync: true,
      spotify_import: true,
      image_uploads: true,
      custom_branding: true,
      advanced_questions: true,
      upsells: true,
      hq_access: true,
      team_access: false,
      payment_processing: false,
      bulk_operations: true,
      api_access: true,
      trial_management: true,
      user_management: false,
    },
    canManageUsers: false,
    canManageBilling: false,
    canViewAnalytics: true,
    canAccessHQ: true,
    maxEvents: 50,
    maxSongs: 1000,
    apiRateLimit: 1000,
  },
  owner: {
    features: {
      analytics: true,
      couple_links: true,
      google_calendar_sync: true,
      spotify_import: true,
      image_uploads: true,
      custom_branding: true,
      advanced_questions: true,
      upsells: true,
      hq_access: true,
      team_access: true,
      payment_processing: true,
      bulk_operations: true,
      api_access: true,
      trial_management: true,
      user_management: true,
    },
    canManageUsers: true,
    canManageBilling: true,
    canViewAnalytics: true,
    canAccessHQ: true,
    maxEvents: -1, // unlimited
    maxSongs: -1, // unlimited
    apiRateLimit: 10000,
  },
  admin: {
    features: {
      analytics: true,
      couple_links: true,
      google_calendar_sync: true,
      spotify_import: true,
      image_uploads: true,
      custom_branding: true,
      advanced_questions: true,
      upsells: true,
      hq_access: true,
      team_access: true,
      payment_processing: true,
      bulk_operations: true,
      api_access: true,
      trial_management: true,
      user_management: true,
    },
    canManageUsers: true,
    canManageBilling: true,
    canViewAnalytics: true,
    canAccessHQ: true,
    maxEvents: -1, // unlimited
    maxSongs: -1, // unlimited
    apiRateLimit: 50000,
  },
};

export type Plan = "free" | "starter" | "premium" | "enterprise";

export interface PlanLimits {
  [key: string]: {
    maxEvents: number;
    maxSongs: number;
    maxGuests: number;
    features: Feature[];
    apiRateLimit: number;
    supportLevel: "basic" | "priority" | "dedicated";
  };
}

export const PLAN_LIMITS: PlanLimits = {
  free: {
    maxEvents: 3,
    maxSongs: 20,
    maxGuests: 50,
    features: ["couple_links"],
    apiRateLimit: 100,
    supportLevel: "basic",
  },
  starter: {
    maxEvents: 10,
    maxSongs: 100,
    maxGuests: 200,
    features: ["couple_links", "image_uploads", "google_calendar_sync"],
    apiRateLimit: 500,
    supportLevel: "basic",
  },
  premium: {
    maxEvents: 50,
    maxSongs: 1000,
    maxGuests: 1000,
    features: ["couple_links", "image_uploads", "google_calendar_sync", "spotify_import", "analytics"],
    apiRateLimit: 2000,
    supportLevel: "priority",
  },
  enterprise: {
    maxEvents: -1, // unlimited
    maxSongs: -1, // unlimited
    maxGuests: -1, // unlimited
    features: ["couple_links", "image_uploads", "google_calendar_sync", "spotify_import", "analytics", "custom_branding", "advanced_questions", "upsells"],
    apiRateLimit: 10000,
    supportLevel: "dedicated",
  },
};

/**
 * Get user permissions based on role and plan
 */
export function getUserPermissions(role: Role, plan: Plan) {
  const rolePerms = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.dj;
  const planLimits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;

  // Combine role permissions with plan limits
  const features = { ...rolePerms.features };
  
  // Enable features based on plan
  planLimits.features.forEach(feature => {
    features[feature] = true;
  });

  return {
    ...rolePerms,
    features,
    maxEvents: Math.min(rolePerms.maxEvents, planLimits.maxEvents),
    maxSongs: Math.min(rolePerms.maxSongs, planLimits.maxSongs),
    apiRateLimit: Math.min(rolePerms.apiRateLimit, planLimits.apiRateLimit),
    maxGuests: planLimits.maxGuests,
    supportLevel: planLimits.supportLevel,
  };
}

/**
 * Check if user has permission for a specific feature
 */
export function hasFeaturePermission(
  role: Role, 
  plan: Plan, 
  feature: Feature
): boolean {
  const permissions = getUserPermissions(role, plan);
  return permissions.features[feature] || false;
}

/**
 * Check if user can access a specific route/feature
 */
export function canAccess(
  role: Role,
  plan: Plan,
  resource: "hq" | "admin" | "analytics" | "billing" | "users"
): boolean {
  const permissions = getUserPermissions(role, plan);

  switch (resource) {
    case "hq":
      return permissions.canAccessHQ;
    case "admin":
      return role === "admin" || role === "owner";
    case "analytics":
      return permissions.canViewAnalytics;
    case "billing":
      return permissions.canManageBilling;
    case "users":
      return permissions.canManageUsers;
    default:
      return false;
  }
}

/**
 * Role hierarchy for escalation
 */
export const ROLE_HIERARCHY: Record<Role, number> = {
  dj: 1,
  staff: 2,
  owner: 3,
  admin: 4,
};

/**
 * Check if a role can manage another role
 */
export function canManageRole(managerRole: Role, targetRole: Role): boolean {
  return ROLE_HIERARCHY[managerRole] > ROLE_HIERARCHY[targetRole];
}

/**
 * Get available upgrades for a user
 */
export function getAvailableUpgrades(currentRole: Role, currentPlan: Plan): {
  roleUpgrades: Role[];
  planUpgrades: Plan[];
} {
  const roleUpgrades: Role[] = [];
  const planUpgrades: Plan[] = [];

  // Role upgrades
  if (currentRole === "dj") roleUpgrades.push("staff");
  if (currentRole === "staff") roleUpgrades.push("owner");
  if (currentRole === "owner") roleUpgrades.push("admin");

  // Plan upgrades
  if (currentPlan === "free") planUpgrades.push("starter", "premium", "enterprise");
  if (currentPlan === "starter") planUpgrades.push("premium", "enterprise");
  if (currentPlan === "premium") planUpgrades.push("enterprise");

  return { roleUpgrades, planUpgrades };
}
