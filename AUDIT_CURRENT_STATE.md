# Compakt — Current State Audit

> Generated from full codebase audit. Evidence = exact file:line references.

---

## 1. COUPLE PORTAL

### 1.1 Phone OTP Authentication

| Feature | Status | Evidence | Notes |
|---------|--------|----------|-------|
| Phone input + normalization | **BUILT** | `src/components/auth/PhoneGate.tsx:43-75`, `src/app/api/auth/phone/send-otp/route.ts:10-20` | Israeli 0→+972 normalization |
| 6-digit OTP generation | **BUILT** | `src/app/api/auth/phone/send-otp/route.ts:6-8` | Random 6-digit code |
| OTP expiry (5 min) | **BUILT** | `src/app/api/auth/phone/send-otp/route.ts:57` | `otp_expires_at` set |
| OTP verification | **BUILT** | `src/app/api/auth/phone/verify-otp/route.ts:39-41` | Checks code + expiry |
| Session persistence (sessionStorage) | **BUILT** | `src/app/page.tsx:63-68` | `compakt_session_{token}` key |
| Resume flow (returning couple) | **BUILT** | `src/app/api/auth/phone/verify-otp/route.ts:67-95`, `src/app/page.tsx:104-110` | Loads answers/swipes/requests from DB |
| Twilio SMS integration | **PARTIAL** | `src/app/api/auth/phone/send-otp/route.ts:84-116` | Code exists but falls back to dev mode if no Twilio env vars |
| OTP attempt limiting | **MISSING** | Migration 016 defines `otp_attempts` column but send-otp route never increments it | Brute-force risk |
| OTP resend cooldown (UI) | **BUILT** | `src/components/auth/PhoneGate.tsx:308-320` | 60s countdown timer |
| Paste support | **BUILT** | `src/components/auth/PhoneGate.tsx:122-136` | Handles pasted 6-digit codes |

### 1.2 Questions Flow

| Feature | Status | Evidence | Notes |
|---------|--------|----------|-------|
| Question rendering (single/multi/slider/text) | **BUILT** | `src/components/stages/QuestionFlow.tsx:263-407` | All 4 types work |
| Progress dots | **BUILT** | `src/components/stages/QuestionFlow.tsx:115-123` | Visual dot indicator |
| Back/forward navigation | **BUILT** | `src/components/stages/QuestionFlow.tsx:55-78` | goNext/goBack + confirm on exit |
| Skip question | **BUILT** | `src/components/stages/QuestionFlow.tsx:75-78` | Skip button, tracked |
| Ethnic music special question | **BUILT** | `src/components/stages/QuestionFlow.tsx:27-49, 142-176` | Modal with text input |
| Answer persistence (Zustand + Supabase) | **BUILT** | `src/stores/eventStore.ts:173-208` | Upsert to `answers` table |
| Keyboard navigation | **MISSING** | — | No keyboard shortcuts for questions (unlike SongTinder) |
| Answer editing (go back to change) | **BUILT** | `src/components/stages/QuestionFlow.tsx:65-73` | Can go back, existing answer pre-fills |
| DJ-specific questions (per dj_id) | **BUILT** | `src/stores/adminStore.ts:316-318` | `loadContentFromDB` fetches by profileId |

### 1.3 Song Tinder (Swipe)

| Feature | Status | Evidence | Notes |
|---------|--------|----------|-------|
| Swipe gesture (drag) | **BUILT** | `src/components/stages/SongTinder.tsx:365-415` | Framer Motion drag with threshold |
| Like/Dislike/SuperLike/Unsure | **BUILT** | `src/components/stages/SongTinder.tsx:50-86` | All 4 actions |
| Reason chips for dislike | **BUILT** | `src/components/stages/SongTinder.tsx:133-145, 302-332` | Bottom sheet with chips |
| Card stack (3 cards) | **BUILT** | `src/components/stages/SongTinder.tsx:228-250` | Current + 2 behind |
| Keyboard shortcuts | **BUILT** | `src/components/stages/SongTinder.tsx:103-131` | Arrow keys + Space |
| Undo last swipe | **BUILT** | `src/components/stages/SongTinder.tsx:88-100` | Single-level undo |
| YouTube preview player | **BUILT** | `src/components/stages/SongTinder.tsx:509-533` | 30-sec iframe embed |
| Haptic feedback | **BUILT** | `src/components/stages/SongTinder.tsx:81-83` | `navigator.vibrate` |
| Super-like burst animation | **BUILT** | `src/components/stages/SongTinder.tsx:216-225` | Star emoji scale animation |
| Swipe tutorial | **BUILT** | `src/components/stages/SongTinder.tsx:182-184` | `SwipeTutorial` component |
| Min swipes before finish | **BUILT** | `src/components/stages/SongTinder.tsx:13, 205-212` | MIN_SWIPES=10 |
| Swipe persistence (Zustand + Supabase) | **BUILT** | `src/stores/eventStore.ts:215-252` | Upsert to `swipes` table |

