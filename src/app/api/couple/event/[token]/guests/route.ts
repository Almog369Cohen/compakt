import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;

    if (!token) {
      return NextResponse.json(
        { error: "Missing token" },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    // Get event by magic_token
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("id, couple_name_a, couple_name_b, event_date, venue")
      .eq("magic_token", token)
      .single();

    if (eventError || !event) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    // Get all guest invitations for this event
    const { data: invitations, error: invitationsError } = await supabase
      .from("guest_invitations")
      .select("*")
      .eq("event_id", event.id)
      .order("created_at", { ascending: false });

    if (invitationsError) {
      console.error("Failed to load invitations:", invitationsError);
      return NextResponse.json(
        { error: "Failed to load invitations" },
        { status: 500 }
      );
    }

    // Get playlist counts for connected guests
    const connectedIds = invitations
      ?.filter((inv) => inv.status === "connected")
      .map((inv) => inv.id) || [];

    let playlistCounts: Record<string, number> = {};
    let trackCounts: Record<string, number> = {};

    if (connectedIds.length > 0) {
      const { data: playlists } = await supabase
        .from("guest_playlists")
        .select("invitation_id, id, track_count")
        .in("invitation_id", connectedIds);

      if (playlists) {
        playlists.forEach((pl) => {
          playlistCounts[pl.invitation_id] = (playlistCounts[pl.invitation_id] || 0) + 1;
          trackCounts[pl.invitation_id] = (trackCounts[pl.invitation_id] || 0) + (pl.track_count || 0);
        });
      }
    }

    // Format response
    const guests = invitations?.map((inv) => ({
      id: inv.id,
      guestEmail: inv.guest_email,
      guestName: inv.guest_name,
      inviteToken: inv.invite_token,
      status: inv.status,
      sentAt: inv.sent_at,
      connectedAt: inv.connected_at,
      totalPlaylists: playlistCounts[inv.id] || 0,
      totalTracks: trackCounts[inv.id] || 0,
    })) || [];

    return NextResponse.json({
      event: {
        id: event.id,
        coupleName: [event.couple_name_a, event.couple_name_b].filter(Boolean).join(" ו"),
        eventDate: event.event_date,
        venue: event.venue,
      },
      guests,
      stats: {
        total: guests.length,
        connected: guests.filter((g) => g.status === "connected").length,
        pending: guests.filter((g) => g.status === "pending").length,
      },
    });
  } catch (error) {
    console.error("Error loading guests:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
