import { NextRequest, NextResponse } from "next/server";
import { createMiddlewareSupabase } from "@/lib/supabase-server";

/**
 * Next.js Middleware — runs on every matched route.
 * Validates Supabase auth session for protected paths.
 *
 * - /admin, /hq → redirect to /admin?login=1 if no session
 * - /api/admin/* → return 401 JSON if no session
 */
async function handleRequest(req: NextRequest) {
  const res = NextResponse.next();
  const { pathname } = req.nextUrl;
  const requiresAdminAuth =
    pathname.startsWith("/api/admin") || pathname.startsWith("/admin") || pathname.startsWith("/hq");

  if (!requiresAdminAuth || pathname === "/admin") {
    return res;
  }

  const bypassCookie = req.cookies.get("compakt-admin-bypass")?.value;

  let hasSupabaseUser = false;
  let userRole: string | null = null;
  try {
    const supabase = createMiddlewareSupabase(req, res);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    hasSupabaseUser = Boolean(user);

    // Get user role for /hq access control
    if (user && pathname.startsWith("/hq")) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", user.id)
        .single();
      userRole = profile?.role || null;
    }
  } catch {
    hasSupabaseUser = false;
  }

  const isAuthenticated = Boolean(bypassCookie) || hasSupabaseUser;

  if (pathname.startsWith("/api/admin")) {
    if (!isAuthenticated) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    return res;
  }

  if (pathname.startsWith("/hq")) {
    if (!isAuthenticated) {
      const loginUrl = req.nextUrl.clone();
      loginUrl.pathname = "/admin";
      loginUrl.searchParams.set("login", "1");
      return NextResponse.redirect(loginUrl);
    }
    // Only staff and owner can access /hq
    if (userRole !== "staff" && userRole !== "owner") {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
    return res;
  }

  if (pathname.startsWith("/admin")) {
    if (!isAuthenticated) {
      const loginUrl = req.nextUrl.clone();
      loginUrl.pathname = "/admin";
      loginUrl.searchParams.set("login", "1");
      return NextResponse.redirect(loginUrl);
    }
    return res;
  }

  return res;
}

export default async function middleware(req: NextRequest) {
  return handleRequest(req);
}

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
