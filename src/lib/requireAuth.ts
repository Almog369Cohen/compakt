import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createRouteClient } from "@/lib/supabase-server";
import { getServiceSupabase } from "@/lib/supabase";
import { loadAccessProfileByIdentity } from "@/lib/access";

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

  let service;
  try {
    service = getServiceSupabase();
  } catch {
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }

  let userId: string | null = null;
  let email: string | null = null;

  try {
    const clerkAuth = await auth();
    userId = clerkAuth.userId ?? null;
    email = clerkAuth.sessionClaims?.email as string | null | undefined ?? null;
  } catch {
    userId = null;
  }

  if (!userId) {
    try {
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

      userId = user.id;
      email = user.email ?? null;
    } catch {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
  }

  const profile = await loadAccessProfileByIdentity(service, {
    userId,
    email,
  });

  if (!profile && allowedRoles && allowedRoles.length > 0) {
    return NextResponse.json(
      { error: "Forbidden: profile not found" },
      { status: 403 }
    );
  }

  if (!profile && !allowedRoles?.length) {
    return {
      userId,
      profileId: "",
      role: "dj",
      email,
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
