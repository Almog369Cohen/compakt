# Compakt — Data Flow Map

> Per-system breakdown: tables, API routes, RLS policies, stores, and client components.

---

## SYSTEM 1: COUPLE PORTAL

### Flow: Couple opens magic link → Phone auth → Questions → Swipes → Requests → Music Brief

```
Browser (page.tsx)
  │
  ├─ ?token=xxx → check sessionStorage for existing session
  │   ├─ Found → loadEvent(token) → Zustand eventStore
  │   └─ Not found → show PhoneGate
  │
  ├─ PhoneGate
  │   ├─ POST /api/auth/phone/send-otp  { phone, eventId }
  │   │   └─ DB: events (lookup by id OR magic_token)
  │   │   └─ DB: event_sessions (upsert: event_id + phone_number)
  │   │   └─ Twilio SMS (prod) or devOtp in response (dev)
  │   │
  │   ├─ POST /api/auth/phone/verify-otp  { sessionId, otp }
  │   │   └─ DB: event_sessions (verify otp_code, mark phone_verified)
  │   │   └─ DB: events (set phone_number)
  │   │   └─ DB: answers, swipes, requests (load for resume)
  │   │   └─ Returns: { sessionId, event, resumeData }
  │   │
  │   └─ onVerified → sessionStorage set → loadEvent(token)
  │
  ├─ Stage 0: EventSetup
  │   └─ eventStore.createEvent()
  │       └─ Zustand: set event state
  │       └─ DB: events.insert (magic_token, token, event_type, names, date, venue)
  │
  ├─ Stage 1: QuestionFlow
  │   └─ eventStore.saveAnswer(questionId, value)
  │       └─ Zustand: answers[]
  │       └─ DB: answers.upsert (id, event_id, question_id, answer_value)
  │
  ├─ Stage 2: SongTinder
  │   └─ eventStore.saveSwipe(songId, action, reasonChips)
  │       └─ Zustand: swipes[]
  │       └─ DB: swipes.upsert (id, event_id, song_id, action, reason_chips)
  │
  ├─ Stage 3: DreamsRequests
  │   └─ eventStore.addRequest({ requestType, content, momentType? })
  │       └─ Zustand: requests[]
  │       └─ DB: requests.insert (id, event_id, request_type, content, moment_type)
  │
  ├─ Stage 4: MusicBrief
  │   └─ Read-only summary (no DB writes)
  │   └─ PDF export (client-side html2pdf.js)
  │   └─ WhatsApp share (wa.me deeplink)
  │
  └─ Stage changes: eventStore.setStage(n)
      └─ DB: events.update({ current_stage: n })
```

### Tables touched by Couple Portal

| Table | Operations | RLS | Notes |
|-------|-----------|-----|-------|
| `events` | INSERT, SELECT, UPDATE | Anon: insert/select/update (open) | Magic token lookup, stage tracking |
| `answers` | INSERT (upsert), SELECT | Anon: insert/select (open) | Question answers |
| `swipes` | INSERT (upsert), SELECT, DELETE | Anon: insert/select (open) | Song swipe actions + undo |
| `requests` | INSERT, SELECT, DELETE | Anon: insert/select (open) | Free text/do/dont/link/moment |
| `event_sessions` | INSERT (upsert), SELECT, UPDATE | Anon: insert/select/update (open) | Phone OTP sessions |
| `analytics_events` | INSERT | Anon: insert (open) | Tracking events (batched) |

### Zustand Store: `eventStore` (persisted as `compakt-event`)

```
State: event, answers[], swipes[], requests[], upsellClicks[], analytics[], theme
Actions: createEvent, loadEvent, updateEvent, setStage, saveAnswer, saveSwipe,
         addRequest, removeRequest, trackUpsellClick, trackEvent, setTheme, reset
```

---

## SYSTEM 2: DJ / ADMIN PORTAL

### Flow: DJ logs in → Manages profile/songs/questions/events/couple-links

