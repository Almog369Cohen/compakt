# Compakt — High-Level Architecture

> A platform for DJs to create interactive music briefs with couples ahead of events.

---

## 1. System Overview

Compakt is a **full-stack web application** with three main portals:

```
┌─────────────────────────────────────────────────────────────────────┐
│                         COMPAKT PLATFORM                            │
│                                                                     │
│  ┌────────────────┐  ┌──────────────────┐  ┌─────────────────────┐  │
│  │ Couple Portal  │  │  DJ Admin Panel  │  │  Public DJ Profile  │  │
│  │     /          │  │    /admin        │  │    /dj/[slug]       │  │
│  │                │  │                  │  │                     │  │
│  │ Phone OTP Auth │  │ Supabase Auth    │  │ Public (no auth)    │  │
│  │ 5-stage wizard │  │ Song/Q/Event     │  │ Gallery, reviews,   │  │
│  │ Swipe songs    │  │ management       │  │ social links        │  │
│  │ Music brief    │  │ Couple links     │  │                     │  │
│  └────────┬───────┘  └────────┬─────────┘  └──────────┬──────────┘  │
│           │                   │                       │             │
│  ┌────────┴───────────────────┴───────────────────────┴──────────┐  │
│  │               Next.js 14 API Routes (~25 routes)              │  │
│  │  /api/auth/*  /api/admin/*  /api/hq/*  /api/gcal/*            │  │
│  │  /api/spotify/*  /api/youtube/*  /api/uploads/*               │  │
│  └───────────────────────────┬───────────────────────────────────┘  │
│                              │                                      │
│  ┌───────────────────────────┴───────────────────────────────────┐  │
│  │                     Supabase (Backend)                         │  │
│  │  PostgreSQL │ Auth (GoTrue) │ Storage │ RLS Policies           │  │
│  │  12 Tables  │ Email/OAuth   │ dj-media│ Per-table rules        │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌──────────────────┐  ┌──────────────────┐                        │
│  │  Staff HQ Panel  │  │  Next.js         │                        │
│  │    /hq            │  │  Middleware       │                        │
│  │  staff/owner only │  │  Route protection │                        │
│  └──────────────────┘  └──────────────────┘                        │
└─────────────────────────────────────────────────────────────────────┘
```

### Core Flow

1. **DJ signs up** → sets up profile, songs, questions → generates a couple link
2. **Couple receives link** (magic token) → phone OTP verification → answers questions → swipes songs → special requests → receives a **music brief**
3. **DJ views results** in the admin panel

---

## 2. Tech Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Framework** | Next.js (App Router) | 14.2 | SSR, API routes, file-based routing |
| **UI Library** | React | 18.2 | Component-based UI |
| **Language** | TypeScript | 5.x | Type safety across client & server |
| **State Management** | Zustand | 5.x | Lightweight stores with persist middleware |
| **Styling** | Tailwind CSS | 3.4 | Utility-first CSS with custom design tokens |
| **Animations** | Framer Motion | 12.x | Page transitions, swipe gestures, micro-interactions |
| **Icons** | Lucide React | 0.575 | SVG icon library |
| **Drag & Drop** | @dnd-kit | 6.x / 10.x | Song and question reordering |
| **PDF Export** | html2pdf.js | 0.14 | Music brief PDF generation |
| **Database** | PostgreSQL (via Supabase) | — | Relational data with Row Level Security |
| **Auth** | Supabase Auth (GoTrue) | 2.98 | Email/password, OAuth (Google/FB/Apple) |
| **File Storage** | Supabase Storage | — | DJ media uploads (bucket: `dj-media`) |
| **Server Auth** | @supabase/ssr | 0.9 | Cookie-based session management in middleware & API routes |
| **Deployment** | Google Cloud Run | — | Containerized production hosting |
| **CI/CD** | GitHub Actions | — | Automated deploy on push to `main` |
| **Cloud Storage** | Google Cloud Storage | 7.19 | Additional file storage |
| **Runtime** | Node.js | 20.x | Server runtime |
| **Font** | Heebo | — | Hebrew + Latin support (Google Fonts) |

