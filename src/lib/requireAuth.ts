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

  console.log("🔐 Auth: Checking authentication...");

  let service;
  try {
    service = getServiceSupabase();
  } catch {
    console.log("❌ Auth: Supabase service error");
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }

  let userId: string | null = null;
  let email: string | null = null;

  try {
    const supabase = await createRouteClient();
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

    userId = user.id;
    email = user.email ?? null;
  } catch {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  const { data: profile } = await service
    .from("profiles")
    .select("id, role")
    .eq("email", email)
    .single();

  if (!profile && allowedRoles && allowedRoles.length > 0) {
    return NextResponse.json(
      { error: "Forbidden: profile not found" },
      { status: 403 }
    );
  }

  if (!profile && !allowedRoles?.length) {
    return {
      userId: userId!,
      profileId: "temp",
      role: "temp",
      email: email!,
    };
  }

  if (!profile) {
    return NextResponse.json(
      { error: "Failed to load profile" },
      { status: 500 }
    );
  }

  const role = profile.role ?? "dj";
  const profileId = profile.id ?? "";

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return NextResponse.json(
      { error: "Forbidden: insufficient role" },
      { status: 403 }
    );
  }

  return {
    userId,
    profileId,
    role,
    email,
  };
}

/** Type guard to check if requireAuth returned an error response */
export function isAuthError(
  result: AuthContext | NextResponse
): result is NextResponse {
  return result instanceof NextResponse;
}
