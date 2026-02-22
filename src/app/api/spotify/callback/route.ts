import { NextResponse } from "next/server";

function getSiteOrigin(req: Request): string {
  if (process.env.URL) return process.env.URL;
  const url = new URL(req.url);
  const host = req.headers.get("host") || url.host;
  const isLocal = host.startsWith("localhost") || host.startsWith("127.0.0.1");
  return `${isLocal ? "http" : "https"}://${host}`;
}

function getRedirectUri(req: Request): string {
  if (process.env.SPOTIFY_REDIRECT_URI) return process.env.SPOTIFY_REDIRECT_URI;
  return `${getSiteOrigin(req)}/api/spotify/callback`;
}

function getCookieValue(req: Request, name: string): string | undefined {
  const prefix = `${name}=`;
  const entry = req.headers
    .get("cookie")
    ?.split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(prefix));
  if (!entry) return undefined;
  return entry.substring(prefix.length);
}

export async function GET(req: Request) {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return new NextResponse("Missing SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET", {
      status: 500,
    });
  }

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (!code || !state) {
    return new NextResponse("Missing code/state", { status: 400 });
  }

  const cookieState = getCookieValue(req, "compakt_spotify_oauth_state");

  if (!cookieState || cookieState !== state) {
    return new NextResponse("Invalid state", { status: 400 });
  }

  const redirectUri = getRedirectUri(req);

  const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }).toString(),
    cache: "no-store",
  });

  if (!tokenRes.ok) {
    const txt = await tokenRes.text().catch(() => "");
    return new NextResponse(`Spotify token exchange failed (${tokenRes.status}): ${txt}`, {
      status: 500,
    });
  }

  const json = (await tokenRes.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  };

  const now = Date.now();
  const expiresAt = now + (json.expires_in || 3600) * 1000;
  const payload = Buffer.from(
    JSON.stringify({
      access_token: json.access_token,
      refresh_token: json.refresh_token,
      expires_at: expiresAt,
    })
  ).toString("base64");

  const returnTo = getCookieValue(req, "compakt_spotify_return_to");

  const siteOrigin = getSiteOrigin(req);
  const redirectPath = returnTo ? decodeURIComponent(returnTo) : "/admin";
  const redirectUrl = redirectPath.startsWith("http") ? redirectPath : `${siteOrigin}${redirectPath}`;
  const res = NextResponse.redirect(redirectUrl);

  res.cookies.set("compakt_spotify", payload, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  res.cookies.delete("compakt_spotify_oauth_state");
  res.cookies.delete("compakt_spotify_return_to");

  return res;
}
