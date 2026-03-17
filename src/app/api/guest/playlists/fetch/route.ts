import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { decryptToken, encryptToken } from "@/lib/encryption";

export const dynamic = "force-dynamic";

type SpotifyPlaylist = {
  id: string;
  name: string;
  tracks: { total: number };
};

type SpotifyTrack = {
  track?: {
    id: string;
    name: string;
    artists: Array<{ name: string }>;
    album?: { name?: string };
    popularity?: number;
  };
};

async function refreshSpotifyToken(refreshToken: string): Promise<{ access_token: string; expires_in: number }> {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    throw new Error("Missing Spotify credentials");
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

  return await res.json();
}

async function fetchUserPlaylists(accessToken: string): Promise<SpotifyPlaylist[]> {
  const playlists: SpotifyPlaylist[] = [];
  let nextUrl: string | null = "https://api.spotify.com/v1/me/playlists?limit=50";

  while (nextUrl) {
    const res = await fetch(nextUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch playlists: ${res.status}`);
    }

    const json = (await res.json()) as { items: SpotifyPlaylist[]; next: string | null };
    playlists.push(...json.items);
    nextUrl = json.next;
  }

  return playlists;
}

async function fetchPlaylistTracks(playlistId: string, accessToken: string): Promise<SpotifyTrack[]> {
  const tracks: SpotifyTrack[] = [];
  let nextUrl: string | null = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=100`;

  while (nextUrl) {
    const res = await fetch(nextUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch tracks: ${res.status}`);
    }

    const json = (await res.json()) as { items: SpotifyTrack[]; next: string | null };
    tracks.push(...json.items);
    nextUrl = json.next;
  }

  return tracks;
}

export async function POST(req: Request) {
  try {
    const { inviteToken } = await req.json();

    if (!inviteToken) {
      return NextResponse.json({ error: "Missing invite token" }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    const { data: invitation } = await supabase
      .from("guest_invitations")
      .select("id, event_id, status")
      .eq("invite_token", inviteToken)
      .single();

    if (!invitation) {
      return NextResponse.json({ error: "Invalid invite token" }, { status: 404 });
    }

    if (invitation.status !== "connected") {
      return NextResponse.json({ error: "Guest not connected to Spotify" }, { status: 400 });
    }

    const { data: tokenData } = await supabase
      .from("guest_spotify_tokens")
      .select("access_token, refresh_token, expires_at")
      .eq("invitation_id", invitation.id)
      .single();

    if (!tokenData) {
      return NextResponse.json({ error: "No Spotify token found" }, { status: 404 });
    }

    let accessToken = decryptToken(tokenData.access_token);
    const expiresAt = new Date(tokenData.expires_at);

    if (expiresAt.getTime() < Date.now() + 60000) {
      if (!tokenData.refresh_token) {
        return NextResponse.json({ error: "Token expired and no refresh token" }, { status: 401 });
      }

      const refreshToken = decryptToken(tokenData.refresh_token);
      const refreshed = await refreshSpotifyToken(refreshToken);
      accessToken = refreshed.access_token;

      const newExpiresAt = new Date(Date.now() + refreshed.expires_in * 1000);
      await supabase
        .from("guest_spotify_tokens")
        .update({
          access_token: encryptToken(accessToken),
          expires_at: newExpiresAt.toISOString(),
        })
        .eq("invitation_id", invitation.id);
    }

    const playlists = await fetchUserPlaylists(accessToken);

    let totalTracksProcessed = 0;

    for (const playlist of playlists) {
      const { data: existingPlaylist } = await supabase
        .from("guest_playlists")
        .select("id")
        .eq("invitation_id", invitation.id)
        .eq("spotify_playlist_id", playlist.id)
        .single();

      let playlistDbId: string;

      if (existingPlaylist) {
        playlistDbId = existingPlaylist.id;
        await supabase
          .from("guest_tracks")
          .delete()
          .eq("playlist_id", playlistDbId);
      } else {
        const { data: newPlaylist, error: playlistError } = await supabase
          .from("guest_playlists")
          .insert({
            invitation_id: invitation.id,
            spotify_playlist_id: playlist.id,
            playlist_name: playlist.name,
            track_count: playlist.tracks.total,
          })
          .select("id")
          .single();

        if (playlistError || !newPlaylist) {
          console.error("[Guest Playlists] Failed to insert playlist:", playlistError);
          continue;
        }

        playlistDbId = newPlaylist.id;
      }

      const tracks = await fetchPlaylistTracks(playlist.id, accessToken);

      const trackInserts = tracks
        .filter((item) => item.track && item.track.id)
        .map((item) => ({
          playlist_id: playlistDbId,
          spotify_track_id: item.track!.id,
          title: item.track!.name,
          artist: item.track!.artists?.[0]?.name || "Unknown",
          album: item.track!.album?.name || "",
          popularity: item.track!.popularity || 0,
        }));

      if (trackInserts.length > 0) {
        const { error: tracksError } = await supabase
          .from("guest_tracks")
          .insert(trackInserts);

        if (tracksError) {
          console.error("[Guest Playlists] Failed to insert tracks:", tracksError);
        } else {
          totalTracksProcessed += trackInserts.length;
        }
      }

      await supabase
        .from("guest_playlists")
        .update({ track_count: trackInserts.length })
        .eq("id", playlistDbId);
    }

    return NextResponse.json({
      success: true,
      playlistsProcessed: playlists.length,
      tracksProcessed: totalTracksProcessed,
    });
  } catch (error) {
    console.error("[Guest Playlists Fetch] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch playlists" },
      { status: 500 }
    );
  }
}
