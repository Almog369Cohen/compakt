import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { requireAuth, isAuthError } from "@/lib/requireAuth";
import { createCoupon, getCoupons } from "@/lib/coupon";
import { loadAccessProfileByIdentity } from "@/lib/access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const auth = await requireAuth();
    if (isAuthError(auth)) return auth;

    // Only staff and owner can manage coupons
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

    const { searchParams } = new URL(request.url);
    const active = searchParams.get("active");
    const includeExpired = searchParams.get("includeExpired") === "true";
    const limit = searchParams.get("limit");

    const coupons = await getCoupons(supabase, {
      active: active === "true" ? true : active === "false" ? false : undefined,
      includeExpired,
      limit: limit ? parseInt(limit) : undefined,
    });

    return NextResponse.json({
      success: true,
      coupons,
    });
  } catch (error) {
    console.error("Error loading coupons:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAuth();
    if (isAuthError(auth)) return auth;

    // Only staff and owner can create coupons
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

    const {
      name,
      description,
      discountType,
      discountValue,
      maxUses,
      validDays,
      minPlanValue,
      applicablePlans,
      firstTimeOnly,
      trialTrigger,
    } = await request.json();

    // Validate required fields
    if (!name || !discountType || discountValue === undefined) {
      return NextResponse.json(
        { error: "Name, discount type, and discount value are required" },
        { status: 400 }
      );
    }

    // Validate discount type
    if (!["percentage", "fixed_amount", "free_trial"].includes(discountType)) {
      return NextResponse.json(
        { error: "Invalid discount type" },
        { status: 400 }
      );
    }

    // Validate discount value
    if (discountValue <= 0) {
      return NextResponse.json(
        { error: "Discount value must be positive" },
        { status: 400 }
      );
    }

    // Validate percentage discount
    if (discountType === "percentage" && discountValue > 100) {
      return NextResponse.json(
        { error: "Percentage discount cannot exceed 100%" },
        { status: 400 }
      );
    }

    // Validate valid days
    if (validDays && (validDays < 1 || validDays > 365)) {
      return NextResponse.json(
        { error: "Valid days must be between 1 and 365" },
        { status: 400 }
      );
    }

    // Validate max uses
    if (maxUses && (maxUses < 1 || maxUses > 10000)) {
      return NextResponse.json(
        { error: "Max uses must be between 1 and 10000" },
        { status: 400 }
      );
    }

    // Create coupon
    const result = await createCoupon(supabase, name, discountType, discountValue, {
      description,
      maxUses,
      validDays,
      minPlanValue,
      applicablePlans,
      firstTimeOnly,
      trialTrigger,
      createdBy: profile.id,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to create coupon" },
        { status: 500 }
      );
    }

    // Get the created coupon
    const coupon = await supabase
      .from("coupons")
      .select("*")
      .eq("id", result.couponId)
      .single();

    return NextResponse.json({
      success: true,
      coupon: coupon.data,
    });
  } catch (error) {
    console.error("Error creating coupon:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