---

## 3. Architecture Patterns & Methods

### 3.1 App Router (Next.js 14)

- **File-based routing** with `src/app/` directory
- **Server Components** by default; `"use client"` directive for interactive components
- **API Route Handlers** in `src/app/api/` — serverless functions that run on Cloud Run
- **Middleware** (`src/middleware.ts`) intercepts requests to protected routes

### 3.2 Authentication Strategy (Multi-Layer)

```
┌──────────────────────────────────────────────────┐
│                 Authentication                    │
│                                                  │
│  DJ / Admin / Staff:                             │
│  ├── Supabase Auth (email/password)    [Primary] │
│  ├── Supabase OAuth (Google/FB/Apple)  [Primary] │
│  └── Legacy password                   [Fallback]│
│                                                  │
│  Couple (Anonymous):                             │
│  └── Phone OTP (6-digit, 5-min expiry)           │
│      ├── Production → Twilio SMS                 │
│      └── Development → OTP in HTTP response      │
│                                                  │
│  API Routes:                                     │
│  └── Service Role Key (bypasses RLS)             │
└──────────────────────────────────────────────────┘
```

### 3.3 Role-Based Access Control (RBAC)

Three roles stored in `profiles.role`:

| Role | Access | Description |
|------|--------|-------------|
| `dj` | `/admin` | Default. Manages own songs, questions, events, couple links |
| `staff` | `/admin` + `/hq` | Internal staff. Can view all users, system health |
| `owner` | `/admin` + `/hq` | Full access. Same as staff with owner privileges |

**Middleware enforcement:**
- `/admin`, `/hq` → redirects unauthenticated users to login
- `/api/admin/*`, `/api/hq/*` → returns `401 JSON` for unauthenticated requests
- `/hq` page → client-side role check redirects `dj` users to `/admin`

### 3.4 Client-Side State (Zustand Stores)

Four stores manage all client state:

| Store | Persist Key | Purpose |
|-------|-------------|---------|
| `eventStore` | `compakt-event` | Couple wizard state: answers, swipes, requests |
| `adminStore` | `compakt-admin` | DJ admin: auth status, songs, questions, upsells |
| `profileStore` | `compakt-profile` | DJ profile data (business name, gallery, links) |
| `eventsStore` | *(none)* | DJ calendar events (fetched fresh) |

**Pattern:** Each store uses Zustand's `persist` middleware to survive page reloads. Actions make API calls to sync with Supabase, then update local state.

### 3.5 Supabase Client Architecture

Three distinct Supabase clients for different contexts:

| Client | File | Context | Key Used |
|--------|------|---------|----------|
| `supabase` (browser) | `lib/supabase.ts` | Client components, stores | `ANON_KEY` |
| `createRouteClient()` | `lib/supabase-server.ts` | API route handlers | `ANON_KEY` + cookies |
| `createMiddlewareSupabase()` | `lib/supabase-server.ts` | Middleware | `ANON_KEY` + req/res cookies |
| `getServiceSupabase()` | `lib/supabase.ts` | API routes (admin ops) | `SERVICE_ROLE_KEY` |

- **Browser client** respects Row Level Security (RLS)
- **Service client** bypasses RLS — used only in server-side API routes for admin operations
- **Route client** uses `@supabase/ssr` with cookie-based sessions for authenticated API calls

### 3.6 Database Design (PostgreSQL via Supabase)

**12 tables** organized in two groups:

**DJ-owned tables** (RLS: owner-only writes):
- `profiles` — DJ business profile
- `songs` — Song library (per DJ)
- `questions` — Questionnaire questions (per DJ)
- `upsells` — Upsell offerings (per DJ)
- `dj_events` — DJ calendar events
- `event_screenshots` — Event gallery images

