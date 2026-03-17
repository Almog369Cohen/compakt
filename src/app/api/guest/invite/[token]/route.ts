import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { token: string } }
) {
  const token = params.token;

  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  const supabase = getServiceSupabase();

  const { data: invitation, error } = await supabase
    .from("guest_invitations")
    .select(`
      id,
      guest_email,
      guest_name,
      status,
      event_id,
      events (
        id,
        couple_name_a,
        couple_name_b,
        event_date,
        venue,
        event_type
      )
    `)
    .eq("invite_token", token)
    .single();

  if (error || !invitation) {
    return NextResponse.json({ error: "Invalid invitation token" }, { status: 404 });
  }

  return NextResponse.json({
    invitation: {
      id: invitation.id,
      guestEmail: invitation.guest_email,
      guestName: invitation.guest_name,
      status: invitation.status,
      event: invitation.events,
    },
  });
}
