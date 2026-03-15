import { NextFetchEvent, NextRequest, NextResponse } from "next/server";
import { createMiddlewareSupabase } from "@/lib/supabase-server";

const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const clerkSecretKey = process.env.CLERK_SECRET_KEY;
const clerkEnabled = Boolean(clerkPublishableKey && clerkSecretKey);

/**
 * Next.js Middleware — runs on every matched route.
 * Validates Supabase auth session for protected paths.
 *
 * - /admin, /hq → redirect to /admin?login=1 if no session
 * - /api/admin/* → return 401 JSON if no session
 */
async function handleRequest(
  req: NextRequest,
  getClerkUserId?: () => Promise<string | null>
) {
  const res = NextResponse.next();
  const { pathname } = req.nextUrl;
  const requiresAdminAuth =
    pathname.startsWith("/api/admin") || pathname.startsWith("/admin") || pathname.startsWith("/hq");

  if (!requiresAdminAuth || pathname === "/admin") {
    return res;
  }

  const bypassCookie = req.cookies.get("compakt-admin-bypass")?.value;
  const clerkUserId = getClerkUserId ? await getClerkUserId() : null;
  const hasClerkUser = Boolean(clerkUserId);

  let hasSupabaseUser = false;
  try {
    const supabase = createMiddlewareSupabase(req, res);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    hasSupabaseUser = Boolean(user);
  } catch {
    hasSupabaseUser = false;
  }

  const isAuthenticated = hasClerkUser || Boolean(bypassCookie) || hasSupabaseUser;

  if (pathname.startsWith("/api/admin")) {
    if (!isAuthenticated) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    return res;
  }

  if (pathname.startsWith("/admin") || pathname.startsWith("/hq")) {
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

export default async function middleware(req: NextRequest, event: NextFetchEvent) {
  if (!clerkEnabled) {
    return handleRequest(req);
  }

  const { clerkMiddleware } = await import("@clerk/nextjs/server");
  const middlewareWithClerk = clerkMiddleware(
    async (auth, clerkReq: NextRequest) =>
      handleRequest(clerkReq, async () => {
        const clerkAuth = await auth();
        return clerkAuth.userId ?? null;
      }),
    {
      publishableKey: clerkPublishableKey,
      secretKey: clerkSecretKey,
    }
  );

  return middlewareWithClerk(req, event);
}

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
