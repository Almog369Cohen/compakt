import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { requireAuth, isAuthError } from "@/lib/requireAuth";

export const dynamic = "force-dynamic";

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

  const { data: guests } = await supabase
    .from("guest_invitations")
    .select(`
      id,
      guest_email,
      guest_name,
      invite_token,
      status,
      sent_at,
      connected_at,
      guest_playlists (
        id,
        playlist_name,
        track_count
      )
    `)
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });

  const guestsWithStats = (guests || []).map((guest) => {
    const playlists = guest.guest_playlists || [];
    const totalPlaylists = playlists.length;
    const totalTracks = playlists.reduce((sum, pl) => sum + (pl.track_count || 0), 0);

    return {
      id: guest.id,
      guestEmail: guest.guest_email,
      guestName: guest.guest_name,
      inviteToken: guest.invite_token,
      status: guest.status,
      sentAt: guest.sent_at,
      connectedAt: guest.connected_at,
      totalPlaylists,
      totalTracks,
    };
  });

  return NextResponse.json({ guests: guestsWithStats });
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

  const { guests } = await req.json();

  if (!Array.isArray(guests) || guests.length === 0) {
    return NextResponse.json({ error: "Invalid guests array" }, { status: 400 });
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

  const invitations = guests.map((guest: { email: string; name?: string }) => ({
    event_id: eventId,
    guest_email: guest.email,
    guest_name: guest.name || null,
    invite_token: crypto.randomUUID().replace(/-/g, ""),
    status: "pending",
  }));

  const { data: created, error } = await supabase
    .from("guest_invitations")
    .insert(invitations)
    .select("id, guest_email, guest_name, invite_token");

  if (error) {
    console.error("[Guest Invitations] Insert failed:", error);
    return NextResponse.json({ error: "Failed to create invitations" }, { status: 500 });
  }

  return NextResponse.json({ invitations: created });
}
