import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id")?.trim() || "";
    const slug = url.searchParams.get("slug")?.trim().toLowerCase() || "";
    const supabase = getServiceSupabase();

    if (id || slug) {
      let query = supabase.from("profiles").select("id, business_name, dj_slug, logo_url, cover_url, tagline, bio");

      if (id) {
        query = query.or(`id.eq.${id},user_id.eq.${id}`);
      } else {
        query = query.eq("dj_slug", slug);
      }

      const { data, error } = await query.maybeSingle();
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      if (!data?.id) {
        return NextResponse.json({ data: null }, { status: 404 });
      }

      return NextResponse.json({
        data: {
          id: typeof data.id === "string" ? data.id.trim() : "",
          business_name: typeof data.business_name === "string" ? data.business_name.trim() : "",
          dj_slug: typeof data.dj_slug === "string" ? data.dj_slug.trim().toLowerCase() : "",
          logo_url: typeof data.logo_url === "string" ? data.logo_url.trim() : "",
          cover_url: typeof data.cover_url === "string" ? data.cover_url.trim() : "",
          tagline: typeof data.tagline === "string" ? data.tagline.trim() : "",
          bio: typeof data.bio === "string" ? data.bio.trim() : "",
        },
      });
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("id, business_name, dj_slug, logo_url, cover_url, tagline, bio")
      .not("dj_slug", "is", null)
      .order("business_name", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const rows = Array.isArray(data)
      ? data
        .filter(
          (row) =>
            typeof row.id === "string" &&
            typeof row.dj_slug === "string" &&
            row.id.trim().length > 0 &&
            row.dj_slug.trim().length > 0
        )
        .map((row) => ({
          id: row.id.trim(),
          business_name: typeof row.business_name === "string" ? row.business_name.trim() : "",
          dj_slug: row.dj_slug.trim().toLowerCase(),
          logo_url: typeof row.logo_url === "string" ? row.logo_url.trim() : "",
          cover_url: typeof row.cover_url === "string" ? row.cover_url.trim() : "",
          tagline: typeof row.tagline === "string" ? row.tagline.trim() : "",
          bio: typeof row.bio === "string" ? row.bio.trim() : "",
        }))
      : [];

    return NextResponse.json({ data: rows });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load DJs" },
      { status: 500 }
    );
  }
}