### 1.4 Dreams & Requests (Stage 3)

| Feature | Status | Evidence | Notes |
|---------|--------|----------|-------|
| Special moments (ceremony/dance/etc.) | **BUILT** | `src/components/stages/DreamsRequests.tsx:20-26, 96-161` | 5 moment types |
| Free text requests | **BUILT** | `src/components/stages/DreamsRequests.tsx:163-198` | Add/remove |
| Do/Don't (must-have/red-lines) | **BUILT** | `src/components/stages/DreamsRequests.tsx:200-274` | Green/red chips |
| Link references | **BUILT** | `src/components/stages/DreamsRequests.tsx:276-320` | YouTube/Spotify URLs |
| Upsells (placement=stage_4) | **BUILT** | `src/components/stages/DreamsRequests.tsx:322-362` | Filtered by placement |
| Request persistence (Zustand + Supabase) | **BUILT** | `src/stores/eventStore.ts:277-313` | Insert to `requests` table |

### 1.5 Music Brief (Stage 4)

| Feature | Status | Evidence | Notes |
|---------|--------|----------|-------|
| PDF export | **BUILT** | `src/components/stages/MusicBrief.tsx:153-169` | html2pdf.js dynamic import |
| WhatsApp share | **BUILT** | `src/components/stages/MusicBrief.tsx:205-208` | Text summary via wa.me |
| Copy link / copy summary | **BUILT** | `src/components/stages/MusicBrief.tsx:146-215` | Clipboard API |
| Celebration animation | **BUILT** | `src/components/stages/MusicBrief.tsx:23-37, 221-232` | 15 emoji particles |
| Super-liked / liked / disliked sections | **BUILT** | `src/components/stages/MusicBrief.tsx:63-100, 330-435` | Categorized display |
| Question-answer summary | **BUILT** | `src/components/stages/MusicBrief.tsx:102-125, 307-328` | Maps answers to question text |
| Crowd notes section | **BUILT** | `src/components/stages/MusicBrief.tsx:437-461` | q2 + q6 specific |

### 1.6 Stage Navigation & App Shell

| Feature | Status | Evidence | Notes |
|---------|--------|----------|-------|
| Stage nav bar (4 steps) | **BUILT** | `src/components/ui/StageNav.tsx:1-58` | Clickable (past stages only) |
| Stage transitions (AnimatePresence) | **BUILT** | `src/app/page.tsx:244-257` | Slide up/down |
| Theme toggle (night/day) | **BUILT** | `src/app/page.tsx:169` | ThemeToggle component |
| Reset button + confirmation | **BUILT** | `src/app/page.tsx:126-132, 182-201` | Full state wipe |
| Magic link loading | **BUILT** | `src/app/page.tsx:58-76` | `?token=xxx` param |
| HydrationGuard | **BUILT** | `src/app/page.tsx:265` | Prevents SSR mismatch |
| ErrorBoundary | **BUILT** | `src/app/page.tsx:253` | Wraps each stage |

---

## 2. DJ / ADMIN PORTAL

### 2.1 Authentication

