import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

interface GoogleTokens {
  access_token: string;
  refresh_token: string;
  expiry_date: number;
}

async function refreshAccessToken(tokens: GoogleTokens): Promise<GoogleTokens | null> {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) return null;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: tokens.refresh_token,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) return null;

  const data = await res.json();
  return {
    access_token: data.access_token,
    refresh_token: tokens.refresh_token,
    expiry_date: Date.now() + (data.expires_in * 1000),
  };
}

interface GCalEvent {
  id: string;
  summary?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  location?: string;
  status?: string;
}

/**
 * POST /api/gcal/sync
 * Body: { userId: string, direction: "pull" | "push" | "both" }
 *
 * Pull: Fetch events from Google Calendar → upsert into events table
 * Push: Sync local events (with google_event_id=null) → create in Google Calendar
 */
export async function POST(request: Request) {
  try {
    const { userId, direction = "pull" } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // Get profile with Google tokens
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, google_calendar_tokens")
      .eq("user_id", userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    if (!profile.google_calendar_tokens) {
      return NextResponse.json({ error: "Google Calendar not connected" }, { status: 400 });
    }

    let tokens: GoogleTokens;
    try {
      tokens = typeof profile.google_calendar_tokens === "string"
        ? JSON.parse(profile.google_calendar_tokens)
        : profile.google_calendar_tokens;
    } catch {
      return NextResponse.json({ error: "Invalid token data" }, { status: 500 });
    }

    // Refresh token if expired
    if (Date.now() > tokens.expiry_date - 60000) {
      const refreshed = await refreshAccessToken(tokens);
      if (!refreshed) {
        return NextResponse.json({ error: "Failed to refresh Google token" }, { status: 401 });
      }
      tokens = refreshed;

      // Save refreshed tokens
      await supabase
        .from("profiles")
        .update({ google_calendar_tokens: JSON.stringify(tokens) })
        .eq("id", profile.id);
    }

    const results: { pulled: number; pushed: number } = { pulled: 0, pushed: 0 };

    // ── PULL: Google Calendar → Local Events ──
    if (direction === "pull" || direction === "both") {
      const timeMin = new Date();
      timeMin.setMonth(timeMin.getMonth() - 3);
      const timeMax = new Date();
      timeMax.setMonth(timeMax.getMonth() + 6);

      const calUrl = new URL("https://www.googleapis.com/calendar/v3/calendars/primary/events");
      calUrl.searchParams.set("timeMin", timeMin.toISOString());
      calUrl.searchParams.set("timeMax", timeMax.toISOString());
      calUrl.searchParams.set("singleEvents", "true");
      calUrl.searchParams.set("orderBy", "startTime");
      calUrl.searchParams.set("maxResults", "100");

      const calRes = await fetch(calUrl.toString(), {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });

      if (calRes.ok) {
        const calData = await calRes.json();
        const gcalEvents: GCalEvent[] = calData.items || [];

        for (const ge of gcalEvents) {
          if (ge.status === "cancelled") continue;

          const dateTime = ge.start?.dateTime || ge.start?.date || null;

          // Upsert by google_event_id
          const { error: upsertError } = await supabase
            .from("events")
            .upsert(
              {
                dj_id: profile.id,
                google_event_id: ge.id,
                name: ge.summary || "אירוע מ-Google Calendar",
                date_time: dateTime,
                venue: ge.location || "",
                status: dateTime && new Date(dateTime) < new Date() ? "completed" : "upcoming",
                last_synced_at: new Date().toISOString(),
              },
              { onConflict: "dj_id,google_event_id", ignoreDuplicates: false }
            );

          if (!upsertError) results.pulled++;
        }
      }
    }

    // ── PUSH: Local Events → Google Calendar ──
    if (direction === "push" || direction === "both") {
      const { data: localEvents } = await supabase
        .from("events")
        .select("*")
        .eq("dj_id", profile.id)
        .is("google_event_id", null);

      for (const le of localEvents || []) {
        const body: Record<string, unknown> = {
          summary: le.name,
          location: le.venue || undefined,
          description: le.notes || undefined,
        };

        if (le.date_time) {
          body.start = { dateTime: le.date_time, timeZone: "Asia/Jerusalem" };
          // Default 2 hour event
          const end = new Date(le.date_time);
          end.setHours(end.getHours() + 2);
          body.end = { dateTime: end.toISOString(), timeZone: "Asia/Jerusalem" };
        } else {
          const today = new Date().toISOString().slice(0, 10);
          body.start = { date: today };
          body.end = { date: today };
        }

        const createRes = await fetch(
          "https://www.googleapis.com/calendar/v3/calendars/primary/events",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${tokens.access_token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
          }
        );

        if (createRes.ok) {
          const created = await createRes.json();
          await supabase
            .from("events")
            .update({
              google_event_id: created.id,
              last_synced_at: new Date().toISOString(),
            })
            .eq("id", le.id);
          results.pushed++;
        }
      }
    }

    return NextResponse.json({ success: true, ...results });
  } catch (e) {
    console.error("Google Calendar sync error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Sync failed" },
      { status: 500 }
    );
  }
}
