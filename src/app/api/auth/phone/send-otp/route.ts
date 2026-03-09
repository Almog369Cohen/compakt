import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import nodemailer from "nodemailer";

export const runtime = "nodejs";

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function sendVerificationEmail(email: string, otp: string) {
  const gmailUser = process.env.GMAIL_USER;
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;

  if (!gmailUser || !gmailAppPassword) {
    throw new Error("Email provider not configured");
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: gmailUser,
      pass: gmailAppPassword,
    },
  });

  await transporter.sendMail({
    from: `Compakt <${gmailUser}>`,
    to: email,
    subject: "קוד האימות שלך ב-Compakt",
    html: `
      <div dir="rtl" style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
        <h2 style="margin:0 0 16px">קוד האימות שלכם ל-Compakt</h2>
        <p style="margin:0 0 16px">הזינו את הקוד הבא כדי להמשיך לשאלון:</p>
        <div style="font-size:32px;font-weight:700;letter-spacing:8px;margin:16px 0;color:#059cc0">${otp}</div>
        <p style="margin:16px 0 0">הקוד תקף ל-5 דקות.</p>
      </div>
    `,
  });
}

/**
 * POST /api/auth/phone/send-otp
 * Body: { email, eventId }
 * 
 * Creates or updates an event_session with a 6-digit OTP.
 * In production, sends email via Resend.
 * In dev, returns the OTP in the response for testing.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = normalizeEmail(body.email || body.phone || "");
    const eventIdOrToken = body.eventId;

    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: "כתובת מייל לא תקינה" }, { status: 400 });
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
          phone_number: email,
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

    const isDev = process.env.NODE_ENV === "development" || process.env.OTP_DEV_MODE === "true";

    if (!isDev) {
      if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
        console.error("No email provider configured for production OTP");
        return NextResponse.json(
          { error: "אין ספק מייל מוגדר (חסר GMAIL_USER / GMAIL_APP_PASSWORD או OTP_DEV_MODE=true)" },
          { status: 500 }
        );
      }

      try {
        await sendVerificationEmail(email, otp);
        return NextResponse.json({ sessionId: session.id, sent: true });
      } catch (emailError) {
        console.error("Email send failed:", emailError);
        return NextResponse.json({ error: "שגיאה בשליחת מייל האימות" }, { status: 500 });
      }
    }

    // Dev mode: return OTP in response
    return NextResponse.json({
      sessionId: session.id,
      sent: true,
      ...(isDev ? { devOtp: otp } : {}),
    });
  } catch (e) {
    console.error("send-otp error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 500 }
    );
  }
}
