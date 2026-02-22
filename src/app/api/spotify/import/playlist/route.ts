import { NextResponse } from "next/server";

type SpotifyCookie = {
  access_token: string;
  refresh_token?: string;
  expires_at: number;
};

function parseCookie(req: Request): SpotifyCookie | null {
  const prefix = "compakt_spotify=";
  const entry = req.headers
    .get("cookie")
    ?.split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(prefix));
  if (!entry) return null;
  const raw = entry.substring(prefix.length);
  if (!raw) return null;
  try {
    const json = Buffer.from(raw, "base64").toString("utf8");
    return JSON.parse(json) as SpotifyCookie;
  } catch {
    return null;
  }
}

async function refreshToken(refreshToken: string): Promise<SpotifyCookie> {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Missing SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET");
  }

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }).toString(),
    cache: "no-store",
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Spotify refresh failed (${res.status}): ${txt}`);
  }

  const json = (await res.json()) as {
    access_token: string;
    expires_in: number;
  };

  return {
    access_token: json.access_token,
    refresh_token: refreshToken,
    expires_at: Date.now() + (json.expires_in || 3600) * 1000,
  };
}

export async function GET(req: Request) {
  const cookie = parseCookie(req);
  if (!cookie) {
    return new NextResponse("Not connected", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id") || "";
  if (!id) return new NextResponse("Missing playlist id", { status: 400 });

  try {
    let token = cookie.access_token;
    let nextCookie = cookie;
    if (cookie.refresh_token && Date.now() > cookie.expires_at - 30_000) {
      nextCookie = await refreshToken(cookie.refresh_token);
      token = nextCookie.access_token;
    }

    const songs: Array<{ title: string; artist: string; coverUrl: string; externalLink?: string }> = [];
    let nextUrl: string | null = `https://api.spotify.com/v1/playlists/${id}/tracks?limit=100`;

    while (nextUrl) {
      const res = await fetch(nextUrl, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`Spotify playlist fetch failed (${res.status}): ${txt}`);
      }

      const json = (await res.json()) as {
        items: Array<{
          track?: {
            name: string;
            artists: Array<{ name: string }>;
            album?: { images?: Array<{ url: string }> };
            external_urls?: { spotify?: string };
          };
        }>;
        next: string | null;
      };

      for (const item of json.items) {
        const t = item.track;
        if (!t) continue;
        const title = t.name;
        const artist = t.artists?.[0]?.name || "";
        if (!title || !artist) continue;
        const coverUrl = t.album?.images?.[0]?.url || "";
        const externalLink = t.external_urls?.spotify;
        songs.push({ title, artist, coverUrl, externalLink });
      }

      nextUrl = json.next;
    }

    const res = NextResponse.json({ songs });

    if (nextCookie !== cookie) {
      const payload = Buffer.from(JSON.stringify(nextCookie)).toString("base64");
      res.cookies.set("compakt_spotify", payload, {
        httpOnly: true,
        sameSite: "lax",
        secure: true,
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
    }

    return res;
  } catch (e) {
    return new NextResponse(e instanceof Error ? e.message : "Spotify failed", {
      status: 500,
    });
  }
}
