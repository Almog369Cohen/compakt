import { NextResponse } from "next/server";

const SCOPES = [
  "playlist-read-private",
  "playlist-read-collaborative",
].join(" ");

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

  const { searchParams } = new URL(req.url);
  const returnTo = searchParams.get("returnTo") || "/admin";

  const origin = getOrigin(req);
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI || `${origin}/api/spotify/callback`;
  const state = crypto.randomUUID();

  const authUrl = new URL("https://accounts.spotify.com/authorize");
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("scope", SCOPES);
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("show_dialog", "true");

  const res = NextResponse.redirect(authUrl.toString());
  res.cookies.set("compakt_spotify_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 10 * 60,
  });
  res.cookies.set("compakt_spotify_return_to", returnTo, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 10 * 60,
  });

  return res;
}
