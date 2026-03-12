import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";

export const runtime = "nodejs";

export async function POST(req: Request) {
    try {
        const { sessionId, otp, email } = await req.json();
        const normalizedIdentity = typeof email === "string"
            ? email.trim().toLowerCase()
            : null;

        if (!sessionId || !otp) {
            return NextResponse.json({ error: "חסר קוד או מזהה סשן" }, { status: 400 });
        }

        const supabase = getServiceSupabase();

        const { data: session, error: sessErr } = await supabase
            .from("event_sessions")
            .select("*")
            .eq("id", sessionId)
            .single();

        if (sessErr || !session) {
            return NextResponse.json({ error: "סשן לא נמצא" }, { status: 404 });
        }

        if (new Date(session.otp_expires_at) < new Date()) {
            return NextResponse.json({ error: "הקוד פג תוקף. בקשו קוד חדש" }, { status: 410 });
        }

        if (session.otp_code !== otp.trim()) {
            return NextResponse.json({ error: "קוד שגוי" }, { status: 401 });
        }

        if (normalizedIdentity && String(session.phone_number || "").trim().toLowerCase() !== normalizedIdentity) {
            return NextResponse.json({ error: "פרטי האימות לא תואמים לסשן" }, { status: 401 });
        }

        await supabase
            .from("event_sessions")
            .update({
                phone_verified: true,
                otp_code: null,
            })
            .eq("id", sessionId);

        const { data: event } = await supabase
            .from("events")
            .select("*")
            .eq("id", session.event_id)
            .single();

        const { data: answers } = await supabase
            .from("answers")
            .select("*")
            .eq("event_id", session.event_id);

        const { data: swipes } = await supabase
            .from("swipes")
            .select("*")
            .eq("event_id", session.event_id);

        const { data: requests } = await supabase
            .from("requests")
            .select("*")
            .eq("event_id", session.event_id);

        const hasProgress =
            (answers?.length || 0) > 0 ||
            (swipes?.length || 0) > 0 ||
            (requests?.length || 0) > 0 ||
            (event?.current_stage || 0) > 0;

        return NextResponse.json({
            verified: true,
            sessionId,
            eventKey: event?.magic_token || null,
            event,
            resumeData: hasProgress
                ? {
                    answers: answers || [],
                    swipes: swipes || [],
                    requests: requests || [],
                    currentStage: event?.current_stage || 0,
                }
                : null,
        });
    } catch (e) {
        console.error("verify-otp error:", e);
        return NextResponse.json(
            { error: e instanceof Error ? e.message : "Failed" },
            { status: 500 }
        );
    }
}
