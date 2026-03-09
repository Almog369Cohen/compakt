# Compakt — Gap Fix Plan

> Prioritized list of bugs and gaps with exact files, line numbers, and fix descriptions.

---

## P0 — BLOCKING (must fix before production)

### Fix 1: GCal sync targets wrong table

**Problem:** Google Calendar sync upserts into `events` (couple questionnaire table) instead of `dj_events` (DJ event management table).

**Files to change:**
- `src/app/api/gcal/sync/route.ts:132-145` — Change `.from("events")` to `.from("dj_events")` for pull
- `src/app/api/gcal/sync/route.ts:155-170` — Change `.from("events")` to `.from("dj_events")` for push query
- `src/app/api/gcal/sync/route.ts:178-200` — Ensure GCal event creation reads from `dj_events`

**Fix:** Replace all `events` table references in the sync route with `dj_events`. The `dj_events` table already has `google_event_id`, `last_synced_at`, `status`, `name`, `venue`, `date_time` columns (migration 014).

**Also fix:** `supabase/migrations/015_gcal_tokens.sql:5-7` — The unique index `idx_events_gcal_unique` is on `events(dj_id, google_event_id)` but should be on `dj_events(dj_id, google_event_id)`.

---

### Fix 2: Run pending migrations on live DB

**Problem:** Migrations 014, 015, 016 have not been run on the live Supabase DB.

**Action:** Run in order in Supabase Dashboard → SQL Editor:

1. `supabase/migrations/014_events.sql` — Creates `dj_events` + `event_screenshots` tables
2. `supabase/migrations/015_gcal_tokens.sql` — Adds `google_calendar_tokens` to profiles + unique index
   - **After Fix 1:** Update the index to target `dj_events` instead of `events`
3. `supabase/migrations/016_phone_auth_and_analytics.sql` — Creates `event_sessions` + `analytics_events` + adds `dj_id`/`phone_number` to events

**Pre-check:** Verify columns don't already partially exist using `scripts/inspect-schema.mjs`.

---

### Fix 3: OTP brute-force protection

**Problem:** The send-otp and verify-otp routes have no attempt limiting. An attacker can try all 1M 6-digit codes.

**Files to change:**
- `src/app/api/auth/phone/verify-otp/route.ts` — Add attempt counter check before verifying

**Fix:**
```
After getting session (line 24-29):
1. Check session.otp_attempts >= 5 → return 429 "Too many attempts"
2. On wrong OTP: increment otp_attempts via DB update
3. On correct OTP: reset attempts to 0 and mark verified
```

- `src/app/api/auth/phone/send-otp/route.ts:60-73` — Reset `otp_attempts: 0` when upserting new OTP

**Migration note:** `otp_attempts` column is defined in migration 016 but may not exist on live DB yet. Must run migration 016 first.

---

### Fix 4: `events.token` NOT NULL schema drift

**Problem:** Live DB has a `token` NOT NULL column from an older migration. The code in `couple-link/route.ts:33` already sets both `token` and `magic_token`, but `eventStore.ts:82-94` only generates `magicToken`.

**Files to change:**
- `src/stores/eventStore.ts:82-94` — Ensure `createEvent` also sets `token` when inserting
- OR: Run a migration to make `token` nullable / drop it and rely on `magic_token` only

**Recommended:** Add a migration to unify:
```sql
ALTER TABLE events ALTER COLUMN token DROP NOT NULL;
-- Backfill: UPDATE events SET token = magic_token WHERE token IS NULL;
```

---

## P1 — IMPORTANT (should fix before GA)

### Fix 5: Build analytics UI component

**Problem:** Admin panel has an "Analytics" tab but no corresponding component.

**Files to create:**
- `src/components/admin/AnalyticsDashboard.tsx` — New component

**Implementation:**
- Fetch `GET /api/analytics/track?djId={profileId}` on mount
- Display: funnel chart, completion rate, stage drop-off, avg duration
- Filter by date range
- Show per-event breakdown (couple link → completion)

**Files to change:**
- `src/app/admin/page.tsx` — Import and render `AnalyticsDashboard` in the analytics tab

---

### Fix 6: `loadEvent` async race condition

**Problem:** `eventStore.loadEvent` returns `false` synchronously, then the DB fetch resolves later. The caller in `page.tsx:63-68` checks the return value to decide whether to show PhoneGate, but the event might load after the check.

**Files to change:**
- `src/stores/eventStore.ts:120-152` — Refactor to be properly async (return Promise<boolean>)
- `src/app/page.tsx:63-68` — Await the result

