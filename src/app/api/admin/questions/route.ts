import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { requireAuth, isAuthError } from "@/lib/requireAuth";
import type { EventType, QuestionOption, QuestionType } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function encodeEventTypes(eventType: EventType, eventTypes?: EventType[]) {
  const normalized = Array.from(
    new Set((eventTypes?.length ? eventTypes : [eventType]).filter(Boolean))
  );
  return normalized.join(",");
}

export async function GET() {
  try {
    const auth = await requireAuth();
    if (isAuthError(auth)) return auth;
    if (!auth.profileId) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const supabase = getServiceSupabase();
    let query = supabase.from("questions").select("*");

    // For bypass users, load all questions (admin view)
    if (auth.profileId === "bypass") {
      query = query.order("sort_order", { ascending: true });
    } else {
      query = query.eq("dj_id", auth.profileId).order("sort_order", { ascending: true });
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ questions: data || [] });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load questions" },
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
      question?: {
        id: string;
        questionHe: string;
        questionType: QuestionType;
        eventType: EventType;
        eventTypes?: EventType[];
        options?: QuestionOption[];
        sliderMin?: number;
        sliderMax?: number;
        sliderLabels?: string[];
        isActive: boolean;
        sortOrder: number;
      };
    };

    if (!body.question) {
      return NextResponse.json({ error: "Missing question" }, { status: 400 });
    }

    const question = body.question;
    const supabase = getServiceSupabase();
    const { error } = await supabase.from("questions").insert({
      id: question.id,
      dj_id: auth.profileId,
      question_he: question.questionHe,
      question_type: question.questionType,
      event_type: encodeEventTypes(question.eventType, question.eventTypes),
      options: question.options || [],
      slider_min: question.sliderMin ?? null,
      slider_max: question.sliderMax ?? null,
      slider_labels: question.sliderLabels ?? null,
      is_required: false,
      is_active: question.isActive,
      sort_order: question.sortOrder,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to create question" },
      { status: 500 }
    );
  }
}
