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

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const email = normalizeEmail(body.email || "");
        const eventIdOrToken = String(body.eventId || "").trim();

        if (!email || !isValidEmail(email)) {
            return NextResponse.json({ error: "כתובת מייל לא תקינה" }, { status: 400 });
        }
        if (!eventIdOrToken) {
            return NextResponse.json({ error: "Missing eventId" }, { status: 400 });
        }

        const supabase = getServiceSupabase();
        const lookup = supabase
            .from("events")
            .select("id, magic_token, token");

        const uuidLike = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(eventIdOrToken);
        const eventQuery = uuidLike
            ? lookup.or(`id.eq.${eventIdOrToken},magic_token.eq.${eventIdOrToken},token.eq.${eventIdOrToken}`)
            : lookup.or(`magic_token.eq.${eventIdOrToken},token.eq.${eventIdOrToken}`);

        const { data: event, error: eventErr } = await eventQuery.maybeSingle();

        if (eventErr || !event) {
            return NextResponse.json({ error: "אירוע לא נמצא" }, { status: 404 });
        }

        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

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
                return NextResponse.json(
                    { error: "אין ספק מייל מוגדר (חסר GMAIL_USER / GMAIL_APP_PASSWORD או OTP_DEV_MODE=true)" },
                    { status: 500 }
                );
            }

            try {
                await sendVerificationEmail(email, otp);
                return NextResponse.json({ sessionId: session.id, sent: true, eventKey: event.magic_token });
            } catch (emailError) {
                console.error("Email send failed:", emailError);
                return NextResponse.json({ error: "שגיאה בשליחת מייל האימות" }, { status: 500 });
            }
        }

        return NextResponse.json({
            sessionId: session.id,
            sent: true,
            eventKey: event.magic_token,
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
