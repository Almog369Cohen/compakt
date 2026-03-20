import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { requireAuth, isAuthError } from "@/lib/requireAuth";
import { startTrial } from "@/lib/trial";
import { loadAccessProfileByIdentity } from "@/lib/access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const auth = await requireAuth();
    if (isAuthError(auth)) return auth;

    const { planKey = "pro", trialDays = 14, source = "self_signup" } = await request.json();

    // Validate input
    if (!["starter", "pro", "premium", "enterprise"].includes(planKey)) {
      return NextResponse.json(
        { error: "Invalid plan key" },
        { status: 400 }
      );
    }

    if (typeof trialDays !== "number" || trialDays < 1 || trialDays > 90) {
      return NextResponse.json(
        { error: "Trial days must be between 1 and 90" },
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

    // Check if user can start trial
    const existingTrials = await supabase
      .from("trial_periods")
      .select("*")
      .eq("profile_id", profile.id)
      .eq("is_active", true)
      .gt("trial_ends_at", new Date().toISOString());

    if (existingTrials.data && existingTrials.data.length > 0) {
      return NextResponse.json(
        { 
          error: "User already has an active trial",
          trial: existingTrials.data[0]
        },
        { status: 409 }
      );
    }

    // Start trial
    const result = await startTrial(supabase, profile.id, planKey, trialDays, source);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to start trial" },
        { status: 500 }
      );
    }

    // Log the trial start
    await supabase.from("analytics_events").insert({
      event_type: "trial_started",
      event_data: {
        profile_id: profile.id,
        plan_key: planKey,
        trial_days: trialDays,
        source,
        trial_id: result.trialId,
      },
    });

    return NextResponse.json({
      success: true,
      trialId: result.trialId,
      planKey,
      trialDays,
      trialEndsAt: new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000).toISOString(),
    });
  } catch (error) {
    console.error("Error starting trial:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
