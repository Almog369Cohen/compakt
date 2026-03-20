import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { requireAuth, isAuthError } from "@/lib/requireAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const auth = await requireAuth();
    if (isAuthError(auth)) return auth;
    if (!auth.profileId) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const supabase = getServiceSupabase();
    let query = supabase.from("upsells").select("*");

    // For bypass users, load all upsells (admin view)
    if (auth.profileId === "bypass") {
      query = query.order("sort_order", { ascending: true });
    } else {
      query = query.eq("dj_id", auth.profileId).order("sort_order", { ascending: true });
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ upsells: data || [] });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load upsells" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireAuth();
    if (isAuthError(auth)) return auth;
    if (!auth.profileId) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const body = (await req.json()) as {
      upsell?: {
        id: string;
        title: string;
        description: string;
        price: number;
        currency: string;
        isActive: boolean;
        sortOrder: number;
      };
    };

    if (!body.upsell) {
      return NextResponse.json({ error: "Missing upsell" }, { status: 400 });
    }

    const upsell = body.upsell;
    const supabase = getServiceSupabase();
    const { error } = await supabase.from("upsells").insert({
      id: upsell.id,
      dj_id: auth.profileId,
      title: upsell.title,
      description: upsell.description,
      price: upsell.price,
      currency: upsell.currency,
      is_active: upsell.isActive,
      sort_order: upsell.sortOrder,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to create upsell" },
      { status: 500 }
    );
  }
}
