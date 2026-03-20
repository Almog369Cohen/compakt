import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: { eventId: string } }
) {
  try {
    const { eventId } = params;

    if (!eventId) {
      return NextResponse.json(
        { error: "Missing eventId" },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    // Get event details
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("id, couple_name_a, couple_name_b, event_date, dj_id")
      .eq("id", eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    // Get connected invitations for this event
    const { data: invitations, error: invError } = await supabase
      .from("guest_invitations")
      .select("id")
      .eq("event_id", eventId)
      .eq("status", "connected");

    if (invError || !invitations || invitations.length === 0) {
      return NextResponse.json(
        { error: "No connected guests found for this event" },
        { status: 404 }
      );
    }

    const invitationIds = invitations.map(inv => inv.id);

    // Get playlists from connected guests
    const { data: playlists, error: playlistsError } = await supabase
      .from("guest_playlists")
      .select("id")
      .in("invitation_id", invitationIds);

    if (playlistsError || !playlists || playlists.length === 0) {
      return NextResponse.json(
        { error: "No playlists found for connected guests" },
        { status: 404 }
      );
    }

    const playlistIds = playlists.map(pl => pl.id);

    // Get top tracks from this event
    const { data: tracks, error: tracksError } = await supabase
      .from("guest_tracks")
      .select(`
        title,
        artist,
        spotify_track_id,
        popularity
      `)
      .in("playlist_id", playlistIds)
      .order("popularity", { ascending: false })
      .limit(50);

    if (tracksError || !tracks || tracks.length === 0) {
      return NextResponse.json(
        { error: "No tracks found for this event" },
        { status: 404 }
      );
    }

    // Get DJ's Spotify token
    const { data: djProfile, error: djError } = await supabase
      .from("profiles")
      .select("spotify_access_token, spotify_refresh_token, spotify_user_id")
      .eq("id", event.dj_id)
      .single();

    if (djError || !djProfile?.spotify_access_token) {
      return NextResponse.json(
        { 
          error: "DJ Spotify not connected. Please connect your Spotify account first.",
          needsSpotifyAuth: true
        },
        { status: 400 }
      );
    }

    // For now, we'll use the access token directly
    // In production, you'd want to check if it needs refreshing
    const accessToken = djProfile.spotify_access_token;

    // Create Spotify playlist
    const coupleNames = [event.couple_name_a, event.couple_name_b].filter(Boolean).join(" ו");
    const playlistName = `🎵 ${coupleNames} - המוזיקה של האורחים`;
    const playlistDescription = `פלייליסט שנוצר מהטעם המוזיקלי של האורחים באירוע${event.event_date ? ` מתאריך ${event.event_date}` : ""}`;

    const createPlaylistResponse = await fetch(`https://api.spotify.com/v1/users/${djProfile.spotify_user_id}/playlists`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: playlistName,
        description: playlistDescription,
        public: false,
      }),
    });

    if (!createPlaylistResponse.ok) {
      console.error("Spotify playlist creation error:", await createPlaylistResponse.text());
      return NextResponse.json(
        { error: "Failed to create playlist on Spotify" },
        { status: 500 }
      );
    }

    const playlistData = await createPlaylistResponse.json();
    const playlistId = playlistData.id;

    // Add tracks to playlist
    const trackUris = tracks.map(track => `spotify:track:${track.spotify_track_id}`).filter(Boolean);
    
    if (trackUris.length > 0) {
      const addTracksResponse = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uris: trackUris,
        }),
      });

      if (!addTracksResponse.ok) {
        console.error("Failed to add tracks to playlist:", await addTracksResponse.text());
        // Don't fail the whole operation if adding tracks fails
      }
    }

    return NextResponse.json({
      success: true,
      spotifyUrl: playlistData.external_urls.spotify,
      playlistId: playlistId,
      trackCount: trackUris.length,
      playlistName: playlistData.name,
    });
  } catch (error) {
    console.error("Error creating Spotify playlist:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