**Couple tables** (RLS: open anonymous access):
- `events` — Couple questionnaire sessions
- `answers` — Question responses
- `swipes` — Song swipe actions (like/dislike/super_like/unsure)
- `requests` — Special music requests
- `event_sessions` — OTP verification sessions
- `analytics_events` — Usage tracking

**Key relationships:**
```
profiles ──1:N── songs
profiles ──1:N── questions
profiles ──1:N── upsells
profiles ──1:N── events (couple) ──1:N── answers
                                 ──1:N── swipes
                                 ──1:N── requests
profiles ──1:N── dj_events ──1:N── event_screenshots
```

### 3.7 Row Level Security (RLS)

Every table has RLS enabled:

- **DJ tables:** `SELECT` is public (for couple portal reads), `INSERT/UPDATE/DELETE` restricted to the owning DJ via `get_my_profile_id()` SQL function
- **Couple tables:** Open access (couples are anonymous — no Supabase Auth session). Protected by magic token knowledge
- **Service role** client bypasses all RLS for admin API operations

---

## 4. External Integrations

| Service | Purpose | Method |
|---------|---------|--------|
| **Supabase** | Database, Auth, Storage | REST API (PostgREST), GoTrue, S3-compatible storage |
| **Spotify** | Playlist import for DJs | OAuth2 → fetch playlists → import tracks to `songs` table |
| **Google Calendar** | Event sync for DJs | OAuth2 → bidirectional sync (pull/push) with `dj_events` table |
| **Twilio** | SMS OTP for couples | REST API → send 6-digit code (production only) |
| **YouTube** | Song preview embeds | oEmbed API for metadata; iframe embeds in SongTinder |
| **Google Cloud Storage** | File uploads | `@google-cloud/storage` SDK |

### Integration Flows

**Spotify:**
```
DJ → /api/spotify/connect → Spotify OAuth → /api/spotify/callback → Access Token
     → /api/spotify/me/playlists → select playlist
     → /api/spotify/import/playlist → songs inserted to DB
```

**Google Calendar:**
```
DJ → /api/gcal/connect → Google OAuth → /api/gcal/callback → tokens stored in profiles
     → /api/gcal/sync { direction: "pull" | "push" }
```

---

## 5. Couple Portal — 5-Stage Wizard

The couple experience is a progressive wizard flow:

| Stage | Component | Description |
|-------|-----------|-------------|
| 0 | `EventSetup` | Event type, couple names, date, venue |
| 1 | `QuestionFlow` | ~10 questions (single select, multi select, slider, text) |
| 2 | `SongTinder` | Swipe interface: Like / Dislike / Super Like / Unsure / Undo |
| 3 | `DreamsRequests` | Special moments, do/don't lists, song links |
| 4 | `MusicBrief` | Summary of all data + PDF export + WhatsApp share |

**Access method:** Magic token URL (`?token=xxx`) → Phone OTP verification → Session stored in `sessionStorage`

---

## 6. DJ Admin Panel — Tabbed Interface

| Tab | Component | Features |
|-----|-----------|----------|
| Profile | `ProfileSettings` | Split view: edit form + live preview. Logo, cover, bio, social links, gallery, reviews |
| Songs | `SongManager` | Add/edit/delete/reorder songs. Spotify import. YouTube preview |
| Questions | `QuestionManager` | Add/edit/delete/reorder questions. 4 question types |
| Upsells | `UpsellManager` | Manage premium offerings shown during couple flow |
| Events | `EventsManager` | DJ calendar events with screenshots. Google Calendar sync |
| Couple Links | `CoupleLinks` | Generate magic links, view completion stats, share via WhatsApp |

---

## 7. Deployment & CI/CD

### Production: Google Cloud Run