```
Browser (admin/page.tsx)
  │
  ├─ Auth
  │   ├─ adminStore.loginWithEmail(email, pwd) → Supabase Auth
  │   ├─ adminStore.login(pwd) → Legacy password check
  │   ├─ adminStore.loginWithOAuth(provider) → Supabase OAuth
  │   └─ adminStore.checkSession() → Supabase getSession
  │
  ├─ On auth success:
  │   ├─ profileStore.loadProfileFromDB(userId)
  │   │   └─ DB: profiles.select where user_id = userId
  │   │
  │   ├─ adminStore.loadContentFromDB(profileId)
  │   │   └─ DB: songs.select, questions.select, upsells.select (all by dj_id)
  │   │   └─ If empty → POST /api/admin/ensure-defaults { profileId }
  │   │       └─ Seeds default songs/questions/upsells
  │   │
  │   └─ eventsStore.loadEvents(profileId)
  │       └─ GET /api/admin/events?profileId=xxx
  │           └─ DB: dj_events.select + event_screenshots.select
  │
  ├─ Profile Tab
  │   └─ profileStore.setProfile(patch) → local state
  │   └─ profileStore.saveProfileToDB(userId)
  │       └─ POST /api/admin/profile { userId, profileId, row }
  │           └─ DB: profiles.update or profiles.insert (service role)
  │
  ├─ Songs Tab
  │   └─ adminStore.addSong/updateSong/deleteSong
  │       └─ Zustand + DB: songs table (via browser Supabase client)
  │
  ├─ Questions Tab
  │   └─ adminStore.addQuestion/updateQuestion/deleteQuestion
  │       └─ Zustand + DB: questions table
  │
  ├─ Upsells Tab
  │   └─ adminStore.addUpsell/updateUpsell/deleteUpsell
  │       └─ Zustand + DB: upsells table
  │
  ├─ Events Tab
  │   ├─ eventsStore.createEvent(profileId, data)
  │   │   └─ POST /api/admin/events { action: "create", profileId, data }
  │   │       └─ DB: dj_events.insert
  │   │
  │   ├─ eventsStore.updateEvent(eventId, patch)
  │   │   └─ POST /api/admin/events { action: "update", eventId, data }
  │   │       └─ DB: dj_events.update
  │   │
  │   ├─ eventsStore.addScreenshot(eventId, imageUrl)
  │   │   └─ POST /api/admin/events { action: "add_screenshot", eventId, data }
  │   │       └─ DB: event_screenshots.insert
  │   │
  │   ├─ Image upload flow:
  │   │   └─ ImageUploader → uploadImage(file, userId, "screenshots")
  │   │       └─ POST /api/admin/upload (FormData: file, userId, folder)
  │   │           └─ Supabase Storage: dj-media bucket (service role)
  │   │           └─ Returns public URL
  │   │
  │   └─ Google Calendar Sync
  │       ├─ GET /api/gcal/connect?userId=xxx → Google OAuth redirect
  │       ├─ GET /api/gcal/callback?code=xxx&state=userId → Token exchange
  │       │   └─ DB: profiles.update({ google_calendar_tokens })
  │       └─ POST /api/gcal/sync { userId, direction }
  │           └─ DB: profiles.select (get tokens)
  │           └─ Google Calendar API (pull/push)
  │           └─ DB: events.upsert (⚠️ BUG: should be dj_events)
  │
  └─ Couple Links Tab
      ├─ POST /api/admin/couple-link { profileId, eventType, names, date, venue }
      │   └─ DB: events.insert (with dj_id, magic_token, token)
      └─ GET /api/admin/couple-link?profileId=xxx
          └─ DB: events.select where dj_id + answers.count + swipes.count
```

### Tables touched by DJ Admin

| Table | Operations | Access Method | Notes |
|-------|-----------|---------------|-------|
| `profiles` | SELECT, UPDATE, INSERT | Service role (API route) + Anon (browser client for read) | Profile CRUD |
| `songs` | SELECT, INSERT, UPDATE, DELETE | Browser Supabase client (RLS: own via `get_my_profile_id()`) | Per-DJ songs |
| `questions` | SELECT, INSERT, UPDATE, DELETE | Browser client (RLS) | Per-DJ questions |
| `upsells` | SELECT, INSERT, UPDATE, DELETE | Browser client (RLS) | Per-DJ upsells |
| `dj_events` | SELECT, INSERT, UPDATE, DELETE | Service role (via /api/admin/events) | DJ event management |
| `event_screenshots` | SELECT, INSERT, DELETE | Service role (via /api/admin/events) | Event images |
| `events` | SELECT, INSERT | Service role (via /api/admin/couple-link) | Couple questionnaire events |