| Feature | Status | Evidence | Notes |
|---------|--------|----------|-------|
| Email/password login (Supabase Auth) | **BUILT** | `src/stores/adminStore.ts:67-80` | `signInWithPassword` |
| Email/password signup | **BUILT** | `src/stores/adminStore.ts:99-114` | `signUp` |
| Legacy password fallback | **BUILT** | `src/stores/adminStore.ts:58-65` | Hardcoded "compakt2024" |
| OAuth (Google/Facebook/Apple) | **BUILT** | `src/stores/adminStore.ts:82-97` | `signInWithOAuth` |
| Session check on load | **BUILT** | `src/stores/adminStore.ts:116-122` | `getSession` |
| Logout | **BUILT** | `src/stores/adminStore.ts:124-129` | Clears auth + state |
| Zustand persist (localStorage) | **BUILT** | `src/stores/adminStore.ts:432-484` | Persists songs/questions/upsells, resets auth on rehydrate |

### 2.2 Profile Management

| Feature | Status | Evidence | Notes |
|---------|--------|----------|-------|
| Business name, tagline, bio | **BUILT** | `src/components/admin/ProfileSettings.tsx`, `src/stores/profileStore.ts:6-8` | Text fields |
| Accent color picker | **BUILT** | `src/components/admin/ProfileSettings.tsx` | Color input |
| DJ slug (personal URL) | **BUILT** | `src/stores/profileStore.ts:11` | Unique slug |
| Social links (6 platforms) | **BUILT** | `src/stores/profileStore.ts:12-17` | IG/TikTok/SC/Spotify/YT/Website |
| WhatsApp number | **BUILT** | `src/stores/profileStore.ts:18` | Direct chat link |
| Custom links | **BUILT** | `src/stores/profileStore.ts:20` | JSONB array |
| Gallery photos | **BUILT** | `src/stores/profileStore.ts:21` | Via ImageUploader |
| Reviews | **BUILT** | `src/stores/profileStore.ts:22` | Name/text/rating |
| Cover + logo URLs | **BUILT** | `src/stores/profileStore.ts:18-19` | Image URLs |
| Live preview (split view) | **BUILT** | `src/components/admin/ProfileSettings.tsx` | DJProfilePreview side-by-side |
| Save to DB (service role) | **BUILT** | `src/stores/profileStore.ts:108-140`, `src/app/api/admin/profile/route.ts:58-115` | Upsert via API route |
| Load from DB | **BUILT** | `src/stores/profileStore.ts:65-106` | By user_id |

### 2.3 Songs Management

| Feature | Status | Evidence | Notes |
|---------|--------|----------|-------|
| CRUD operations | **BUILT** | `src/stores/adminStore.ts:131-194` | add/update/delete/reorder |
| DB sync (Supabase) | **BUILT** | `src/stores/adminStore.ts:138-175` | Per-DJ songs table |
| Default song seeding | **BUILT** | `src/app/api/admin/ensure-defaults/route.ts:34-57` | Auto-bootstrap if empty |
| Load from DB | **BUILT** | `src/stores/adminStore.ts:312-336` | `loadContentFromDB` |

### 2.4 Questions Management

| Feature | Status | Evidence | Notes |
|---------|--------|----------|-------|
| CRUD operations | **BUILT** | `src/stores/adminStore.ts:196-258` | add/update/delete/reorder |
| DB sync | **BUILT** | `src/stores/adminStore.ts:203-239` | Per-DJ questions table |
| Default question seeding | **BUILT** | `src/app/api/admin/ensure-defaults/route.ts:59-86` | Auto-bootstrap |
| Q1 options migration (rehydrate) | **BUILT** | `src/stores/adminStore.ts:443-476` | Maps old values to new on rehydrate |

### 2.5 Upsells Management

| Feature | Status | Evidence | Notes |
|---------|--------|----------|-------|
| CRUD operations | **BUILT** | `src/stores/adminStore.ts:260-307` | add/update/delete |
| DB sync | **BUILT** | `src/stores/adminStore.ts:267-306` | Per-DJ upsells table |
| Default upsell seeding | **BUILT** | `src/app/api/admin/ensure-defaults/route.ts:88-112` | Auto-bootstrap |

### 2.6 Events Management (DJ Events)

