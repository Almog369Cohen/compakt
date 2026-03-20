import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { requireAuth, isAuthError } from "@/lib/requireAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/hq/users
 * 
 * Returns all users with enhanced data for the HQ dashboard
 * Includes statistics and activity information
 */
export async function GET(req: Request) {
  try {
    const auth = await requireAuth({ allowedRoles: ["staff", "owner"] });
    if (isAuthError(auth)) return auth;

    const supabase = getServiceSupabase();
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const offset = parseInt(url.searchParams.get("offset") || "0");
    const search = url.searchParams.get("search") || "";
    const role = url.searchParams.get("role") || "";
    const plan = url.searchParams.get("plan") || "";
    const status = url.searchParams.get("status") || "";

    let query = supabase
      .from("profiles")
      .select(`
        *,
        events_count:events(count),
        songs_count:songs(count),
        questions_count:questions(count)
      `)
      .order("created_at", { ascending: false });

    // Apply filters
    if (search) {
      query = query.or(`email.ilike.%${search}%,business_name.ilike.%${search}%`);
    }
    if (role) {
      query = query.eq("role", role);
    }
    if (plan) {
      query = query.eq("plan", plan);
    }
    if (status) {
      if (status === "active") {
        query = query.eq("is_active", true);
      } else if (status === "inactive") {
        query = query.eq("is_active", false);
      }
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: users, error } = await query;

    if (error) {
      console.error("Failed to fetch users:", error);
      return NextResponse.json(
        { error: "Failed to fetch users" },
        { status: 500 }
      );
    }

    // Get total count for pagination
    const { count: totalCount } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    return NextResponse.json({
      users: users || [],
      pagination: {
        total: totalCount || 0,
        limit,
        offset,
        hasMore: (offset + limit) < (totalCount || 0),
      },
    });

  } catch (error) {
    console.error("Users API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/hq/users
 * 
 * Create a new user (admin only)
 */
export async function POST(req: Request) {
  try {
    const auth = await requireAuth({ allowedRoles: ["owner"] });
    if (isAuthError(auth)) return auth;

    const body = await req.json();
    const { email, businessName, role = "dj", plan = "starter" } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    // Create new user
    const { data, error } = await supabase
      .from("profiles")
      .insert({
        email,
        business_name: businessName || "",
        role,
        plan,
        is_active: true,
        onboarding_complete: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to create user:", error);
      return NextResponse.json(
        { error: "Failed to create user" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      user: data,
      message: "User created successfully",
    });

  } catch (error) {
    console.error("Create user error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
