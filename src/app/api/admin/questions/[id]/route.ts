import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { requireAuth, isAuthError } from "@/lib/requireAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAuth();
    if (isAuthError(auth)) return auth;
    if (!auth.profileId) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const questionId = params.id?.trim();
    if (!questionId) {
      return NextResponse.json({ error: "Missing question id" }, { status: 400 });
    }

    const body = (await req.json()) as { data?: Record<string, unknown> };
    const data = body.data || {};
    const row: Record<string, unknown> = {};

    if (data.questionHe !== undefined) row.question_he = data.questionHe;
    if (data.questionType !== undefined) row.question_type = data.questionType;
    if (data.eventType !== undefined) row.event_type = data.eventType;
    if (data.options !== undefined) row.options = JSON.stringify(data.options);
    if (data.sliderMin !== undefined) row.slider_min = data.sliderMin;
    if (data.sliderMax !== undefined) row.slider_max = data.sliderMax;
    if (data.sliderLabels !== undefined) row.slider_labels = JSON.stringify(data.sliderLabels);
    if (data.isActive !== undefined) row.is_active = data.isActive;
    if (data.sortOrder !== undefined) row.sort_order = data.sortOrder;

    if (Object.keys(row).length === 0) {
      return NextResponse.json({ ok: true });
    }

    const supabase = getServiceSupabase();
    const { data: existingQuestion, error: existingQuestionError } = await supabase
      .from("questions")
      .select("id")
      .eq("id", questionId)
      .eq("dj_id", auth.profileId)
      .maybeSingle();

    if (existingQuestionError) {
      return NextResponse.json({ error: existingQuestionError.message }, { status: 500 });
    }

    if (!existingQuestion?.id) {
      return NextResponse.json({ error: "Question not found for current profile" }, { status: 404 });
    }

    const { error } = await supabase
      .from("questions")
      .update(row)
      .eq("id", questionId)
      .eq("dj_id", auth.profileId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to update question" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAuth();
    if (isAuthError(auth)) return auth;
    if (!auth.profileId) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const questionId = params.id?.trim();
    if (!questionId) {
      return NextResponse.json({ error: "Missing question id" }, { status: 400 });
    }

    const supabase = getServiceSupabase();
    const { data: existingQuestion, error: existingQuestionError } = await supabase
      .from("questions")
      .select("id")
      .eq("id", questionId)
      .eq("dj_id", auth.profileId)
      .maybeSingle();

    if (existingQuestionError) {
      return NextResponse.json({ error: existingQuestionError.message }, { status: 500 });
    }

    if (!existingQuestion?.id) {
      return NextResponse.json({ error: "Question not found for current profile" }, { status: 404 });
    }

    const { error } = await supabase
      .from("questions")
      .delete()
      .eq("id", questionId)
      .eq("dj_id", auth.profileId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to delete question" },
      { status: 500 }
    );
  }
}
