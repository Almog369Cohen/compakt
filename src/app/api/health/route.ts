import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "compakt",
    env: process.env.NODE_ENV ?? "unknown",
    sha: process.env.NEXT_PUBLIC_GIT_SHA ?? process.env.GITHUB_SHA ?? null,
    timestamp: new Date().toISOString(),
  });
}
