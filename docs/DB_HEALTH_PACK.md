# DB Health & Sync Verification Pack
## Compakt — "שים סוף לשגיאות"

---

## Q1) Source of Truth

### Couple-owned tables (Source of Truth = Supabase DB)
| Table | Owner | Admin can | HQ can |
|-------|-------|-----------|--------|
| `events` | System (created by admin link OR couple) | Read, add notes/status | Read only |
| `answers` | Couple | **Read only** | Read only |
| `swipes` | Couple | **Read only** | Read only |
| `requests` | Couple | **Read only** | Read only |
| `event_sessions` | System (OTP flow) | Read only | Read only |

### DJ-owned tables (Source of Truth = Supabase DB)
| Table | Owner | HQ can |
|-------|-------|--------|
| `profiles` | DJ Admin | Read, support override |
| `songs` | DJ Admin | Read only |
| `questions` | DJ Admin | Read only |
| `upsells` | DJ Admin | Read only |
| `dj_events` | DJ Admin | Read only |

### System tables (append-only)
| Table | Policy |
|-------|--------|
| `analytics_events` | **Append-only. Never update/delete.** |

**Decision**: Admin should NEVER directly edit `answers`, `swipes`, `requests`. Only add notes/status to `events`.

---

## Q2) Sync Mechanism

### Current state (found in codebase)
- **No Realtime subscriptions** — all sync is request/response.
- **Client caching**: `zustand/persist` stores `compakt-admin`, `compakt-event`, `compakt-profile` in localStorage. This is the #1 source of "looks like it works but DB is empty".
- **fire-and-forget writes**: `eventStore` does `.then(() => {})` on inserts — errors are silently swallowed.