### Zustand Stores

**`adminStore`** (persisted as `compakt-admin`, partialize: songs/questions/upsells only)
```
State: isAuthenticated, userId, authError, songs[], questions[], upsells[]
Auth: login, loginWithEmail, signUp, loginWithOAuth, checkSession, logout
CRUD: add/update/delete/reorder for songs, questions, upsells
Sync: loadContentFromDB
```

**`profileStore`** (persisted as `compakt-profile`, partialize: profile + profileId)
```
State: profile (ProfileState), profileId, loading
Actions: setProfile, resetProfile, loadProfileFromDB, saveProfileToDB, loadProfileBySlug
```

**`eventsStore`** (NOT persisted)
```
State: events[], loading, error
Actions: loadEvents, createEvent, updateEvent, deleteEvent,
         addScreenshot, removeScreenshot, reorderScreenshots
```

---

## SYSTEM 3: ANALYTICS & OPS

### Flow: Events tracked → Batched → Stored → Queried

```
Client (any page)
  │
  └─ useAnalytics() hook
      └─ track(eventName, metadata)
          └─ enqueue() → batchQueue[]
              └─ flush every 2s OR on 20 events OR on page unload
                  └─ POST /api/analytics/track { events: [...] }
                      └─ DB: analytics_events.insert (batch)

Admin (analytics tab — NOT YET BUILT)
  │
  └─ GET /api/analytics/track?djId=xxx&from=...&to=...
      └─ DB: analytics_events.select (filtered)
      └─ computeStats(): funnel, breakpoints, avg durations, completion rate
```

### Tables touched by Analytics

| Table | Operations | RLS | Notes |
|-------|-----------|-----|-------|
| `analytics_events` | INSERT (batch), SELECT | Anon: insert (open), select (open) | Fire-and-forget tracking |

---

## SYSTEM 4: PUBLIC DJ PROFILE

### Flow: Visitor opens /dj/[slug]

```
Browser (dj/[slug]/page.tsx)
  │
  └─ profileStore.loadProfileBySlug(slug)
      └─ DB: profiles.select where dj_slug = slug (anon client, RLS: public read)
      └─ Fallback: check localStorage profileStore for matching slug
      └─ Render DJProfilePreview in "public" mode
```

---

## RLS POLICY SUMMARY

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| `profiles` | Public | Own (auth.uid = user_id) | Own | Own |
| `songs` | Public | Own (dj_id = my profile) | Own | Own |
| `questions` | Public | Own | Own | Own |
| `upsells` | Public | Own | Own | Own |
| `events` | Public | Anon (open) | Anon (open) | — |
| `answers` | Public | Anon (open) | — | — |
| `swipes` | Public | Anon (open) | — | — |
| `requests` | Public | Anon (open) | — | — |
| `dj_events` | Public | Own | Own | Own |
| `event_screenshots` | Public | Own (via dj_event owner) | Own | Own |
| `event_sessions` | Public | Anon (open) | Anon (open) | — |
| `analytics_events` | Public | Anon (open) | — | — |

**Security note:** All couple-facing tables (events, answers, swipes, requests, event_sessions) have wide-open INSERT/UPDATE RLS. This is by design (anonymous couples), but the API routes use service role key which bypasses RLS entirely.

---

## SUPABASE CLIENT USAGE

| Context | Client | Key Used |
|---------|--------|----------|
| Browser (stores, components) | `supabase` from `lib/supabase.ts` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| API routes (all /api/*) | `getServiceSupabase()` from `lib/supabase.ts` | `SUPABASE_SERVICE_ROLE_KEY` |

**Pattern:** Admin write operations go through API routes (service role) to bypass RLS. Read operations use the browser client with public SELECT policies. Songs/questions/upsells CRUD use browser client directly (RLS enforced via `get_my_profile_id()`).
