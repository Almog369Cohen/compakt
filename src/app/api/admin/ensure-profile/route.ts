import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { createRouteClient } from "@/lib/supabase-server";
import { loadAccessProfileByIdentity } from "@/lib/access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

/**
 * POST /api/admin/ensure-profile
 * Body: { userId, email? }
 *
 * Idempotent: returns existing profile or creates a minimal one.
 * Uses service role to bypass RLS (new users have no profile row yet).
 */
export async function POST() {
  try {
    const routeClient = await createRouteClient();
    const { data: { user }, error: authErr } = await routeClient.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const userId = user.id;
    const email = user.email ?? null;

    const supabase = getServiceSupabase();

    const existing = await loadAccessProfileByIdentity(supabase, { userId, email });

    if (existing) {
      const patch: Record<string, unknown> = {};
      if (isUuid(userId)) {
        if (!existing.user_id) {
          patch.user_id = userId;
        }
      } else if (!existing.clerk_user_id) {
        patch.clerk_user_id = userId;
      }
      if (email && existing.email !== email) {
        patch.email = email;
      }

      if (Object.keys(patch).length > 0) {
        await supabase.from("profiles").update(patch).eq("id", existing.id);
      }

      return NextResponse.json({
        profile: {
          id: existing.id,
          user_id: existing.user_id,
          business_name: existing.business_name,
          role: existing.role || "dj",
        },
        created: false,
      });
    }

    const newRow: Record<string, unknown> = {
      business_name: "",
      role: "dj",
      plan: "starter",
      is_active: true,
    };

    if (email) {
      newRow.email = email;
    }

    if (isUuid(userId)) {
      newRow.user_id = userId;
    } else {
      newRow.clerk_user_id = userId;
    }

    const { data: created, error: insertError } = await supabase
      .from("profiles")
      .insert(newRow)
      .select("id, user_id, business_name, role")
      .single();

    if (insertError) {
      // If email column doesn't exist, retry without it
      if (insertError.message.includes("email") || insertError.code === "42703") {
        delete newRow.email;
        const { data: retried, error: retryError } = await supabase
          .from("profiles")
          .insert(newRow)
          .select("id, user_id, business_name, role")
          .single();

        if (retryError) {
          return NextResponse.json({ error: retryError.message }, { status: 500 });
        }

        return NextResponse.json({ profile: retried, created: true });
      }

      // If role column doesn't exist, retry without it
      if (insertError.message.includes("role") || insertError.code === "42703") {
        delete newRow.role;
        delete newRow.email;
        const { data: retried, error: retryError } = await supabase
          .from("profiles")
          .insert(newRow)
          .select("id, user_id, business_name")
          .single();

        if (retryError) {
          return NextResponse.json({ error: retryError.message }, { status: 500 });
        }

        return NextResponse.json({ profile: retried, created: true });
      }

      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ profile: created, created: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to ensure profile" },
      { status: 500 }
    );
  }
}
