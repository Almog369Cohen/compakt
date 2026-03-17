import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const GUEST_SCOPES = [
  "playlist-read-private",
  "playlist-read-collaborative",
  "user-library-read",
  "user-top-read",
].join(" ");

function getRedirectUri(req: Request): string {
  if (process.env.SPOTIFY_GUEST_REDIRECT_URI) return process.env.SPOTIFY_GUEST_REDIRECT_URI;
  if (process.env.URL) return `${process.env.URL}/api/guest/spotify/callback`;
  const url = new URL(req.url);
  const host = req.headers.get("host") || url.host;
  const isLocal = host.startsWith("localhost") || host.startsWith("127.0.0.1");
  return `${isLocal ? "http" : "https"}://${host}/api/guest/spotify/callback`;
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
  const inviteToken = searchParams.get("token");

  if (!inviteToken) {
    return new NextResponse("Missing invite token", { status: 400 });
  }

  const redirectUri = getRedirectUri(req);
  const state = crypto.randomUUID();

  const authUrl = new URL("https://accounts.spotify.com/authorize");
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("scope", GUEST_SCOPES);
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("show_dialog", "true");

  const res = NextResponse.redirect(authUrl.toString());
  
  res.cookies.set("compakt_guest_spotify_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 10 * 60,
  });
  
  res.cookies.set("compakt_guest_invite_token", inviteToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 10 * 60,
  });

  return res;
}
