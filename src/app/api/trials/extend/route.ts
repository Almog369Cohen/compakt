import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { requireAuth, isAuthError } from "@/lib/requireAuth";
import { extendTrial } from "@/lib/trial";
import { loadAccessProfileByIdentity } from "@/lib/access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const auth = await requireAuth();
    if (isAuthError(auth)) return auth;

    const { trialId, extensionDays = 7 } = await request.json();

    if (!trialId) {
      return NextResponse.json(
        { error: "Trial ID is required" },
        { status: 400 }
      );
    }

    if (typeof extensionDays !== "number" || extensionDays < 1 || extensionDays > 30) {
      return NextResponse.json(
        { error: "Extension days must be between 1 and 30" },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();
    
    // Get user profile
    const profile = await loadAccessProfileByIdentity(supabase, {
      profileId: auth.profileId,
      userId: auth.userId,
      email: auth.email,
    });

    if (!profile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    // Verify trial belongs to user
    const { data: trial, error: trialError } = await supabase
      .from("trial_periods")
      .select("*")
      .eq("id", trialId)
      .eq("profile_id", profile.id)
      .eq("is_active", true)
      .single();

    if (trialError || !trial) {
      return NextResponse.json(
        { error: "Trial not found or not accessible" },
        { status: 404 }
      );
    }

    // Extend trial
    const result = await extendTrial(supabase, trialId, extensionDays);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to extend trial" },
        { status: 500 }
      );
    }

    // Log the extension
    await supabase.from("analytics_events").insert({
      event_type: "trial_extended",
      event_data: {
        profile_id: profile.id,
        trial_id: trialId,
        extension_days: extensionDays,
        previous_end_date: trial.trial_ends_at,
      },
    });

    // Get updated trial info
    const { data: updatedTrial } = await supabase
      .from("trial_periods")
      .select("*")
      .eq("id", trialId)
      .single();

    return NextResponse.json({
      success: true,
      trial: updatedTrial,
      extensionDays,
      newEndsAt: updatedTrial?.trial_ends_at,
    });
  } catch (error) {
    console.error("Error extending trial:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