| Feature | Status | Evidence | Notes |
|---------|--------|----------|-------|
| Create/edit/delete events | **BUILT** | `src/stores/eventsStore.ts`, `src/app/api/admin/events/route.ts:70-114` | Full CRUD |
| Event status (upcoming/confirmed/completed/cancelled) | **BUILT** | `src/stores/eventsStore.ts:12` | Status field in DJEvent type |
| Screenshots (add/remove/reorder) | **BUILT** | `src/stores/eventsStore.ts:97-170`, `src/app/api/admin/events/route.ts:116-139` | event_screenshots table |
| Expandable event cards | **BUILT** | `src/components/admin/EventsManager.tsx` | EventCard sub-component |
| Upcoming/past categorization | **BUILT** | `src/components/admin/EventsManager.tsx` | Split by date_time |
| **DB table: dj_events** | **MIGRATION ONLY** | `supabase/migrations/014_events.sql:6-18` | Must be run manually |

### 2.7 Google Calendar Sync

| Feature | Status | Evidence | Notes |
|---------|--------|----------|-------|
| OAuth connect flow | **BUILT** | `src/app/api/gcal/connect/route.ts` | Redirects to Google |
| Token exchange + storage | **BUILT** | `src/app/api/gcal/callback/route.ts` | Saves to profiles.google_calendar_tokens |
| Pull (GCal → local) | **BUILT** | `src/app/api/gcal/sync/route.ts:105-149` | Upserts into `events` table |
| Push (local → GCal) | **BUILT** | `src/app/api/gcal/sync/route.ts:152-203` | Creates GCal events |
| Token refresh | **BUILT** | `src/app/api/gcal/sync/route.ts:13-35` | Auto-refresh expired tokens |
| **BUG: sync targets wrong table** | **BUG** | `src/app/api/gcal/sync/route.ts:134,157` | Syncs to `events` (couple table) not `dj_events` |
| **Migration: google_calendar_tokens** | **MIGRATION ONLY** | `supabase/migrations/015_gcal_tokens.sql` | Must be run manually |

### 2.8 Couple Links

| Feature | Status | Evidence | Notes |
|---------|--------|----------|-------|
| Create couple link (magic token) | **BUILT** | `src/app/api/admin/couple-link/route.ts:16-58` | Inserts into `events` table |
| List couple links with stats | **BUILT** | `src/app/api/admin/couple-link/route.ts:66-123` | answer/swipe counts |
| WhatsApp share | **BUILT** | `src/components/admin/CoupleLinks.tsx` | Share button |
| Copy link | **BUILT** | `src/components/admin/CoupleLinks.tsx` | Clipboard |

### 2.9 Image Upload

| Feature | Status | Evidence | Notes |
|---------|--------|----------|-------|
| Upload to Supabase Storage | **BUILT** | `src/lib/storage.ts:1-35`, `src/app/api/admin/upload/route.ts` | Service role bypass |
| Delete from storage | **BUILT** | `src/lib/storage.ts:37-50` | Path extraction from URL |
| Drag & drop UI | **BUILT** | `src/components/ui/ImageUploader.tsx` | Drop zone + file input |
| Size limit (5MB) | **BUILT** | `src/lib/storage.ts:11-13`, `src/app/api/admin/upload/route.ts:26-28` | Client + server validation |
| **Requires: dj-media bucket** | **SETUP NEEDED** | `src/lib/storage.ts:3` | Must create in Supabase Dashboard |

### 2.10 DJ Public Profile

| Feature | Status | Evidence | Notes |
|---------|--------|----------|-------|
| Public page at /dj/[slug] | **BUILT** | `src/app/dj/[slug]/page.tsx` | SSR-safe |
| DB-first, localStorage fallback | **BUILT** | `src/app/dj/[slug]/page.tsx:22-37` | Tries Supabase then store |
| DJProfilePreview (shared component) | **BUILT** | `src/components/dj/DJProfilePreview.tsx` | public/preview modes |
| Gallery with lightbox | **BUILT** | `src/components/dj/DJProfilePreview.tsx` | Lightbox component |
| Social links with icons | **BUILT** | `src/components/dj/DJProfilePreview.tsx` | Platform-colored circles |

---

## 3. HQ / TEAM (Analytics & Ops)

### 3.1 Analytics

