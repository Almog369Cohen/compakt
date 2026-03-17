import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { requireAuth, isAuthError } from "@/lib/requireAuth";

export const dynamic = "force-dynamic";

type TrackAnalysis = {
  spotifyTrackId: string;
  title: string;
  artist: string;
  album: string;
  occurrenceCount: number;
  guestPercentage: number;
  popularity: number;
};

async function analyzeEventMusic(eventId: string): Promise<{
  topTracks: TrackAnalysis[];
  totalGuestsConnected: number;
  totalTracksAnalyzed: number;
}> {
  const supabase = getServiceSupabase();

  const { data: invitations } = await supabase
    .from("guest_invitations")
    .select("id")
    .eq("event_id", eventId)
    .eq("status", "connected");

  if (!invitations) {
    return {
      topTracks: [],
      totalGuestsConnected: 0,
      totalTracksAnalyzed: 0,
    };
  }

  const totalGuestsConnected = invitations.length;

  if (totalGuestsConnected === 0) {
    return {
      topTracks: [],
      totalGuestsConnected: 0,
      totalTracksAnalyzed: 0,
    };
  }

  const invitationIds = invitations.map((inv) => inv.id);

  const { data: playlists } = await supabase
    .from("guest_playlists")
    .select("id")
    .in("invitation_id", invitationIds);

  if (!playlists || playlists.length === 0) {
    return {
      topTracks: [],
      totalGuestsConnected,
      totalTracksAnalyzed: 0,
    };
  }

  const playlistIds = playlists.map((pl) => pl.id);

  const { data: tracks } = await supabase
    .from("guest_tracks")
    .select("spotify_track_id, title, artist, album, popularity")
    .in("playlist_id", playlistIds);

  if (!tracks || tracks.length === 0) {
    return {
      topTracks: [],
      totalGuestsConnected,
      totalTracksAnalyzed: 0,
    };
  }

  const trackMap = new Map<string, TrackAnalysis>();

  for (const track of tracks) {
    const key = track.spotify_track_id;

    if (trackMap.has(key)) {
      const existing = trackMap.get(key)!;
      existing.occurrenceCount += 1;
      existing.popularity = Math.max(existing.popularity, track.popularity || 0);
    } else {
      trackMap.set(key, {
        spotifyTrackId: track.spotify_track_id,
        title: track.title,
        artist: track.artist,
        album: track.album || "",
        occurrenceCount: 1,
        guestPercentage: 0,
        popularity: track.popularity || 0,
      });
    }
  }

  const topTracks = Array.from(trackMap.values())
    .map((track) => ({
      ...track,
      guestPercentage: Math.round((track.occurrenceCount / totalGuestsConnected) * 100 * 100) / 100,
    }))
    .sort((a, b) => {
      if (b.occurrenceCount !== a.occurrenceCount) {
        return b.occurrenceCount - a.occurrenceCount;
      }
      return b.popularity - a.popularity;
    })
    .slice(0, 50);

  return {
    topTracks,
    totalGuestsConnected,
    totalTracksAnalyzed: tracks.length,
  };
}

export async function GET(
  req: Request,
  { params }: { params: { eventId: string } }
) {
  const auth = await requireAuth();
  if (isAuthError(auth)) return auth;

  const eventId = params.eventId;

  if (!eventId) {
    return NextResponse.json({ error: "Missing event ID" }, { status: 400 });
  }

  const supabase = getServiceSupabase();

  const { data: event } = await supabase
    .from("events")
    .select("id, dj_id")
    .eq("id", eventId)
    .single();

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const { data: cachedAnalysis } = await supabase
    .from("event_music_analysis")
    .select("*")
    .eq("event_id", eventId)
    .single();

  if (cachedAnalysis) {
    const cacheAge = Date.now() - new Date(cachedAnalysis.last_analyzed_at).getTime();
    const oneHour = 60 * 60 * 1000;

    if (cacheAge < oneHour) {
      return NextResponse.json({
        analysis: {
          topTracks: cachedAnalysis.top_tracks,
          totalGuestsConnected: cachedAnalysis.total_guests_connected,
          totalTracksAnalyzed: cachedAnalysis.total_tracks_analyzed,
          lastAnalyzedAt: cachedAnalysis.last_analyzed_at,
        },
        cached: true,
      });
    }
  }

  const analysis = await analyzeEventMusic(eventId);

  await supabase
    .from("event_music_analysis")
    .upsert(
      {
        event_id: eventId,
        top_tracks: analysis.topTracks,
        total_guests_connected: analysis.totalGuestsConnected,
        total_tracks_analyzed: analysis.totalTracksAnalyzed,
        last_analyzed_at: new Date().toISOString(),
      },
      { onConflict: "event_id" }
    );

  return NextResponse.json({
    analysis: {
      ...analysis,
      lastAnalyzedAt: new Date().toISOString(),
    },
    cached: false,
  });
}

export async function POST(
  req: Request,
  { params }: { params: { eventId: string } }
) {
  const auth = await requireAuth();
  if (isAuthError(auth)) return auth;

  const eventId = params.eventId;

  if (!eventId) {
    return NextResponse.json({ error: "Missing event ID" }, { status: 400 });
  }

  const supabase = getServiceSupabase();

  const { data: event } = await supabase
    .from("events")
    .select("id, dj_id")
    .eq("id", eventId)
    .single();

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const analysis = await analyzeEventMusic(eventId);

  await supabase
    .from("event_music_analysis")
    .upsert(
      {
        event_id: eventId,
        top_tracks: analysis.topTracks,
        total_guests_connected: analysis.totalGuestsConnected,
        total_tracks_analyzed: analysis.totalTracksAnalyzed,
        last_analyzed_at: new Date().toISOString(),
      },
      { onConflict: "event_id" }
    );

  return NextResponse.json({
    analysis: {
      ...analysis,
      lastAnalyzedAt: new Date().toISOString(),
    },
    refreshed: true,
  });
}