```
GitHub (main branch)
         │ git push
         ▼
┌─ GitHub Actions ─────────────────────────────┐
│  .github/workflows/deploy-cloud-run.yml      │
│                                              │
│  1. Checkout code                            │
│  2. Auth to GCP (Workload Identity Fed.)     │
│  3. Setup gcloud CLI                         │
│  4. Validate required secrets (fail-fast)    │
│  5. gcloud run deploy --source .             │
│     (Cloud Build auto-detects Next.js)       │
│     + inject env vars from GitHub Secrets    │
└──────────────┬───────────────────────────────┘
               ▼
     Google Cloud Run
     Service: "compakt"
     Region: us-central1
     Public access: allowed
```

**Key CI/CD features:**
- **Workload Identity Federation** — keyless auth from GitHub to GCP (no service account key stored)
- **Fail-fast secret validation** — deployment aborts early if critical secrets are missing
- **Concurrency control** — only one deployment runs at a time (`cancel-in-progress: true`)
- **Build-time env vars** — `NEXT_PUBLIC_*` vars injected at build time for client-side code

### Environment Variables

| Variable | Type | Required |
|----------|------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Build-time (client) | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Build-time (client) | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Runtime (server) | Yes |
| `NEXT_PUBLIC_APP_URL` | Build-time (client) | Yes |
| `GOOGLE_CLIENT_ID` | Runtime (server) | Yes |
| `GOOGLE_CLIENT_SECRET` | Runtime (server) | Yes |
| `GOOGLE_CALENDAR_REDIRECT_URI` | Runtime (server) | Yes |
| `SPOTIFY_CLIENT_ID` | Runtime (server) | Optional |
| `SPOTIFY_CLIENT_SECRET` | Runtime (server) | Optional |
| `TWILIO_*` | Runtime (server) | Optional |

---

## 8. UI & Design System

- **Direction:** RTL (Hebrew-first)
- **Theme:** Dark mode default with day/night toggle (`ThemeToggle` component)
- **Design tokens:** CSS custom properties (`--bg-primary`, `--text-primary`, etc.) mapped to Tailwind
- **Glass morphism:** `glass-card` utility class for frosted-glass card effects
- **Brand colors:** Blue `#059cc0`, Green `#03b28c`
- **Typography:** Heebo font (Google Fonts) — supports Hebrew + Latin
- **Responsive:** Mobile-first design, optimized for phone-sized couple portal
- **Animations:** Framer Motion for page transitions, swipe gestures, card stacks

---

## 9. Project Structure

```
compakt/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx            # Couple portal (home)
│   │   ├── layout.tsx          # Root layout (RTL, fonts, theme)
│   │   ├── admin/page.tsx      # DJ admin panel
│   │   ├── hq/page.tsx         # Staff HQ panel
│   │   ├── dj/[slug]/page.tsx  # Public DJ profile
│   │   └── api/                # ~25 API routes
│   ├── components/
│   │   ├── stages/             # 5 couple wizard stages
│   │   ├── admin/              # Admin panel components
│   │   ├── auth/               # PhoneGate (OTP)
│   │   ├── dj/                 # DJ profile preview
│   │   └── ui/                 # Shared UI components
│   ├── stores/                 # 4 Zustand stores
│   ├── hooks/                  # Custom React hooks
│   ├── lib/                    # Supabase clients, types, utils
│   └── data/                   # Default seed data (songs, questions, upsells)
├── supabase/migrations/        # SQL migration files
├── scripts/                    # Setup & verification scripts
├── .github/workflows/          # CI/CD pipeline
└── public/                     # Static assets
```

---

## 10. Security Summary

| Layer | Method |
|-------|--------|
| **Route protection** | Next.js Middleware checks Supabase session for `/admin`, `/hq`, `/api/admin/*` |
| **Database** | Row Level Security on all 12 tables |
| **API auth** | Server-side session validation via `@supabase/ssr` cookie-based auth |
| **Service role** | Never exposed to client; used only in API route handlers |
| **Couple access** | Magic token + phone OTP; no persistent auth (sessionStorage only) |
| **Secrets** | All sensitive values in GitHub Secrets; injected at deploy time |
| **RBAC** | `profiles.role` column (`dj` / `staff` / `owner`) enforced in middleware + UI |