| Feature | Status | Evidence | Notes |
|---------|--------|----------|-------|
| Event tracking (batch) | **BUILT** | `src/hooks/useAnalytics.ts:21-49` | 2s batch, max 20, flush on unload |
| Track API (POST) | **BUILT** | `src/app/api/analytics/track/route.ts:12-56` | Inserts to analytics_events |
| Analytics query API (GET) | **BUILT** | `src/app/api/analytics/track/route.ts:63-105` | By djId/eventId + date range |
| Funnel computation | **BUILT** | `src/app/api/analytics/track/route.ts:119-134` | 8-step funnel |
| Drop-off breakpoints | **BUILT** | `src/app/api/analytics/track/route.ts:136-161` | Per-stage enter vs complete |
| Avg stage duration | **BUILT** | `src/app/api/analytics/track/route.ts:163-176` | From metadata.duration_ms |
| Completion rate | **BUILT** | `src/app/api/analytics/track/route.ts:178-193` | Unique sessions / completed |
| **Analytics UI in admin** | **MISSING** | Admin page tab exists but no component | Tab label exists, no implementation |
| **Migration: analytics_events** | **MIGRATION ONLY** | `supabase/migrations/016_phone_auth_and_analytics.sql:25-49` | Must be run |

### 3.2 DB Health

| Feature | Status | Evidence | Notes |
|---------|--------|----------|-------|
| Health check API | **BUILT** | `src/app/api/admin/db-health/route.ts` | 12+ checks |
| Table existence checks | **BUILT** | `src/app/api/admin/db-health/route.ts:27-45` | Core + optional tables |
| DJ content checks | **BUILT** | `src/app/api/admin/db-health/route.ts:48-103` | Songs/questions/upsells/events |
| Orphan detection | **BUILT** | `src/app/api/admin/db-health/route.ts:108-134` | Answers/swipes without events |
| Auto-bootstrap defaults | **BUILT** | `src/app/api/admin/ensure-defaults/route.ts` | Seeds songs/questions/upsells |

### 3.3 Feature Gating / User Tracking / Inspiration

| Feature | Status | Evidence | Notes |
|---------|--------|----------|-------|
| Feature gating | **NOT BUILT** | — | No feature flag system |
| User tracking (HQ dashboard) | **NOT BUILT** | — | No admin-of-admins view |
| Inspiration management | **NOT BUILT** | — | No content curation for couples |
| Multi-DJ management | **NOT BUILT** | — | No HQ-level DJ list |

---

## 4. DATABASE SCHEMA

### 4.1 Tables (from migrations)

| Table | Migration | Status | Notes |
|-------|-----------|--------|-------|
| `profiles` | 013 | **CORE** | DJ profiles, extra live cols: full_name, role, plan, email |
| `events` | 013 | **CORE** | Couple questionnaire events. Live has extra `token` NOT NULL col |
| `answers` | 013 | **CORE** | Question answers per event |
| `swipes` | 013 | **CORE** | Song swipes per event |
| `requests` | 013 | **CORE** | Free text/do/dont/link/moment requests |
| `songs` | 013 | **CORE** | Per-DJ song library |
| `questions` | 013 | **CORE** | Per-DJ question set |
| `upsells` | 013 | **CORE** | Per-DJ upsell offers |
| `dj_events` | 014 | **NEEDS MIGRATION** | DJ event management (separate from couple events) |
| `event_screenshots` | 014 | **NEEDS MIGRATION** | DJ event screenshots |
| `event_sessions` | 016 | **NEEDS MIGRATION** | Phone auth sessions |
| `analytics_events` | 016 | **NEEDS MIGRATION** | Analytics tracking |

### 4.2 Known Schema Drift (Live DB vs Migrations)

| Issue | Detail |
|-------|--------|
| `events.token` | Live DB has NOT NULL `token` column from older migration; code sets both `token` and `magic_token` |
| `events` missing cols | Live DB missing: `city`, `status`, `theme`, `google_event_id`, `notes` |
| `event_sessions` missing cols | Live has subset; missing: `otp_attempts`, `last_active_at` |
| `profiles` extra cols | Live has: `full_name`, `role`, `plan`, `onboarding_complete`, `email` |

---

## 5. API ROUTES

