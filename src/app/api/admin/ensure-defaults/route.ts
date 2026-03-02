import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { defaultSongs } from "@/data/songs";
import { defaultQuestions } from "@/data/questions";
import { defaultUpsells } from "@/data/upsells";

export const runtime = "nodejs";

/**
 * POST /api/admin/ensure-defaults
 * Body: { profileId }
 *
 * Checks if a DJ has songs/questions/upsells in DB.
 * If any are empty, seeds them from the default templates.
 * Returns what was seeded.
 */
export async function POST(req: Request) {
  try {
    const { profileId } = await req.json();

    if (!profileId) {
      return NextResponse.json({ error: "Missing profileId" }, { status: 400 });
    }

    const supabase = getServiceSupabase();
    const seeded: string[] = [];

    // Check songs
    const { count: songCount } = await supabase
      .from("songs")
      .select("*", { count: "exact", head: true })
      .eq("dj_id", profileId);

    if ((songCount ?? 0) === 0 && defaultSongs.length > 0) {
      const songRows = defaultSongs.map((s, i) => ({
        dj_id: profileId,
        title: s.title,
        artist: s.artist,
        cover_url: s.coverUrl || "",
        preview_url: s.previewUrl || "",
        external_link: s.externalLink || "",
        category: s.category || "dancing",
        tags: s.tags || [],
        energy: s.energy ?? 3,
        language: s.language || "hebrew",
        is_safe: s.isSafe ?? true,
        is_active: s.isActive ?? true,
        sort_order: i,
      }));

      const { error } = await supabase.from("songs").insert(songRows);
      if (error) {
        console.error("Failed to seed songs:", error.message);
      } else {
        seeded.push(`songs (${songRows.length})`);
      }
    }

    // Check questions
    const { count: questionCount } = await supabase
      .from("questions")
      .select("*", { count: "exact", head: true })
      .eq("dj_id", profileId);

    if ((questionCount ?? 0) === 0 && defaultQuestions.length > 0) {
      const questionRows = defaultQuestions.map((q, i) => ({
        dj_id: profileId,
        question_he: q.questionHe,
        question_type: q.questionType || "single_select",
        event_type: q.eventType || "wedding",
        options: q.options || [],
        slider_min: q.sliderMin ?? null,
        slider_max: q.sliderMax ?? null,
        slider_labels: q.sliderLabels ?? null,
        is_required: false,
        is_active: q.isActive ?? true,
        sort_order: i,
      }));

      const { error } = await supabase.from("questions").insert(questionRows);
      if (error) {
        console.error("Failed to seed questions:", error.message);
      } else {
        seeded.push(`questions (${questionRows.length})`);
      }
    }

    // Check upsells
    const { count: upsellCount } = await supabase
      .from("upsells")
      .select("*", { count: "exact", head: true })
      .eq("dj_id", profileId);

    if ((upsellCount ?? 0) === 0 && defaultUpsells.length > 0) {
      const upsellRows = defaultUpsells.map((u, i) => ({
        dj_id: profileId,
        title_he: u.titleHe,
        description_he: u.descriptionHe || "",
        price_hint: u.priceHint || "",
        cta_text_he: u.ctaTextHe || "",
        placement: u.placement || "stage_4",
        is_active: u.isActive ?? true,
        sort_order: i,
      }));

      const { error } = await supabase.from("upsells").insert(upsellRows);
      if (error) {
        console.error("Failed to seed upsells:", error.message);
      } else {
        seeded.push(`upsells (${upsellRows.length})`);
      }
    }

    return NextResponse.json({
      seeded,
      alreadyHad: {
        songs: songCount ?? 0,
        questions: questionCount ?? 0,
        upsells: upsellCount ?? 0,
      },
      message: seeded.length > 0
        ? `Seeded defaults: ${seeded.join(", ")}`
        : "All content already exists in DB — no seeding needed",
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 500 }
    );
  }
}
