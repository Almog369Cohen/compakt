import { NextResponse } from "next/server";

function getOrigin(req: Request) {
  const url = new URL(req.url);
  return url.origin;
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

  const cookieState = req.headers
    .get("cookie")
    ?.split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith("compakt_spotify_oauth_state="))
    ?.split("=")[1];

  if (!cookieState || cookieState !== state) {
    return new NextResponse("Invalid state", { status: 400 });
  }

  const origin = getOrigin(req);
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI || `${origin}/api/spotify/callback`;

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

  const returnTo = req.headers
    .get("cookie")
    ?.split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith("compakt_spotify_return_to="))
    ?.split("=")[1];

  const redirect = returnTo ? decodeURIComponent(returnTo) : "/admin";
  const res = NextResponse.redirect(redirect);

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
