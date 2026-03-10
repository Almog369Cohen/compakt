import { NextResponse } from "next/server";
import { requireAuth, isAuthError } from "@/lib/requireAuth";
import { getServiceSupabase } from "@/lib/supabase";
import { hasFeature, loadResolvedAccessByUserId } from "@/lib/access";

export const dynamic = "force-dynamic";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const REDIRECT_URI = process.env.GOOGLE_CALENDAR_REDIRECT_URI;

const SCOPES = [
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/calendar.events",
].join(" ");

export async function GET() {
  const auth = await requireAuth();
  if (isAuthError(auth)) return auth;

  const supabase = getServiceSupabase();
  const { access } = await loadResolvedAccessByUserId(supabase, auth.userId);
  if (!access || !hasFeature(access, "google_calendar_sync")) {
    return NextResponse.json({ error: "Feature not enabled for this account" }, { status: 403 });
  }

  if (!GOOGLE_CLIENT_ID || !REDIRECT_URI) {
    return NextResponse.json(
      { error: "Google Calendar not configured" },
      { status: 500 }
    );
  }

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", GOOGLE_CLIENT_ID);
  authUrl.searchParams.set("redirect_uri", REDIRECT_URI);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", SCOPES);
  authUrl.searchParams.set("access_type", "offline");
  authUrl.searchParams.set("prompt", "consent");
  authUrl.searchParams.set("state", auth.userId);

  return NextResponse.redirect(authUrl.toString());
}
