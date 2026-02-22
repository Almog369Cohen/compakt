import { NextResponse } from "next/server";

type SpotifyEntity =
  | { type: "playlist"; id: string }
  | { type: "track"; id: string };

function normalizeInput(input: string): string {
  const trimmed = input.trim();
  // Remove surrounding quotes
  return trimmed.replace(/^['\"]+/, "").replace(/['\"]+$/, "");
}

async function resolveShortLink(input: string): Promise<string> {
  try {
    const url = new URL(input);
    if (url.hostname !== "spotify.link") return input;
    const res = await fetch(input, { method: "GET", redirect: "follow", cache: "no-store" });
    return res.url || input;
  } catch {
    return input;
  }
}

function extractEntity(input: string): SpotifyEntity | null {
  // spotify:playlist:<id>
  if (input.startsWith("spotify:playlist:")) {
    const id = input.split(":")[2];
    return id ? { type: "playlist", id } : null;
  }

  // spotify:track:<id>
  if (input.startsWith("spotify:track:")) {
    const id = input.split(":")[2];
    return id ? { type: "track", id } : null;
  }

  try {
    const url = new URL(input);
    const parts = url.pathname.split("/").filter(Boolean);

    const playlistIdx = parts.indexOf("playlist");
    if (playlistIdx >= 0 && parts[playlistIdx + 1]) {
      return { type: "playlist", id: parts[playlistIdx + 1] };
    }

    const trackIdx = parts.indexOf("track");
    if (trackIdx >= 0 && parts[trackIdx + 1]) {
      return { type: "track", id: parts[trackIdx + 1] };
    }
  } catch {
    // ignore
  }

  // Accept raw IDs (default to playlist)
  if (/^[A-Za-z0-9]{10,}$/.test(input)) return { type: "playlist", id: input };
  return null;
}

async function getAccessToken(): Promise<string> {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Missing SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET");
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ grant_type: "client_credentials" }).toString(),
    cache: "no-store",
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Spotify token failed (${res.status}): ${txt}`);
  }

  const json = (await res.json()) as { access_token: string };
  if (!json.access_token) throw new Error("Spotify token missing access_token");
  return json.access_token;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const raw = searchParams.get("url") || "";
  const normalized = normalizeInput(raw);
  const resolved = await resolveShortLink(normalized);

  const entity = extractEntity(resolved);
  if (!entity) {
    return new NextResponse("Invalid spotify url", { status: 400 });
  }

  try {
    const token = await getAccessToken();

    const songs: Array<{
      title: string;
      artist: string;
      coverUrl: string;
      externalLink?: string;
    }> = [];

    if (entity.type === "track") {
      const res = await fetch(`https://api.spotify.com/v1/tracks/${entity.id}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`Spotify track fetch failed (${res.status}): ${txt}`);
      }

      const t = (await res.json()) as {
        name: string;
        artists: Array<{ name: string }>;
        album?: { images?: Array<{ url: string }> };
        external_urls?: { spotify?: string };
      };

      const title = t.name;
      const artist = t.artists?.[0]?.name || "";
      const coverUrl = t.album?.images?.[0]?.url || "";
      const externalLink = t.external_urls?.spotify;
      if (title && artist) songs.push({ title, artist, coverUrl, externalLink });
    } else {
      let nextUrl: string | null = `https://api.spotify.com/v1/playlists/${entity.id}/tracks?limit=100`;

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
    }

    if (songs.length === 0) {
      return new NextResponse("No tracks found", { status: 404 });
    }

    return NextResponse.json({ songs });
  } catch (e) {
    return new NextResponse(e instanceof Error ? e.message : "Import failed", {
      status: 500,
    });
  }
}
