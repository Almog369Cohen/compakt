import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { requireAuth, isAuthError } from "@/lib/requireAuth";
import { updateCoupon, deleteCoupon } from "@/lib/coupon";
import { loadAccessProfileByIdentity } from "@/lib/access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PATCH /api/hq/coupons/[id] - Update coupon
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const auth = await requireAuth();
    if (isAuthError(auth)) return auth;

    // Only staff and owner can update coupons
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

    const updates = await request.json();

    // Validate updates
    const allowedFields = [
      "name",
      "description", 
      "discount_type",
      "discount_value",
      "max_uses",
      "valid_until",
      "min_plan_value",
      "applicable_plans",
      "first_time_only",
      "trial_trigger",
      "is_active"
    ];

    const filteredUpdates: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        filteredUpdates[field] = updates[field];
      }
    }

    // Validate discount type if provided
    if (filteredUpdates.discount_type && 
        !["percentage", "fixed_amount", "free_trial"].includes(filteredUpdates.discount_type as string)) {
      return NextResponse.json(
        { error: "Invalid discount type" },
        { status: 400 }
      );
    }

    // Validate discount value if provided
    if (filteredUpdates.discount_value !== undefined) {
      const value = Number(filteredUpdates.discount_value);
      if (value <= 0) {
        return NextResponse.json(
          { error: "Discount value must be positive" },
          { status: 400 }
        );
      }
      
      // Validate percentage discount
      if (filteredUpdates.discount_type === "percentage" && value > 100) {
        return NextResponse.json(
          { error: "Percentage discount cannot exceed 100%" },
          { status: 400 }
        );
      }
      
      filteredUpdates.discount_value = value;
    }

    // Validate max uses if provided
    if (filteredUpdates.max_uses !== undefined) {
      const maxUses = Number(filteredUpdates.max_uses);
      if (maxUses && (maxUses < 1 || maxUses > 10000)) {
        return NextResponse.json(
          { error: "Max uses must be between 1 and 10000" },
          { status: 400 }
        );
      }
      filteredUpdates.max_uses = maxUses;
    }

    // Validate valid_until if provided
    if (filteredUpdates.valid_until !== undefined) {
      const validUntil = new Date(filteredUpdates.valid_until as string);
      if (isNaN(validUntil.getTime()) || validUntil <= new Date()) {
        return NextResponse.json(
          { error: "Valid until date must be in the future" },
          { status: 400 }
        );
      }
      filteredUpdates.valid_until = validUntil.toISOString();
    }

    const result = await updateCoupon(supabase, id, filteredUpdates);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to update coupon" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Coupon updated successfully"
    });
  } catch (error) {
    console.error("Error updating coupon:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/hq/coupons/[id] - Delete (deactivate) coupon
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const auth = await requireAuth();
    if (isAuthError(auth)) return auth;

    // Only staff and owner can delete coupons
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

    const result = await deleteCoupon(supabase, id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to delete coupon" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Coupon deactivated successfully"
    });
  } catch (error) {
    console.error("Error deleting coupon:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
