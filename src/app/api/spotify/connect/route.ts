import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { hasFeature, loadResolvedAccessByUserId } from "@/lib/access";
import { requireAuth, isAuthError } from "@/lib/requireAuth";

const SCOPES = [
  "playlist-read-private",
  "playlist-read-collaborative",
].join(" ");

function getRedirectUri(req: Request): string {
  if (process.env.SPOTIFY_REDIRECT_URI) return process.env.SPOTIFY_REDIRECT_URI;
  if (process.env.URL) return `${process.env.URL}/api/spotify/callback`;
  const url = new URL(req.url);
  const host = req.headers.get("host") || url.host;
  const isLocal = host.startsWith("localhost") || host.startsWith("127.0.0.1");
  return `${isLocal ? "http" : "https"}://${host}/api/spotify/callback`;
}

export async function GET(req: Request) {
  const auth = await requireAuth();
  if (isAuthError(auth)) return auth;

  const supabase = getServiceSupabase();
  const { access } = await loadResolvedAccessByUserId(supabase, auth.userId);

  if (!access || !hasFeature(access, "spotify_import")) {
    return new NextResponse("Feature not enabled for this account", { status: 403 });
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return new NextResponse("Missing SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET", {
      status: 500,
    });
  }

  const { searchParams } = new URL(req.url);
  const returnTo = searchParams.get("returnTo") || "/admin";

  const debug = searchParams.get("debug") === "1";

  const redirectUri = getRedirectUri(req);

  if (debug) {
    return NextResponse.json({
      redirectUri,
      netlifyUrlEnv: process.env.URL || null,
      spotifyRedirectUriEnv: process.env.SPOTIFY_REDIRECT_URI || null,
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret,
    });
  }
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
