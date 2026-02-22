import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const url = (searchParams.get("url") || "").trim();
  if (!url) return new NextResponse("Missing url", { status: 400 });

  try {
    const oembedUrl = new URL("https://www.youtube.com/oembed");
    oembedUrl.searchParams.set("url", url);
    oembedUrl.searchParams.set("format", "json");

    const res = await fetch(oembedUrl.toString(), { cache: "no-store" });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      return new NextResponse(`YouTube oEmbed failed (${res.status}): ${txt}`, { status: 500 });
    }

    const json = (await res.json()) as {
      title: string;
      author_name?: string;
      thumbnail_url?: string;
    };

    return NextResponse.json({
      title: json.title,
      authorName: json.author_name,
      thumbnailUrl: json.thumbnail_url,
    });
  } catch (e) {
    return new NextResponse(e instanceof Error ? e.message : "YouTube oEmbed failed", {
      status: 500,
    });
  }
}
