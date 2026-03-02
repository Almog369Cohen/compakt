import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_CALENDAR_REDIRECT_URI;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const userId = searchParams.get("state");

  if (!code || !userId) {
    return NextResponse.redirect(new URL("/admin?gcal=error&reason=missing_params", request.url));
  }

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !REDIRECT_URI) {
    return NextResponse.redirect(new URL("/admin?gcal=error&reason=not_configured", request.url));
  }

  try {
    // Exchange code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error("Google token exchange failed:", errText);
      return NextResponse.redirect(new URL("/admin?gcal=error&reason=token_exchange", request.url));
    }

    const tokens = await tokenRes.json();

    // Store tokens in profiles table
    const supabase = getServiceSupabase();
    const { error } = await supabase
      .from("profiles")
      .update({
        google_calendar_tokens: JSON.stringify({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expiry_date: Date.now() + (tokens.expires_in * 1000),
        }),
      })
      .eq("user_id", userId);

    if (error) {
      console.error("Failed to save Google tokens:", error);
      return NextResponse.redirect(new URL("/admin?gcal=error&reason=save_failed", request.url));
    }

    return NextResponse.redirect(new URL("/admin?gcal=success", request.url));
  } catch (e) {
    console.error("Google Calendar callback error:", e);
    return NextResponse.redirect(new URL("/admin?gcal=error&reason=unknown", request.url));
  }
}
