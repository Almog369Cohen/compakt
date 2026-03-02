/**
 * DB Smoke Tests — Pseudo-code for Vitest / Playwright
 *
 * These tests verify end-to-end data flow:
 *   Couple → DB → Admin API → Admin UI
 *
 * To run: npx vitest run src/__tests__/db-smoke.test.ts
 * Prerequisites: .env.local with valid Supabase creds, dev server running
 */

import { describe, it, expect, beforeAll } from "vitest";

const BASE = process.env.TEST_BASE_URL || "http://localhost:3000";

// Helper: get first profile
async function getProfile() {
  const res = await fetch(`${BASE}/api/admin/profile?first=true`);
  const json = await res.json();
  return json.data;
}

describe("DB Health Check API", () => {
  let profileId: string;

  beforeAll(async () => {
    const profile = await getProfile();
    profileId = profile?.id;
  });

  it("returns health check results", async () => {
    const res = await fetch(`${BASE}/api/admin/db-health?profileId=${profileId}`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty("healthy");
    expect(data).toHaveProperty("summary");
    expect(data).toHaveProperty("checks");
    expect(Array.isArray(data.checks)).toBe(true);
  });

  it("core tables are accessible", async () => {
    const res = await fetch(`${BASE}/api/admin/db-health?profileId=${profileId}`);
    const data = await res.json();
    const tableChecks = data.checks.filter((c: { name: string }) => c.name.startsWith("table_exists_"));
    const coreTablesPass = tableChecks
      .filter((c: { name: string }) =>
        ["profiles", "events", "answers", "swipes", "requests", "songs", "questions"].some(
          (t) => c.name === `table_exists_${t}`
        )
      )
      .every((c: { status: string }) => c.status === "pass");
    expect(coreTablesPass).toBe(true);
  });
});

describe("Ensure Defaults (Bootstrap)", () => {
  let profileId: string;

  beforeAll(async () => {
    const profile = await getProfile();
    profileId = profile?.id;
  });

  it("seeds songs/questions if DB is empty for DJ", async () => {
    const res = await fetch(`${BASE}/api/admin/ensure-defaults`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileId }),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty("alreadyHad");
    expect(data).toHaveProperty("message");
    // Either seeded or already had content
    expect(
      data.seeded.length > 0 || data.alreadyHad.songs > 0
    ).toBe(true);
  });

  it("after bootstrap, DJ has songs in DB", async () => {
    const res = await fetch(`${BASE}/api/admin/db-health?profileId=${profileId}`);
    const data = await res.json();
    const songCheck = data.checks.find((c: { name: string }) => c.name === "dj_has_songs");
    expect(songCheck?.status).toBe("pass");
  });

  it("after bootstrap, DJ has questions in DB", async () => {
    const res = await fetch(`${BASE}/api/admin/db-health?profileId=${profileId}`);
    const data = await res.json();
    const qCheck = data.checks.find((c: { name: string }) => c.name === "dj_has_questions");
    expect(qCheck?.status).toBe("pass");
  });
});

describe("Couple Flow → Admin Sync", () => {
  let profileId: string;
  let magicToken: string;
  let eventId: string;

  beforeAll(async () => {
    const profile = await getProfile();
    profileId = profile?.id;
  });

  it("admin can create a couple link", async () => {
    const res = await fetch(`${BASE}/api/admin/couple-link`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        profileId,
        coupleNameA: "Test-A",
        coupleNameB: "Test-B",
        eventType: "wedding",
      }),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty("magicToken");
    expect(data).toHaveProperty("eventId");
    magicToken = data.magicToken;
    eventId = data.eventId;
  });

  it("admin API lists the new couple event", async () => {
    const res = await fetch(`${BASE}/api/admin/couple-link?profileId=${profileId}`);
    const data = await res.json();
    const found = data.events?.find((e: { id: string }) => e.id === eventId);
    expect(found).toBeDefined();
    expect(found.magic_token).toBe(magicToken);
  });

  it("couple event is visible in DB health check", async () => {
    const res = await fetch(`${BASE}/api/admin/db-health?profileId=${profileId}`);
    const data = await res.json();
    const eventCheck = data.checks.find((c: { name: string }) => c.name === "events_linked_to_dj");
    expect(eventCheck?.status).toBe("pass");
    expect((eventCheck?.count ?? 0) > 0).toBe(true);
  });
});

describe("Phone OTP Flow", () => {
  // This test uses dev mode (OTP returned in response)
  let eventId: string;
  let profileId: string;

  beforeAll(async () => {
    const profile = await getProfile();
    profileId = profile?.id;
    // Create a test event
    const res = await fetch(`${BASE}/api/admin/couple-link`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileId, coupleNameA: "OTP-A", coupleNameB: "OTP-B" }),
    });
    const data = await res.json();
    eventId = data.eventId;
  });

  it("send-otp returns success with dev OTP", async () => {
    const res = await fetch(`${BASE}/api/auth/phone/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: "0501234567", eventId }),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty("sessionId");
    // In dev mode, OTP is returned
    if (data.devOtp) {
      expect(data.devOtp).toMatch(/^\d{6}$/);
    }
  });

  it("verify-otp with correct code succeeds", async () => {
    // First get the OTP
    const sendRes = await fetch(`${BASE}/api/auth/phone/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: "0509999999", eventId }),
    });
    const sendData = await sendRes.json();
    const otp = sendData.devOtp;
    if (!otp) return; // Skip if no dev OTP

    const verifyRes = await fetch(`${BASE}/api/auth/phone/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone: "0509999999",
        otp,
        sessionId: sendData.sessionId,
      }),
    });
    expect(verifyRes.status).toBe(200);
    const verifyData = await verifyRes.json();
    expect(verifyData.verified).toBe(true);
  });
});

describe("Duplicate Phone Handling", () => {
  let profileId: string;
  let eventId: string;

  beforeAll(async () => {
    const profile = await getProfile();
    profileId = profile?.id;
    const res = await fetch(`${BASE}/api/admin/couple-link`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileId, coupleNameA: "Dup-A", coupleNameB: "Dup-B" }),
    });
    const data = await res.json();
    eventId = data.eventId;
  });

  it("same phone + same event = same session (upsert)", async () => {
    const phone = "0501111111";
    const res1 = await fetch(`${BASE}/api/auth/phone/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, eventId }),
    });
    const data1 = await res1.json();

    const res2 = await fetch(`${BASE}/api/auth/phone/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, eventId }),
    });
    const data2 = await res2.json();

    // Should return same session ID (upserted)
    expect(data1.sessionId).toBe(data2.sessionId);
  });
});

describe("Analytics Tracking", () => {
  it("accepts batch events", async () => {
    const res = await fetch(`${BASE}/api/analytics/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        events: [
          { eventName: "smoke_test_1", category: "test" },
          { eventName: "smoke_test_2", category: "test" },
        ],
      }),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
  });

  it("accepts single event", async () => {
    const res = await fetch(`${BASE}/api/analytics/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventName: "smoke_test_single", category: "test" }),
    });
    expect(res.status).toBe(200);
  });
});
