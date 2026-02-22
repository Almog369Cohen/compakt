import { NextResponse } from "next/server";

function extractPlaylistId(input: string): string | null {
  try {
    const url = new URL(input);
    // https://open.spotify.com/playlist/<id>?...
    const parts = url.pathname.split("/").filter(Boolean);
    const idx = parts.indexOf("playlist");
    if (idx >= 0 && parts[idx + 1]) return parts[idx + 1];

    // spotify:playlist:<id>
    if (input.startsWith("spotify:playlist:")) {
      const id = input.split(":")[2];
      return id || null;
    }
  } catch {
    // fallthrough
  }

  // Accept raw id
  if (/^[A-Za-z0-9]{10,}$/.test(input)) return input;
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
  const url = searchParams.get("url") || "";

  const playlistId = extractPlaylistId(url.trim());
  if (!playlistId) {
    return new NextResponse("Invalid playlist url", { status: 400 });
  }

  try {
    const token = await getAccessToken();

    const songs: Array<{
      title: string;
      artist: string;
      coverUrl: string;
      externalLink?: string;
    }> = [];

    let nextUrl: string | null = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=100`;

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

    return NextResponse.json({ songs });
  } catch (e) {
    return new NextResponse(e instanceof Error ? e.message : "Import failed", {
      status: 500,
    });
  }
}