| Route | Method | Purpose | Auth |
|-------|--------|---------|------|
| `/api/admin/profile` | GET/POST | Profile CRUD | Service role |
| `/api/admin/events` | GET/POST | DJ events CRUD + screenshots | Service role |
| `/api/admin/upload` | POST | Image upload to Storage | Service role |
| `/api/admin/couple-link` | GET/POST | Create/list couple links | Service role |
| `/api/admin/ensure-defaults` | POST | Seed default content | Service role |
| `/api/admin/db-health` | GET | DB health checks | Service role |
| `/api/auth/phone/send-otp` | POST | Phone OTP send | None (public) |
| `/api/auth/phone/verify-otp` | POST | Phone OTP verify | None (public) |
| `/api/analytics/track` | GET/POST | Analytics track/query | None (public insert) |
| `/api/gcal/connect` | GET | Google Calendar OAuth start | None |
| `/api/gcal/callback` | GET | Google Calendar token exchange | None |
| `/api/gcal/sync` | POST | Google Calendar two-way sync | Service role |
| `/api/spotify/*` | Various | Spotify integration | — |
| `/api/youtube/oembed` | GET | YouTube embed data | — |
| `/api/uploads/*` | Various | File uploads | — |
| `/api/health` | GET | Server health | None |

---

## 6. CRITICAL BUGS & GAPS

### P0 — Blocking

| # | Bug/Gap | Location | Impact |
|---|---------|----------|--------|
| 1 | **GCal sync targets `events` not `dj_events`** | `src/app/api/gcal/sync/route.ts:134,157` | Pull/push creates couple-events instead of DJ-events |
| 2 | **Migrations 014-016 not run on live DB** | `supabase/migrations/014*.sql`, `015*.sql`, `016*.sql` | dj_events, event_screenshots, event_sessions, analytics_events tables missing |
| 3 | **No OTP brute-force protection** | `src/app/api/auth/phone/send-otp/route.ts` | `otp_attempts` column exists in migration but never checked/incremented |
| 4 | **`events` table: `token` NOT NULL drift** | Live DB schema | Code handles both `token` and `magic_token`, but schema drift causes confusion |

### P1 — Important

| # | Bug/Gap | Location | Impact |
|---|---------|----------|--------|
| 5 | **No analytics UI** | Admin panel has tab but no component | DJs can't see their couple engagement data |
| 6 | **`loadEvent` returns sync but DB fetch is async** | `src/stores/eventStore.ts:120-152` | Returns `false` immediately, then sets state async — race condition on first load |
| 7 | **No SMS provider in production** | `src/app/api/auth/phone/send-otp/route.ts:84-117` | Falls back to dev mode (OTP in response) if no Twilio env vars |
| 8 | **Missing `dj-media` Storage bucket** | `src/lib/storage.ts:3` | Image uploads will fail until bucket is created |
| 9 | **Admin store persists mock data if DB fails** | `src/stores/adminStore.ts:54-56` | Defaults from `@/data/songs` etc. may show stale/test content |

### P2 — Nice-to-have

| # | Bug/Gap | Location | Impact |
|---|---------|----------|--------|
| 10 | **No feature flags / HQ dashboard** | — | No multi-DJ management, no feature gating |
| 11 | **Admin auth: no RBAC** | `src/stores/adminStore.ts` | Any authenticated user = full admin |
| 12 | **No rate limiting on public APIs** | All API routes | Analytics/OTP/couple-link endpoints are wide open |
| 13 | **Swipe/answer data not loaded from DB on resume** | `src/app/page.tsx:113-118` | `handleResume` sets stage but doesn't restore answers/swipes into Zustand |
| 14 | **No email notifications** | — | DJs not notified when couples complete questionnaires |
| 15 | **GCal unique index on wrong table** | `supabase/migrations/015_gcal_tokens.sql:5-7` | Index is on `events` table, but should be on `dj_events` |

---

## 7. ENVIRONMENT SETUP NEEDED

| Item | Status |
|------|--------|
| Run migration 014 (dj_events + screenshots) | PENDING |
| Run migration 015 (gcal tokens) | PENDING |
| Run migration 016 (event_sessions + analytics) | PENDING |
| Create `dj-media` Storage bucket (public) | PENDING |
| Enable Google/Facebook/Apple OAuth in Supabase | PENDING |
| Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALENDAR_REDIRECT_URI | PENDING |
| Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER (for prod SMS) | PENDING |
| Fix GCP_SERVICE_ACCOUNT_EMAIL GitHub secret | PENDING |
