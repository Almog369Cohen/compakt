import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { requireAuth, isAuthError } from "@/lib/requireAuth";
import { loadAccessProfileByIdentity } from "@/lib/access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const auth = await requireAuth();
    if (isAuthError(auth)) return auth;

    // Only staff and owner can access trials
    const supabase = getServiceSupabase();

    let profile;
    if (auth.profileId === "bypass") {
      // Bypass users get owner privileges
      profile = { role: "owner" };
    } else {
      profile = await loadAccessProfileByIdentity(supabase, {
        profileId: auth.profileId,
        userId: auth.userId,
        email: auth.email,
      });
    }

    if (!profile || !["staff", "owner"].includes(profile.role)) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    // Get all trials (staff/owner can see all)
    const { data, error } = await supabase
      .from("trial_periods")
      .select(`
        *,
        profiles!inner (
          id,
          business_name,
          email,
          dj_slug
        )
      `)
      .order("trial_started_at", { ascending: false });

    if (error) throw error;

    // Transform data to include profile info
    const trials = (data || []).map((trial: any) => ({
      ...trial,
      profile_business_name: trial.profiles?.business_name,
      profile_email: trial.profiles?.email,
      profile_dj_slug: trial.profiles?.dj_slug,
    }));

    return NextResponse.json({
      success: true,
      trials,
    });
  } catch (error) {
    console.error("Error loading trials:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
