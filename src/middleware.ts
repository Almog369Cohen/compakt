import { NextRequest, NextResponse } from "next/server";
import { createMiddlewareSupabase } from "@/lib/supabase-server";

/**
 * Next.js Middleware — runs on every matched route.
 * Validates Supabase auth session for protected paths.
 *
 * - /admin, /hq → redirect to /admin?login=1 if no session
 * - /api/admin/* → return 401 JSON if no session
 */
export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareSupabase(req, res);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = req.nextUrl;

  // API routes: return 401 JSON
  if (pathname.startsWith("/api/admin")) {
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    return res;
  }

  // Page routes: redirect to login
  if (pathname.startsWith("/admin") || pathname.startsWith("/hq")) {
    if (!user) {
      const loginUrl = req.nextUrl.clone();
      loginUrl.pathname = "/admin";
      loginUrl.searchParams.set("login", "1");
      // If already on /admin, don't redirect (let the page show the login form)
      if (pathname === "/admin") {
        return res;
      }
      return NextResponse.redirect(loginUrl);
    }
    return res;
  }

  return res;
}

export const config = {
  matcher: ["/admin/:path*", "/hq/:path*", "/api/admin/:path*", "/api/hq/:path*"],
};
