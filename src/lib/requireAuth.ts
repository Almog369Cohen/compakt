import { NextResponse } from "next/server";
import { createRouteClient } from "@/lib/supabase-server";
import { getServiceSupabase } from "@/lib/supabase";

export type AuthContext = {
  userId: string;
  profileId: string;
  role: string;
  email: string | null;
};

type RequireAuthOptions = {
  /** Allowed roles. If empty, any authenticated user passes. */
  allowedRoles?: string[];
};

/**
 * Validates the Supabase session from cookies, looks up the profile row,
 * and returns { userId, profileId, role }.
 *
 * Returns a NextResponse (401/403) if auth fails — caller should return it immediately.
 */
export async function requireAuth(
  options: RequireAuthOptions = {}
): Promise<AuthContext | NextResponse> {
  const { allowedRoles } = options;

  // 1. Validate session from cookies
  const supabase = createRouteClient();
  const {
    data: { user },
    error: sessionError,
  } = await supabase.auth.getUser();

  if (sessionError || !user) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  // 2. Look up profile row using service role (bypasses RLS)
  const service = getServiceSupabase();
  const { data: profile, error: profileError } = await service
    .from("profiles")
    .select("id, role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError) {
    return NextResponse.json(
      { error: "Failed to load profile" },
      { status: 500 }
    );
  }

  // Profile might not exist yet (first login before ensure-profile runs).
  // For ensure-profile endpoint specifically, profileId may be null.
  const role = profile?.role ?? "dj";
  const profileId = profile?.id ?? "";

  // 3. Check role if required
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return NextResponse.json(
      { error: "Forbidden: insufficient role" },
      { status: 403 }
    );
  }

  return {
    userId: user.id,
    profileId,
    role,
    email: user.email ?? null,
  };
}

/** Type guard to check if requireAuth returned an error response */
export function isAuthError(
  result: AuthContext | NextResponse
): result is NextResponse {
  return result instanceof NextResponse;
}
