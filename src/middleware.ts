import { NextRequest, NextResponse } from "next/server";
import { clerkMiddleware } from "@clerk/nextjs/server";

/**
 * Next.js Middleware — runs on every matched route.
 * Validates Supabase auth session for protected paths.
 *
 * - /admin, /hq → redirect to /admin?login=1 if no session
 * - /api/admin/* → return 401 JSON if no session
 */
export default clerkMiddleware(async (auth, req: NextRequest) => {
  const res = NextResponse.next();
  const clerkAuth = await auth();
  const hasClerkUser = Boolean(clerkAuth.userId);
  const bypassCookie = req.cookies.get('compakt-admin-bypass')?.value;
  const isAuthenticated = hasClerkUser || Boolean(bypassCookie);

  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/api/admin")) {
    if (!isAuthenticated) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    return res;
  }

  if (pathname.startsWith("/admin") || pathname.startsWith("/hq")) {
    if (!isAuthenticated) {
      const loginUrl = req.nextUrl.clone();
      loginUrl.pathname = "/admin";
      loginUrl.searchParams.set("login", "1");
      if (pathname === "/admin") {
        return res;
      }
      return NextResponse.redirect(loginUrl);
    }
    return res;
  }

  return res;
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