**Current code at `eventStore.ts:120`:**
```ts
loadEvent: (token: string) => {
  // ... tries localStorage first (sync return)
  // ... then fires async DB fetch
  return false; // ← Returns before DB completes
}
```

**Fix:** Make loadEvent fully async, return the promise result.

---

### Fix 7: Production SMS provider

**Problem:** Without Twilio env vars, OTP is returned in the HTTP response (dev mode). Production users would see the code in network tab.

**Action (not a code change):**
- Set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` environment variables
- OR: integrate Supabase Phone Auth as an alternative

---

### Fix 8: Create `dj-media` Storage bucket

**Problem:** Image uploads fail without the bucket.

**Action:** In Supabase Dashboard → Storage → Create bucket:
- Name: `dj-media`
- Public: Yes
- File size limit: 5MB
- Allowed MIME types: `image/*`

---

### Fix 9: Admin store mock data fallback

**Problem:** If DB fetch fails or returns empty, `adminStore` keeps default mock songs/questions/upsells from `@/data/*` files. These show up as real content to couples.

**Files to change:**
- `src/stores/adminStore.ts:54-56` — Change defaults to empty arrays instead of mock data
- `src/stores/adminStore.ts:366-429` — The auto-bootstrap (ensure-defaults) already handles seeding, so mock defaults in the store are redundant

**Fix:**
```ts
// Change:
songs: defaultSongs,
questions: defaultQuestions,
upsells: defaultUpsells,
// To:
songs: [],
questions: [],
upsells: [],
```

Then rely on `loadContentFromDB` + `ensure-defaults` to populate on login.

---

### Fix 10: Resume flow doesn't restore Zustand state

**Problem:** When a returning couple verifies OTP, `page.tsx:handleResume` receives `resumeData` (answers, swipes, requests, currentStage) from the API, but only sets the stage — it doesn't load the data back into `eventStore`.

**Files to change:**
- `src/app/page.tsx:104-118` — After setting stage, also populate eventStore with resumeData
- `src/stores/eventStore.ts` — Add a `restoreFromResume(data)` action that bulk-sets answers, swipes, requests

**Impact:** Without this, returning couples see empty state despite having progress in DB.

---

## P2 — NICE-TO-HAVE (future iterations)

### Fix 11: Feature flags system

**Scope:** Create a simple feature flag mechanism for gradual rollout.

**Approach:** Add a `feature_flags` JSONB column to `profiles` or a new `feature_flags` table. Check flags in components/routes.

---

### Fix 12: Rate limiting on public APIs

**Scope:** Add rate limiting to prevent abuse of:
- `/api/auth/phone/send-otp` (SMS cost)
- `/api/analytics/track` (DB cost)
- `/api/admin/couple-link` (spam)

**Approach:** Use Vercel/Cloud Run built-in rate limiting, or implement token-bucket in-memory + Redis.

---

### Fix 13: RBAC for admin

**Scope:** Currently any Supabase Auth user = full admin. Need role checks.

**Approach:** Use `profiles.role` column (already exists in live DB) to gate actions. Check role in API routes.

---

### Fix 14: Email notifications

**Scope:** Notify DJs when couples complete questionnaires.

**Approach:** Add a webhook/trigger on `events.current_stage = 4` that sends email via Resend/SendGrid.

---

### Fix 15: GCal unique index on correct table

**Problem:** Migration 015 creates unique index on `events(dj_id, google_event_id)` but GCal sync should target `dj_events`.

**Fix:** Included in Fix 1. New migration:
```sql
DROP INDEX IF EXISTS idx_events_gcal_unique;
CREATE UNIQUE INDEX idx_dj_events_gcal_unique ON dj_events(dj_id, google_event_id) WHERE google_event_id IS NOT NULL;
```

---

## IMPLEMENTATION ORDER

| Phase | Fixes | Effort | Dependency |
|-------|-------|--------|------------|
| **Phase 0: Infra** | Fix 2 (migrations), Fix 8 (bucket) | 30 min | Manual in Supabase Dashboard |
| **Phase 1: Critical bugs** | Fix 1 (GCal table), Fix 3 (OTP brute-force), Fix 4 (token drift) | 2-3 hours | Phase 0 |
| **Phase 2: Flow integrity** | Fix 6 (loadEvent async), Fix 9 (mock data), Fix 10 (resume restore) | 2-3 hours | Phase 1 |
| **Phase 3: Feature completion** | Fix 5 (analytics UI), Fix 7 (SMS setup) | 4-6 hours | Phase 2 |
| **Phase 4: Hardening** | Fix 11-15 (flags, rate limit, RBAC, email, index) | 2-3 days | Phase 3 |
