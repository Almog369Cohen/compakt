import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { encryptToken } from "@/lib/encryption";

export const dynamic = "force-dynamic";

type SpotifyTopTrack = {
  id: string;
  name: string;
  artists: Array<{ name: string }>;
  album: { name: string };
  popularity: number;
};

export async function POST(req: Request) {
  try {
    const { invitationId } = await req.json();

    if (!invitationId) {
      return NextResponse.json(
        { error: "Missing invitationId" },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    // Get invitation and token
    const { data: invitation, error: invError } = await supabase
      .from("guest_invitations")
      .select("id, event_id, status")
      .eq("id", invitationId)
      .single();

    if (invError || !invitation) {
      return NextResponse.json(
        { error: "Invitation not found" },
        { status: 404 }
      );
    }

    // Get Spotify token
    const { data: tokenData, error: tokenError } = await supabase
      .from("guest_spotify_tokens")
      .select("access_token, refresh_token, expires_at, spotify_user_id")
      .eq("invitation_id", invitationId)
      .single();

    if (tokenError || !tokenData) {
      return NextResponse.json(
        { error: "No Spotify token found" },
        { status: 404 }
      );
    }

    // Check if token is expired and refresh if needed
    let accessToken = tokenData.access_token;
    const expiresAt = new Date(tokenData.expires_at);
    const now = new Date();

    if (expiresAt <= now && tokenData.refresh_token) {
      // Refresh token
      const refreshResponse = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${Buffer.from(
            `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
          ).toString("base64")}`,
        },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: tokenData.refresh_token,
        }),
      });

      if (!refreshResponse.ok) {
        return NextResponse.json(
          { error: "Failed to refresh Spotify token" },
          { status: 500 }
        );
      }

      const refreshData = await refreshResponse.json();
      accessToken = refreshData.access_token;

      // Update token in database
      const newExpiresAt = new Date(Date.now() + refreshData.expires_in * 1000);
      await supabase
        .from("guest_spotify_tokens")
        .update({
          access_token: encryptToken(refreshData.access_token),
          expires_at: newExpiresAt.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("invitation_id", invitationId);
    }

    // Fetch top tracks from Spotify
    const topTracksResponse = await fetch(
      "https://api.spotify.com/v1/me/top/tracks?time_range=medium_term&limit=50",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!topTracksResponse.ok) {
      console.error("Spotify API error:", await topTracksResponse.text());
      return NextResponse.json(
        { error: "Failed to fetch top tracks from Spotify" },
        { status: 500 }
      );
    }

    const topTracksData = await topTracksResponse.json();
    const tracks: SpotifyTopTrack[] = topTracksData.items || [];

    if (tracks.length === 0) {
      return NextResponse.json(
        { error: "No top tracks found" },
        { status: 404 }
      );
    }

    // Create a virtual "Top Tracks" playlist
    const { data: playlist, error: playlistError } = await supabase
      .from("guest_playlists")
      .insert({
        invitation_id: invitationId,
        spotify_playlist_id: `top_tracks_${tokenData.spotify_user_id}`,
        playlist_name: "Top 50 שלי",
        track_count: tracks.length,
      })
      .select()
      .single();

    if (playlistError || !playlist) {
      console.error("Failed to create playlist:", playlistError);
      return NextResponse.json(
        { error: "Failed to save playlist" },
        { status: 500 }
      );
    }

    // Save tracks
    const tracksToInsert = tracks.map((track) => ({
      playlist_id: playlist.id,
      spotify_track_id: track.id,
      title: track.name,
      artist: track.artists.map((a) => a.name).join(", "),
      album: track.album.name,
      popularity: track.popularity,
    }));

    const { error: tracksError } = await supabase
      .from("guest_tracks")
      .insert(tracksToInsert);

    if (tracksError) {
      console.error("Failed to save tracks:", tracksError);
      return NextResponse.json(
        { error: "Failed to save tracks" },
        { status: 500 }
      );
    }

    // Update invitation status
    await supabase
      .from("guest_invitations")
      .update({
        status: "connected",
        connected_at: new Date().toISOString(),
      })
      .eq("id", invitationId);

    return NextResponse.json({
      success: true,
      playlistCount: 1,
      trackCount: tracks.length,
    });
  } catch (error) {
    console.error("Error fetching top tracks:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
