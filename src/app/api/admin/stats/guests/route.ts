import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { requireAuth, isAuthError } from "@/lib/requireAuth";

export const dynamic = "force-dynamic";

export async function GET() {
  console.log("📊 API: Loading guest stats...");
  const auth = await requireAuth();
  if (isAuthError(auth)) {
    console.log("❌ API: Authentication failed");
    return auth;
  }

  const supabase = getServiceSupabase();

  // For bypass mode, skip profile lookup and use all events
  let events;

  if (auth.profileId === "bypass") {
    console.log("📊 API: Using bypass mode - loading all events");
    const { data: allEvents } = await supabase
      .from("events")
      .select("id");
    events = allEvents;
  } else {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", auth.userId)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const { data: userEvents } = await supabase
      .from("events")
      .select("id")
      .eq("dj_id", profile.id);
    events = userEvents;
  }

  if (!events || events.length === 0) {
    return NextResponse.json({
      stats: {
        totalGuests: 0,
        connectedGuests: 0,
        totalPlaylists: 0,
        totalTracks: 0,
        recentGuests: [],
      },
    });
  }

  const eventIds = events.map((e) => e.id);

  const { data: allInvitations } = await supabase
    .from("guest_invitations")
    .select(`
      id,
      guest_email,
      guest_name,
      status,
      connected_at,
      event_id,
      events (
        id,
        couple_name_a,
        couple_name_b,
        event_date
      )
    `)
    .in("event_id", eventIds)
    .order("created_at", { ascending: false });

  const totalGuests = allInvitations?.length || 0;
  const connectedGuests = allInvitations?.filter((inv) => inv.status === "connected").length || 0;

  const connectedInvitationIds = allInvitations
    ?.filter((inv) => inv.status === "connected")
    .map((inv) => inv.id) || [];

  let totalPlaylists = 0;
  let totalTracks = 0;

  if (connectedInvitationIds.length > 0) {
    const { data: playlists } = await supabase
      .from("guest_playlists")
      .select("id, track_count")
      .in("invitation_id", connectedInvitationIds);

    totalPlaylists = playlists?.length || 0;
    totalTracks = playlists?.reduce((sum, pl) => sum + (pl.track_count || 0), 0) || 0;
  }

  const recentGuests = (allInvitations || [])
    .filter((inv) => inv.status === "connected")
    .slice(0, 10)
    .map((inv) => {
      const event = inv.events as { couple_name_a?: string; couple_name_b?: string; event_date?: string };
      const coupleNames = [event?.couple_name_a, event?.couple_name_b]
        .filter(Boolean)
        .join(" ו");

      return {
        id: inv.id,
        guestEmail: inv.guest_email,
        guestName: inv.guest_name,
        connectedAt: inv.connected_at,
        eventName: coupleNames || "אירוע ללא שם",
        eventDate: event?.event_date || null,
        eventId: inv.event_id, // Add event ID for playlist creation
      };
    });

  return NextResponse.json({
    stats: {
      totalGuests,
      connectedGuests,
      totalPlaylists,
      totalTracks,
      recentGuests,
    },
  });
}
