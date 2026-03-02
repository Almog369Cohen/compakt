import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";

export const runtime = "nodejs";

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function normalizePhone(phone: string): string {
  let cleaned = phone.replace(/[\s\-()]/g, "");
  // Convert Israeli local to international
  if (cleaned.startsWith("0")) {
    cleaned = "+972" + cleaned.slice(1);
  }
  if (!cleaned.startsWith("+")) {
    cleaned = "+" + cleaned;
  }
  return cleaned;
}

/**
 * POST /api/auth/phone/send-otp
 * Body: { phone, eventId }
 * 
 * Creates or updates an event_session with a 6-digit OTP.
 * In production, sends SMS via Twilio/MessageBird.
 * In dev, returns the OTP in the response for testing.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const phone = normalizePhone(body.phone || "");
    const eventIdOrToken = body.eventId;

    if (!phone || phone.length < 10) {
      return NextResponse.json({ error: "מספר טלפון לא תקין" }, { status: 400 });
    }
    if (!eventIdOrToken) {
      return NextResponse.json({ error: "Missing eventId" }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // Check if event exists by id OR magic_token (couple links use magic_token)
    const { data: event, error: eventErr } = await supabase
      .from("events")
      .select("id")
      .or(`id.eq.${eventIdOrToken},magic_token.eq.${eventIdOrToken}`)
      .maybeSingle();

    if (eventErr || !event) {
      return NextResponse.json({ error: "אירוע לא נמצא" }, { status: 404 });
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 min

    // Upsert session
    const { data: session, error: sessErr } = await supabase
      .from("event_sessions")
      .upsert(
        {
          event_id: event.id,
          phone_number: phone,
          otp_code: otp,
          otp_expires_at: expiresAt,
          phone_verified: false,
        },
        { onConflict: "event_id,phone_number" }
      )
      .select("id")
      .single();

    if (sessErr) {
      console.error("Failed to create session:", sessErr);
      return NextResponse.json({ error: "שגיאה ביצירת סשן" }, { status: 500 });
    }

    // TODO: Send SMS via Twilio in production
    // For now, we'll use Supabase Phone Auth if configured, otherwise dev mode
    const isDev = process.env.NODE_ENV === "development" || process.env.OTP_DEV_MODE === "true";

    if (!isDev) {
      // Production: Use Twilio or Supabase Phone Auth
      const twilioSid = process.env.TWILIO_ACCOUNT_SID;
      const twilioToken = process.env.TWILIO_AUTH_TOKEN;
      const twilioFrom = process.env.TWILIO_PHONE_NUMBER;

      if (twilioSid && twilioToken && twilioFrom) {
        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
        const smsBody = `קוד האימות שלך ב-Compakt: ${otp}`;

        const smsRes = await fetch(twilioUrl, {
          method: "POST",
          headers: {
            Authorization: "Basic " + Buffer.from(`${twilioSid}:${twilioToken}`).toString("base64"),
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            To: phone,
            From: twilioFrom,
            Body: smsBody,
          }),
        });

        if (!smsRes.ok) {
          console.error("Twilio SMS failed:", await smsRes.text());
          return NextResponse.json({ error: "שגיאה בשליחת SMS" }, { status: 500 });
        }

        return NextResponse.json({ sessionId: session.id, sent: true });
      }

      // Fallback to dev mode if no SMS provider configured
      console.warn("No SMS provider configured, falling back to dev mode");
    }

    // Dev mode: return OTP in response
    return NextResponse.json({
      sessionId: session.id,
      sent: true,
      ...(isDev || !process.env.TWILIO_ACCOUNT_SID ? { devOtp: otp } : {}),
    });
  } catch (e) {
    console.error("send-otp error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 500 }
    );
  }
}
