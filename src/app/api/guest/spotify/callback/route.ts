import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { encryptToken } from "@/lib/encryption";

export const dynamic = "force-dynamic";

function getSiteOrigin(req: Request): string {
  if (process.env.URL) return process.env.URL;
  const url = new URL(req.url);
  const host = req.headers.get("host") || url.host;
  const isLocal = host.startsWith("localhost") || host.startsWith("127.0.0.1");
  return `${isLocal ? "http" : "https"}://${host}`;
}

function getRedirectUri(req: Request): string {
  if (process.env.SPOTIFY_GUEST_REDIRECT_URI) return process.env.SPOTIFY_GUEST_REDIRECT_URI;
  return `${getSiteOrigin(req)}/api/guest/spotify/callback`;
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

  const cookieState = getCookieValue(req, "compakt_guest_spotify_state");
  const inviteToken = getCookieValue(req, "compakt_guest_invite_token");

  if (!cookieState || cookieState !== state) {
    return new NextResponse("Invalid state", { status: 400 });
  }

  if (!inviteToken) {
    return new NextResponse("Missing invite token", { status: 400 });
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

  const meRes = await fetch("https://api.spotify.com/v1/me", {
    headers: { Authorization: `Bearer ${json.access_token}` },
    cache: "no-store",
  });

  let spotifyUserId: string | undefined;
  if (meRes.ok) {
    const meData = (await meRes.json()) as { id?: string };
    spotifyUserId = meData.id;
  }

  const supabase = getServiceSupabase();

  const { data: invitation } = await supabase
    .from("guest_invitations")
    .select("id, event_id")
    .eq("invite_token", inviteToken)
    .single();

  if (!invitation) {
    return new NextResponse("Invalid invite token", { status: 404 });
  }

  const now = Date.now();
  const expiresAt = new Date(now + (json.expires_in || 3600) * 1000);

  const encryptedAccessToken = encryptToken(json.access_token);
  const encryptedRefreshToken = json.refresh_token ? encryptToken(json.refresh_token) : null;

  const { error: tokenError } = await supabase
    .from("guest_spotify_tokens")
    .upsert(
      {
        invitation_id: invitation.id,
        spotify_user_id: spotifyUserId,
        access_token: encryptedAccessToken,
        refresh_token: encryptedRefreshToken,
        expires_at: expiresAt.toISOString(),
      },
      { onConflict: "invitation_id" }
    );

  if (tokenError) {
    console.error("[Guest Spotify] Token save failed:", tokenError);
    return new NextResponse("Failed to save token", { status: 500 });
  }

  const { error: inviteError } = await supabase
    .from("guest_invitations")
    .update({
      status: "connected",
      connected_at: new Date().toISOString(),
    })
    .eq("id", invitation.id);

  if (inviteError) {
    console.error("[Guest Spotify] Invitation update failed:", inviteError);
  }

  const siteOrigin = getSiteOrigin(req);
  const redirectUrl = `${siteOrigin}/guest/${inviteToken}/success`;
  const res = NextResponse.redirect(redirectUrl);

  res.cookies.delete("compakt_guest_spotify_state");
  res.cookies.delete("compakt_guest_invite_token");

  return res;
}
