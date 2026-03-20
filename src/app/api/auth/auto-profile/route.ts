import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/auth/auto-profile
 * 
 * Automatically creates or updates a profile with all necessary data
 * Used for seamless onboarding and profile synchronization
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, email, businessName, role = "dj", plan = "starter" } = body;

    if (!userId || !email) {
      return NextResponse.json(
        { error: "Missing required fields: userId, email" },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    // Check if profile exists
    let existingProfile = null;
    let fetchError = null;

    // Handle bypass users differently
    if (userId.startsWith("bypass-")) {
      // For bypass users, search by email only
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("email", email)
        .single();

      existingProfile = data;
      fetchError = error;
    } else {
      // For regular users, search by user_id or email
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .or(`user_id.eq.${userId},email.eq.${email}`)
        .single();

      existingProfile = data;
      fetchError = error;
    }

    if (fetchError && fetchError.code !== "PGRST116") {
      return NextResponse.json(
        { error: "Database error", details: fetchError.message },
        { status: 500 }
      );
    }

    // Prepare profile data with smart defaults
    const profileData = {
      ...(userId.startsWith("bypass-") ? {} : { user_id: userId }),
      email: email,
      business_name: businessName || "",
      role: existingProfile?.role || role,
      plan: existingProfile?.plan || plan,
      is_active: true,
      onboarding_complete: false,
      full_name: businessName || "",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    let result;

    if (existingProfile) {
      // Update existing profile
      const { data, error } = await supabase
        .from("profiles")
        .update({
          ...profileData,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingProfile.id)
        .select()
        .single();

      if (error) {
        return NextResponse.json(
          { error: "Failed to update profile", details: error.message },
          { status: 500 }
        );
      }

      result = { profile: data, created: false };
    } else {
      // Create new profile
      const { data, error } = await supabase
        .from("profiles")
        .insert(profileData)
        .select()
        .single();

      if (error) {
        return NextResponse.json(
          { error: "Failed to create profile", details: error.message },
          { status: 500 }
        );
      }

      result = { profile: data, created: true };
    }

    // Set up default settings for new users (skip for bypass users)
    if (result.created && !userId.startsWith("bypass-")) {
      await setupDefaultSettings(result.profile.id, supabase);
    }

    return NextResponse.json({
      success: true,
      profile: result.profile,
      created: result.created,
      message: result.created ? "Profile created successfully" : "Profile updated successfully",
    });

  } catch (error) {
    console.error("Auto-profile error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Set up default settings for new users
 */
async function setupDefaultSettings(profileId: string, supabase: any) {
  try {
    // Create default songs
    const defaultSongs = [
      {
        id: `default-${profileId}-1`,
        dj_id: profileId,
        title: "בוא נתחיל",
        artist: "אמן לדוגמה",
        category: "pop",
        tags: ["israeli", "pop"],
        energy: 5,
        language: "hebrew",
        is_safe: true,
        is_active: true,
        sort_order: 1,
      },
      {
        id: `default-${profileId}-2`,
        dj_id: profileId,
        title: "שיר ריקוד",
        artist: "אמן לדוגמה",
        category: "dance",
        tags: ["dance", "party"],
        energy: 8,
        language: "hebrew",
        is_safe: true,
        is_active: true,
        sort_order: 2,
      },
    ];

    await supabase.from("songs").insert(defaultSongs);

    // Create default questions
    const defaultQuestions = [
      {
        id: `default-${profileId}-1`,
        dj_id: profileId,
        question_he: "איזה סגנון מוזיקה אתם הכי אוהבים?",
        question_type: "multiple_choice",
        event_type: "wedding",
        options: [
          { label: "ישראלי", value: "israeli" },
          { label: "לועזי", value: "international" },
          { label: "מעורב", value: "mixed" },
        ],
        is_required: true,
        is_active: true,
        sort_order: 1,
      },
      {
        id: `default-${profileId}-2`,
        dj_id: profileId,
        question_he: "מה רמת האנרגיה הרצויה באירוע?",
        question_type: "slider",
        event_type: "wedding",
        slider_min: 1,
        slider_max: 10,
        slider_labels: ["רגוע", "מסיבה"],
        is_required: true,
        is_active: true,
        sort_order: 2,
      },
    ];

    await supabase.from("questions").insert(defaultQuestions);

    console.log(`Default settings set up for profile ${profileId}`);
  } catch (error) {
    console.error("Failed to set up default settings:", error);
    // Don't fail the whole request if default setup fails
  }
}
