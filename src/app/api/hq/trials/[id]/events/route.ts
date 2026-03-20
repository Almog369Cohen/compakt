import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { requireAuth, isAuthError } from "@/lib/requireAuth";
import { getTrialEvents } from "@/lib/trial";
import { loadAccessProfileByIdentity } from "@/lib/access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAuth();
    if (isAuthError(auth)) return auth;

    const trialId = params.id;

    if (!trialId) {
      return NextResponse.json(
        { error: "Trial ID is required" },
        { status: 400 }
      );
    }

    // Only staff and owner can access trial events
    const supabase = getServiceSupabase();
    const profile = await loadAccessProfileByIdentity(supabase, {
      profileId: auth.profileId,
      userId: auth.userId,
      email: auth.email,
    });

    if (!profile || !["staff", "owner"].includes(profile.role)) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    // Get trial events
    const events = await getTrialEvents(supabase, trialId);

    return NextResponse.json({
      success: true,
      events,
    });
  } catch (error) {
    console.error("Error loading trial events:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