### Recommended MVP strategy: **Pull + Write-through**
1. **On page load**: Always pull fresh from DB (don't trust localStorage for truth).
2. **On write**: Write to DB first, then update local state on success.
3. **localStorage**: Use only as offline fallback / loading speed boost, never as source of truth.
4. **No Realtime needed for MVP** — admin refreshes manually or polls.

---

## Q3) RLS Correctness

### Policies that could break sync
| Table | Policy | Risk |
|-------|--------|------|
| `songs` | `dj_id = get_my_profile_id()` | **Blocks legacy admin** (no auth.uid). Mitigated by service role API routes. |
| `questions` | Same as songs | Same risk. |
| `upsells` | Same as songs | Same risk. |
| `profiles` | `auth.uid() = user_id` for write | **Blocks legacy admin writes**. Mitigated by service role API. |
| `events` | `FOR SELECT USING (true)` | Wide open — any couple can read any event if they guess the UUID. **OK for MVP** (token-scoped in practice). |
| `answers/swipes/requests` | `FOR INSERT WITH CHECK (true)` | Wide open inserts. **OK for MVP** (event_id required as FK). |

### Key insight
All admin operations go through `/api/admin/*` routes using **service role key** (bypasses RLS). So RLS only matters for:
- Direct Supabase client calls (couple flow uses `supabase` client directly in eventStore)
- Public reads (DJ profile page)

**No RLS currently blocks the admin from reading couple data** — SELECT is `USING (true)` on all couple tables.

---

## Q4) Data Lifecycle

### Event statuses (proposed — not yet in DB)
```
created → phone_verified → in_progress → completed → archived
```

Currently `events.current_stage` (0-4) is the only progress indicator. No explicit status field.

**Recommendation**: Add `status` enum column to `events` in next migration. For now, derive:
- `current_stage = 0` + no phone → "created"
- `current_stage = 0` + phone → "phone_verified"  
- `current_stage 1-3` → "in_progress"
- `current_stage = 4` → "completed"

### Archiving/Retention
- **Never auto-delete**. Keep all data.
- Future: `archived_at` timestamp for hiding from active views.

---

## Q5) Duplication Rules

### phone + event uniqueness
`event_sessions` has `UNIQUE(event_id, phone_number)`. Same phone + same event = same session (upsert).

### Same phone, different events
Creates a **new** event session. This is correct — one couple can have multiple events with same DJ.

### Same phone, same DJ, no event yet
Currently no constraint. Could create multiple events. **Recommendation**: On couple-link creation, check if an active (non-completed) event already exists for this `dj_id` + warn admin.

---

## Q6) Bootstrap / Defaults

### Critical bug found
`adminStore` initializes with `defaultSongs` (15 songs), `defaultQuestions` (5 questions), `defaultUpsells` from `/src/data/*.ts`. `loadContentFromDB` only overwrites if `data.length > 0`. 

**This means**: If DB tables are empty, the UI shows mock data. The admin thinks they have songs/questions but the DB has nothing. Couples see nothing.

### Fix (implement now)
1. **`/api/admin/ensure-defaults`** — server route that checks if DJ has 0 songs/questions and seeds from defaults.
2. **Call on admin login** — after `loadContentFromDB`, if result is empty, call ensure-defaults, then reload.
3. **Never fall back to mock silently** — show empty state + "Load defaults" button.

### Where to implement
- **Server route** (not DB trigger, not migration seed) — keeps logic in app code, easy to update.
- Default data lives in `/src/data/*.ts` (already exists).

---

## Q7) HQ/Team System

### Current state
No separate HQ system exists. Just the admin panel.

### Recommended approach for MVP
- **HQ = additional screens inside the same admin app** (new tab or separate route `/admin/hq`).
- HQ has elevated permissions: can view all DJs, all events, run health checks, restore data.
- HQ is read-only on couple data, read+write on system config.
- **Authentication**: Separate HQ password or role-based (add `role` column to profiles: 'dj' | 'hq').

---

## A) Invariants / Assertions (20 rules)

### Data Integrity
1. Every `events` row MUST have a non-empty `magic_token` (UNIQUE constraint enforced by DB).
2. Every `events` row created via admin couple-link MUST have `dj_id` NOT NULL.
3. Every `answers.event_id` MUST reference an existing `events.id` (FK enforced).
4. Every `swipes.event_id` MUST reference an existing `events.id` (FK enforced).
5. Every `requests.event_id` MUST reference an existing `events.id` (FK enforced).
6. Every `songs.dj_id` MUST reference an existing `profiles.id` (FK enforced).
7. Every `questions.dj_id` MUST reference an existing `profiles.id` (FK enforced).
8. `swipes.action` MUST be one of: 'like', 'dislike', 'super_like', 'unsure' (CHECK enforced).
9. `requests.request_type` MUST be one of: 'free_text', 'do', 'dont', 'link', 'special_moment' (CHECK enforced).

### Business Logic
10. A DJ with `profiles.onboarding_complete = true` MUST have at least 1 song in `songs`.
11. A DJ with `profiles.onboarding_complete = true` MUST have at least 1 question in `questions`.
12. If `songs` table has 0 rows for a DJ → UI MUST show empty state, NOT mock data.
13. If `questions` table has 0 rows for a DJ → UI MUST show empty state, NOT mock data.
14. Admin NEVER updates `answers`/`swipes`/`requests` directly. Only reads.
15. `analytics_events` is APPEND-ONLY. No UPDATE or DELETE policies.
16. `event_sessions` with `phone_verified = true` MUST have `otp_code = NULL` (cleared on verify).

### Scoping / Security
17. Couple can only access events matching their `magic_token` (token-scoped).
18. Couple cannot see other couples' answers/swipes/requests (event_id scoped in practice).
19. Admin can only see events where `events.dj_id = profiles.id` (their own).
20. All admin write operations go through service role API routes (not direct Supabase client).

### Sync Correctness
21. `events.current_stage` in DB MUST match the actual stage the couple is on.
22. Count of `answers` in DB for an event MUST match what admin sees in CoupleLinks.
23. If `event_sessions.phone_verified = true`, then `events.phone_number` MUST be set.

---

## B) SQL Health Check Pack

See file: `supabase/migrations/health_check.sql`

---

## C) E2E Smoke Tests

See file: `src/__tests__/db-smoke.test.ts`

---

## D) Monitoring / Alerts

### Analytics events to add
| Event Name | Category | Trigger | Severity |
|------------|----------|---------|----------|
| `db_empty_songs` | system | DJ opens admin, songs table empty | 🔴 Critical |
| `db_empty_questions` | system | DJ opens admin, questions table empty | 🔴 Critical |
| `db_write_failed` | system | Any Supabase insert/update fails | 🔴 Critical |
| `mock_data_detected` | system | localStorage has data but DB is empty | 🟡 Warning |
| `orphan_answer` | system | Health check finds answer with no event | 🟡 Warning |
| `orphan_event` | system | Event with no dj_id | 🟡 Warning |
| `duplicate_session` | system | Same phone+dj creates 2nd active event | 🟡 Warning |
| `rls_denied` | system | API route catches RLS error | 🔴 Critical |
| `bootstrap_triggered` | system | ensure-defaults was needed | 🟡 Warning |
| `admin_content_saved` | admin | Songs/questions/upsells saved to DB | ℹ️ Info |

### Where to display
- In the **Analytics Dashboard** (already built) — add a "System Health" section.
- Console warnings for development.

---

## E) Guardrails UI/UX

1. **Empty states** — never fall back to mock. Show: "אין שירים עדיין. לחצו להוספה או טעינת ברירות מחדל."
2. **"Load default template" button** — seeds songs/questions from defaults into DB.
3. **Hide dangerous actions** — No "edit answers" or "delete answers" in admin UI.
4. **Confirmation dialogs** — On delete song/question/event.
5. **Visual DB status indicator** — Green dot = DB synced, Red dot = using local only.

---

## F) Action Plan

### Phase 1: "DB Correctness Baseline" (48 hours)
1. ✅ Create `/api/admin/db-health` — automated health check endpoint
2. ✅ Create `/api/admin/ensure-defaults` — bootstrap DJ content
3. ✅ Fix `adminStore.loadContentFromDB` — detect empty DB, trigger bootstrap, show empty state instead of mock
4. ✅ Add `db_write_failed` tracking to eventStore write operations
5. ✅ Run SQL health check queries manually
6. ✅ Add "System Health" card to admin Dashboard

### Phase 2: "Guardrails" (next week)
7. Remove mock data fallback from adminStore initialization
8. Add confirmation dialogs for destructive actions
9. Add DB sync status indicator
10. Lock admin from editing couple data (answers/swipes/requests)

### Phase 3: "HQ + Audit" (future)
11. Add `status` column to events
12. Add event snapshots (JSON blob on stage complete)
13. HQ dashboard route with cross-DJ views
14. Restore capability from snapshots
