import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { generateEventNumber, generateMagicToken } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

type EventInsertRow = {
  dj_id?: string;
  magic_token: string;
  token: string;
  event_type: string;
  couple_name_a: string;
  couple_name_b: string;
  event_date: string;
  venue: string;
  phone_number: string;
  email?: string;
  current_stage: number;
};

async function resolveDjProfileId(
  supabase: ReturnType<typeof getServiceSupabase>,
  djId: string | null,
  djSlug: string | null
): Promise<string | null> {
  const normalizedId = typeof djId === "string" ? djId.trim() : "";
  const normalizedSlug = typeof djSlug === "string" ? djSlug.trim() : "";

  if (normalizedId) {
    const { data } = await supabase
      .from("profiles")
      .select("id, user_id")
      .or(`id.eq.${normalizedId},user_id.eq.${normalizedId}`)
      .maybeSingle();

    if (data?.user_id) return data.user_id;
    if (data?.id) return data.id;
  }

  if (normalizedSlug) {
    const { data } = await supabase
      .from("profiles")
      .select("id, user_id")
      .eq("dj_slug", normalizedSlug)
      .maybeSingle();

    if (data?.user_id) return data.user_id;
    if (data?.id) return data.id;
  }

  return null;
}

async function insertEventRow(
  supabase: ReturnType<typeof getServiceSupabase>,
  row: EventInsertRow,
  includeEmail: boolean
) {
  const baseInsert = {
    dj_id: row.dj_id,
    magic_token: row.magic_token,
    token: row.token,
    event_type: row.event_type,
    couple_name_a: row.couple_name_a,
    couple_name_b: row.couple_name_b,
    event_date: row.event_date,
    venue: row.venue,
    phone_number: row.phone_number,
    current_stage: row.current_stage,
    ...(includeEmail && row.email ? { email: row.email } : {}),
  };

  return supabase
    .from("events")
    .insert(baseInsert)
    .select("id, magic_token, token, event_type, couple_name_a, couple_name_b, event_date, venue, phone_number, dj_id, current_stage, created_at")
    .single();
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      djId,
      djSlug,
      eventType,
      coupleNameA,
      coupleNameB,
      eventDate,
      venue,
      contactEmail,
      contactPhone,
    } = body;

    if (!djId && !djSlug) {
      return NextResponse.json({ error: "Missing DJ identity" }, { status: 400 });
    }

    const normalizedEmail = normalizeEmail(String(contactEmail || ""));
    if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
      return NextResponse.json({ error: "כתובת מייל לא תקינה" }, { status: 400 });
    }

    const supabase = getServiceSupabase();
    const resolvedDjId = await resolveDjProfileId(
      supabase,
      typeof djId === "string" ? djId : null,
      typeof djSlug === "string" ? djSlug : null
    );

    if (!resolvedDjId) {
      return NextResponse.json(
        { error: "הדיג׳יי שנבחר לא נמצא. רעננו את הדף ובחרו שוב." },
        { status: 400 }
      );
    }

    const token = generateMagicToken();
    const eventNumber = generateEventNumber();
    const insertPayload: EventInsertRow = {
      dj_id: resolvedDjId,
      magic_token: token,
      token: eventNumber,
      event_type: eventType || "wedding",
      couple_name_a: coupleNameA || "",
      couple_name_b: coupleNameB || "",
      event_date: eventDate || "",
      venue: venue || "",
      phone_number: contactPhone || "",
      email: normalizedEmail,
      current_stage: 0,
    };

    let attempt = await insertEventRow(supabase, insertPayload, true);

    if (attempt.error?.message.includes("email")) {
      attempt = await insertEventRow(supabase, insertPayload, false);
    }

    if (attempt.error?.message.includes("events_dj_id_fkey")) {
      const retryWithoutDj = await insertEventRow(
        supabase,
        { ...insertPayload, dj_id: undefined },
        !attempt.error.message.includes("email")
      );

      if (retryWithoutDj.error?.message.includes("email")) {
        const retryWithoutDjNoEmail = await insertEventRow(
          supabase,
          { ...insertPayload, dj_id: undefined },
          false
        );

        if (retryWithoutDjNoEmail.error) {
          return NextResponse.json({ error: retryWithoutDjNoEmail.error.message }, { status: 500 });
        }

        return NextResponse.json({
          event: retryWithoutDjNoEmail.data,
          eventKey: retryWithoutDjNoEmail.data.magic_token,
          eventNumber: retryWithoutDjNoEmail.data.token,
        });
      }

      if (retryWithoutDj.error) {
        return NextResponse.json({ error: retryWithoutDj.error.message }, { status: 500 });
      }

      return NextResponse.json({
        event: retryWithoutDj.data,
        eventKey: retryWithoutDj.data.magic_token,
        eventNumber: retryWithoutDj.data.token,
      });
    }

    if (attempt.error) {
      return NextResponse.json({ error: attempt.error.message }, { status: 500 });
    }

    const data = attempt.data;

    return NextResponse.json({
      event: data,
      eventKey: data.magic_token,
      eventNumber: data.token,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to create event" },
      { status: 500 }
    );
  }
}
