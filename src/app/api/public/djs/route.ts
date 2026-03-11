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
      let query = supabase.from("profiles").select("id, business_name, dj_slug");

      if (id) {
        query = query.eq("id", id);
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
          id: data.id,
          business_name: typeof data.business_name === "string" ? data.business_name : "",
          dj_slug: typeof data.dj_slug === "string" ? data.dj_slug : "",
        },
      });
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("id, business_name, dj_slug")
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
              row.dj_slug.trim().length > 0
          )
          .map((row) => ({
            id: row.id,
            business_name: typeof row.business_name === "string" ? row.business_name : "",
            dj_slug: row.dj_slug,
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
