import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { generateMagicToken } from "@/lib/utils";

export const dynamic = "force-dynamic";

type GuestInput = {
  email: string;
  name?: string | null;
};

export async function POST(req: Request) {
  try {
    const { eventToken, guests } = await req.json();
    console.log("🔍 API: Adding guests with token:", eventToken);
    console.log("👥 API: Guests array:", guests);

    if (!eventToken || !guests || !Array.isArray(guests)) {
      console.log("❌ API: Missing eventToken or guests array");
      return NextResponse.json(
        { error: "Missing eventToken or guests array" },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    // Get event by magic_token
    console.log("🔍 API: Searching for event with magic_token:", eventToken);
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("id, dj_id, magic_token, token")
      .eq("magic_token", eventToken)
      .single();

    console.log("📊 API: Event query result:", { event, eventError });

    if (eventError || !event) {
      console.log("❌ API: Event not found. Error:", eventError);
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    // Parse and validate guests
    const guestsToAdd: GuestInput[] = guests
      .map((g: string | GuestInput) => {
        if (typeof g === "string") {
          const parts = g.split(",").map((p) => p.trim());
          return {
            email: parts[0],
            name: parts[1] || null,
          };
        }
        return g;
      })
      .filter((g) => g.email && g.email.includes("@"));

    if (guestsToAdd.length === 0) {
      return NextResponse.json(
        { error: "No valid email addresses provided" },
        { status: 400 }
      );
    }

    // Create invitations
    const invitations = guestsToAdd.map((guest) => ({
      event_id: event.id,
      guest_email: guest.email,
      guest_name: guest.name || null,
      invite_token: generateMagicToken(),
      status: "pending",
    }));

    const { data: created, error: insertError } = await supabase
      .from("guest_invitations")
      .insert(invitations)
      .select();

    if (insertError) {
      console.error("Failed to create invitations:", insertError);
      return NextResponse.json(
        { error: "Failed to create invitations" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      guests: created,
      count: created.length,
    });
  } catch (error) {
    console.error("Error adding guests:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
