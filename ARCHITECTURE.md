# Compakt — ארכיטקטורת המוצר

> פלטפורמה ל-DJs ליצירת בריף מוזיקלי אינטראקטיבי עם זוגות לקראת אירועים.

---

## תוכן עניינים

1. [סקירת מערכת](#1-סקירת-מערכת)
2. [Tech Stack](#2-tech-stack)
3. [מבנה הפרויקט](#3-מבנה-הפרויקט)
4. [דפים ונתיבים](#4-דפים-ונתיבים)
5. [מודל הנתונים](#5-מודל-הנתונים)
6. [ניהול State](#6-ניהול-state)
7. [פורטל הזוג — זרימה](#7-פורטל-הזוג--זרימה)
8. [פורטל DJ / Admin](#8-פורטל-dj--admin)
9. [אינטגרציות חיצוניות](#9-אינטגרציות-חיצוניות)
10. [Deployment](#10-deployment)
11. [אבטחה ו-RLS](#11-אבטחה-ו-rls)

---

## 1. סקירת מערכת

Compakt מורכב משלוש מערכות עיקריות:

```
┌─────────────────────────────────────────────────────────────────┐
│                        COMPAKT PLATFORM                         │
│                                                                 │
│  ┌──────────────┐  ┌──────────────────┐  ┌───────────────────┐  │
│  │ פורטל הזוג   │  │  פורטל DJ/Admin  │  │  פרופיל ציבורי    │  │
│  │  /            │  │  /admin           │  │  /dj/[slug]       │  │
│  │              │  │                  │  │                   │  │
│  │ • OTP Auth   │  │ • Supabase Auth  │  │ • Public read     │  │
│  │ • שאלון      │  │ • ניהול שירים    │  │ • גלריה           │  │
│  │ • Swipe שירים│  │ • ניהול שאלות    │  │ • לינקים חברתיים  │  │
│  │ • בקשות מיוחדות│ │ • ניהול אירועים  │  │ • ביקורות         │  │
│  │ • בריף מוזיקלי│ │ • לינקים לזוגות  │  │                   │  │
│  │              │  │ • פרופיל + תצוגה │  │                   │  │
│  └──────┬───────┘  └────────┬─────────┘  └─────────┬─────────┘  │
│         │                   │                      │            │
│  ┌──────┴───────────────────┴──────────────────────┴─────────┐  │
│  │              Next.js 14 API Routes (21 routes)            │  │
│  │  /api/auth/*  /api/admin/*  /api/analytics/*  /api/gcal/* │  │
│  │  /api/spotify/*  /api/youtube/*  /api/uploads/*           │  │
│  └──────────────────────────┬────────────────────────────────┘  │
│                             │                                   │
│  ┌──────────────────────────┴────────────────────────────────┐  │
│  │                    Supabase (Backend)                      │  │
│  │  PostgreSQL │ Auth │ Storage (dj-media) │ RLS Policies     │  │
│  │  12 Tables  │ Email/OAuth │ Image CDN   │ Per-table rules  │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

**זרימה ראשית:**
1. DJ נרשם → מגדיר פרופיל, שירים, שאלות → יוצר לינק לזוג
2. זוג מקבל לינק (magic token) → מאמת טלפון ב-OTP → עונה על שאלות → סווייפ שירים → בקשות → בריף מוזיקלי
3. DJ רואה תוצאות בפאנל הניהול

---

## 2. Tech Stack

| שכבה | טכנולוגיה | גרסה |
|------|-----------|-------|
| **Framework** | Next.js (App Router) | 14.2.35 |
| **UI** | React | 18.2.0 |
| **State** | Zustand (persist middleware) | 5.x |
| **Styling** | Tailwind CSS | 3.4.x |
| **Animations** | Framer Motion | 12.x |
| **Icons** | Lucide React | 0.575.x |
| **Drag & Drop** | @dnd-kit | 6.x / 10.x |
| **PDF Export** | html2pdf.js | 0.14.0 |
| **DB + Auth** | Supabase (PostgreSQL + GoTrue) | 2.98.x |
| **Storage** | Supabase Storage (bucket: `dj-media`) | — |
| **Deployment** | Google Cloud Run + Netlify | — |
| **CI/CD** | GitHub Actions | — |
| **Font** | Heebo (Hebrew + Latin) | Google Fonts |
| **Language** | TypeScript | 5.x |
| **Node** | Node.js | 20.x |

---

## 3. מבנה הפרויקט

```
compakt/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── page.tsx                  # דף הבית — פורטל הזוג
│   │   ├── layout.tsx                # Root layout (RTL, Heebo font, dark theme)
│   │   ├── globals.css               # Tailwind + custom CSS variables
│   │   ├── admin/
│   │   │   └── page.tsx              # פאנל DJ/Admin
│   │   ├── dj/
│   │   │   └── [slug]/page.tsx       # פרופיל ציבורי של DJ
│   │   └── api/                      # 21 API Routes (serverless)
│   │       ├── admin/                # CRUD: profile, events, couple-link, upload, ensure-defaults, db-health
│   │       ├── auth/phone/           # send-otp, verify-otp
│   │       ├── analytics/track/      # Event tracking + query
│   │       ├── gcal/                 # Google Calendar: connect, callback, sync
│   │       ├── spotify/              # Spotify: connect, callback, playlists, import
│   │       ├── youtube/oembed/       # YouTube embed data
│   │       ├── uploads/              # File upload proxy
│   │       └── health/               # Health check
│   │
│   ├── components/
│   │   ├── stages/                   # 5 שלבי השאלון (Couple Portal)
│   │   │   ├── EventSetup.tsx        # שלב 0: הגדרת אירוע
│   │   │   ├── QuestionFlow.tsx      # שלב 1: שאלות
│   │   │   ├── SongTinder.tsx        # שלב 2: סווייפ שירים
│   │   │   ├── DreamsRequests.tsx    # שלב 3: בקשות מיוחדות
│   │   │   └── MusicBrief.tsx        # שלב 4: בריף מוזיקלי (סיכום)
│   │   ├── admin/                    # קומפוננטות פאנל ניהול
│   │   │   ├── Dashboard.tsx         # לוח בקרה ראשי
│   │   │   ├── ProfileSettings.tsx   # עריכת פרופיל (split view)
│   │   │   ├── SongManager.tsx       # ניהול שירים
│   │   │   ├── QuestionManager.tsx   # ניהול שאלות
│   │   │   ├── UpsellManager.tsx     # ניהול Upsells
│   │   │   ├── EventsManager.tsx     # ניהול אירועי DJ
│   │   │   ├── CoupleLinks.tsx       # לינקים לזוגות
│   │   │   └── AnalyticsDashboard.tsx# אנליטיקס
│   │   ├── auth/
│   │   │   └── PhoneGate.tsx         # אימות OTP טלפוני
│   │   ├── dj/
│   │   │   └── DJProfilePreview.tsx  # תצוגה מקדימה של פרופיל DJ (shared)
│   │   └── ui/                       # קומפוננטות UI משותפות
│   │       ├── StageNav.tsx          # ניווט שלבים
│   │       ├── ImageUploader.tsx     # העלאת תמונות (drag & drop)
│   │       ├── Lightbox.tsx          # צפייה בתמונות (fullscreen)
│   │       ├── SwipeTutorial.tsx     # הדרכת סווייפ
│   │       ├── ThemeToggle.tsx       # מעבר בין ערכות נושא
│   │       ├── ErrorBoundary.tsx     # לכידת שגיאות React
│   │       └── HydrationGuard.tsx    # מניעת SSR mismatch
│   │
│   ├── stores/                       # Zustand State Management
│   │   ├── eventStore.ts            # סטור האירוע (זוג) — answers, swipes, requests
│   │   ├── adminStore.ts            # סטור Admin — auth, songs, questions, upsells
│   │   ├── profileStore.ts          # סטור פרופיל DJ
│   │   └── eventsStore.ts           # סטור אירועי DJ (CRUD)
│   │
│   ├── hooks/
│   │   └── useAnalytics.ts          # Hook לאנליטיקס עם batching
│   │
│   ├── lib/
│   │   ├── supabase.ts              # Supabase clients (browser + service role)
│   │   ├── types.ts                 # TypeScript type definitions
│   │   ├── storage.ts               # Supabase Storage upload/delete utilities
│   │   └── utils.ts                 # Helper functions (magic token generation, etc.)
│   │
│   └── data/                         # Default seed data
│       ├── songs.ts                  # 20+ שירי ברירת מחדל
│       ├── questions.ts              # 10 שאלות ברירת מחדל
│       └── upsells.ts               # 3 Upsells ברירת מחדל
│
├── supabase/
│   └── migrations/                   # SQL Migration files
│       ├── 013_profiles_and_events.sql   # Core schema (8 tables + RLS)
│       ├── 014_events.sql                # DJ events + screenshots
│       ├── 015_gcal_tokens.sql           # Google Calendar tokens
│       └── 016_phone_auth_and_analytics.sql # OTP sessions + analytics
│
├── scripts/
│   ├── bootstrap.js                  # Project setup script
│   ├── inspect-schema.mjs            # DB schema probe tool
│   ├── verify-db-health.sh           # 26-test DB health verification
│   └── verify-audit.sh               # Audit verification pack
│
├── .github/workflows/
│   └── deploy-cloud-run.yml          # CI/CD: GitHub → Cloud Run
│
├── public/                           # Static assets (favicon, manifest)
├── netlify.toml                      # Netlify deployment config
├── next.config.mjs                   # Next.js config (image domains)
├── tailwind.config.ts                # Tailwind config
└── package.json                      # Dependencies & scripts
```

---

## 4. דפים ונתיבים

### דפים (Pages)

| נתיב | קובץ | תיאור |
|------|------|-------|
| `/` | `src/app/page.tsx` | פורטל הזוג — שאלון 5 שלבים עם OTP auth |
| `/admin` | `src/app/admin/page.tsx` | פאנל ניהול DJ — 6 טאבים |
| `/dj/[slug]` | `src/app/dj/[slug]/page.tsx` | דף פרופיל ציבורי של DJ |

### API Routes (21 נתיבים)

#### Admin (6)
| Route | Method | תיאור |
|-------|--------|-------|
| `/api/admin/profile` | GET, POST | קריאה/עדכון פרופיל DJ |
| `/api/admin/events` | GET, POST | CRUD אירועי DJ + screenshots |
| `/api/admin/couple-link` | GET, POST | יצירת/רשימת לינקים לזוגות |
| `/api/admin/upload` | POST | העלאת תמונות ל-Supabase Storage |
| `/api/admin/ensure-defaults` | POST | Seeding תוכן ברירת מחדל |
| `/api/admin/db-health` | GET | בדיקת תקינות DB |

#### Auth (2)
| Route | Method | תיאור |
|-------|--------|-------|
| `/api/auth/phone/send-otp` | POST | שליחת קוד OTP לטלפון |
| `/api/auth/phone/verify-otp` | POST | אימות קוד OTP |

#### Analytics (1)
| Route | Method | תיאור |
|-------|--------|-------|
| `/api/analytics/track` | GET, POST | שליחת/שאילתת אירועי אנליטיקס |

#### Google Calendar (3)
| Route | Method | תיאור |
|-------|--------|-------|
| `/api/gcal/connect` | GET | התחלת OAuth עם Google |
| `/api/gcal/callback` | GET | קבלת token מ-Google |
| `/api/gcal/sync` | POST | סנכרון דו-כיווני עם Google Calendar |

#### Spotify (5)
| Route | Method | תיאור |
|-------|--------|-------|
| `/api/spotify/connect` | GET | חיבור חשבון Spotify |
| `/api/spotify/callback` | GET | קבלת token מ-Spotify |
| `/api/spotify/me/playlists` | GET | רשימת playlists של ה-DJ |
| `/api/spotify/playlist` | GET | שירים מ-playlist ספציפי |
| `/api/spotify/import/playlist` | POST | ייבוא שירים מ-Spotify |

#### Other (4)
| Route | Method | תיאור |
|-------|--------|-------|
| `/api/youtube/oembed` | GET | YouTube embed metadata |
| `/api/uploads` | POST | העלאת קבצים כללית |
| `/api/uploads/[...path]` | GET | הגשת קבצים שהועלו |
| `/api/health` | GET | Health check |

---

## 5. מודל הנתונים

### ER Diagram

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│  profiles    │──1:N──│   songs      │       │  dj_events   │
│  (DJ)        │──1:N──│  questions   │       │  (DJ events) │
│              │──1:N──│   upsells    │       │              │
│              │──1:N──│   events     │──1:N──│event_screenshots│
│              │       │  (couples)   │       └──────────────┘
└──────┬───────┘       └──────┬───────┘
       │                      │
       │               ┌──────┴───────┐
       │               │              │
       │         ┌─────┴─────┐ ┌──────┴──────┐ ┌──────────────┐
       │         │  answers   │ │   swipes    │ │  requests    │
       │         └───────────┘ └─────────────┘ └──────────────┘
       │
       │         ┌─────────────┐     ┌──────────────────┐
       └────────│event_sessions│     │ analytics_events  │
                │  (OTP)       │     │ (tracking)        │
                └──────────────┘     └──────────────────┘
```

### טבלאות (12)

#### `profiles` — פרופיל DJ
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | מזהה ייחודי |
| `user_id` | UUID FK → auth.users | חשבון Supabase Auth |
| `business_name` | TEXT | שם העסק |
| `tagline` | TEXT | כותרת משנה |
| `bio` | TEXT | תיאור |
| `accent_color` | TEXT | צבע מותאם (#hex) |
| `dj_slug` | TEXT UNIQUE | URL slug: `/dj/my-slug` |
| `logo_url`, `cover_url` | TEXT | לוגו וקאבר |
| `instagram_url`, `tiktok_url`, `soundcloud_url`, `spotify_url`, `youtube_url`, `website_url` | TEXT | לינקים חברתיים |
| `whatsapp_number` | TEXT | מספר WhatsApp |
| `custom_links` | JSONB | לינקים מותאמים `[{label, url}]` |
| `gallery_photos` | JSONB | תמונות גלריה `[{url, caption}]` |
| `reviews` | JSONB | ביקורות `[{name, text, rating}]` |
| `google_calendar_tokens` | JSONB | OAuth tokens ל-Google Calendar |
| `created_at`, `updated_at` | TIMESTAMPTZ | חותמות זמן |

#### `events` — אירוע שאלון זוג
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | מזהה |
| `dj_id` | UUID FK → profiles | ה-DJ שיצר את הלינק |
| `magic_token` | TEXT UNIQUE | טוקן גישה לזוג |
| `event_type` | TEXT | סוג אירוע (wedding, bar_mitzvah, etc.) |
| `couple_name_a`, `couple_name_b` | TEXT | שמות הזוג |
| `event_date` | TEXT | תאריך האירוע |
| `venue` | TEXT | מקום האירוע |
| `current_stage` | INT | שלב נוכחי (0-4) |
| `phone_number` | TEXT | טלפון הזוג (אחרי OTP) |

#### `answers` — תשובות לשאלות
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | מזהה |
| `event_id` | UUID FK → events | אירוע |
| `question_id` | TEXT | מזהה שאלה |
| `answer_value` | JSONB | ערך התשובה |

#### `swipes` — סווייפ שירים
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | מזהה |
| `event_id` | UUID FK → events | אירוע |
| `song_id` | TEXT | מזהה שיר |
| `action` | TEXT | `like` / `dislike` / `super_like` / `unsure` |
| `reason_chips` | JSONB | סיבות לדיסלייק `["boring", "too_slow"]` |

#### `requests` — בקשות מיוחדות
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | מזהה |
| `event_id` | UUID FK → events | אירוע |
| `request_type` | TEXT | `free_text` / `do` / `dont` / `link` / `special_moment` |
| `content` | TEXT | תוכן הבקשה |
| `moment_type` | TEXT | סוג רגע (ceremony, first_dance, etc.) |

#### `songs` — ספריית שירים (per DJ)
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | מזהה |
| `dj_id` | UUID FK → profiles | DJ |
| `title`, `artist` | TEXT | שם שיר ואמן |
| `cover_url`, `preview_url`, `external_link` | TEXT | מדיה |
| `category` | TEXT | `reception` / `food` / `dancing` / `ceremony` |
| `tags` | JSONB | תגיות |
| `energy` | INT (1-5) | רמת אנרגיה |
| `language` | TEXT | שפה |
| `is_safe`, `is_active` | BOOLEAN | דגלים |
| `sort_order` | INT | סדר |

#### `questions` — שאלות (per DJ)
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | מזהה |
| `dj_id` | UUID FK → profiles | DJ |
| `question_he` | TEXT | טקסט השאלה (עברית) |
| `question_type` | TEXT | `single_select` / `multi_select` / `slider` / `text` |
| `options` | JSONB | אופציות `[{label, value, icon}]` |
| `slider_min`, `slider_max` | INT | טווח slider |
| `slider_labels` | JSONB | תוויות slider |
| `is_required`, `is_active` | BOOLEAN | דגלים |
| `sort_order` | INT | סדר |

#### `upsells` — הצעות Upsell (per DJ)
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | מזהה |
| `dj_id` | UUID FK → profiles | DJ |
| `title_he`, `description_he` | TEXT | כותרת ותיאור |
| `price_hint` | TEXT | רמז מחיר |
| `cta_text_he` | TEXT | טקסט כפתור |
| `placement` | TEXT | `stage_4` / `post_brief` / `inline` |

#### `dj_events` — אירועי DJ (לוח שנה)
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | מזהה |
| `dj_id` | UUID FK → profiles | DJ |
| `name` | TEXT | שם האירוע |
| `date_time` | TIMESTAMPTZ | תאריך ושעה |
| `venue`, `city` | TEXT | מיקום |
| `status` | TEXT | `upcoming` / `confirmed` / `completed` / `cancelled` |
| `google_event_id` | TEXT | מזהה ב-Google Calendar |
| `notes` | TEXT | הערות |

#### `event_screenshots` — צילומי מסך של אירועי DJ
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | מזהה |
| `event_id` | UUID FK → dj_events | אירוע |
| `image_url` | TEXT | URL תמונה |
| `sort_order` | INT | סדר |

#### `event_sessions` — סשנים OTP
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | מזהה |
| `event_id` | UUID FK → events | אירוע זוג |
| `phone_number` | TEXT | מספר טלפון |
| `otp_code` | TEXT | קוד 6 ספרות |
| `otp_expires_at` | TIMESTAMPTZ | תפוגה (5 דקות) |
| `phone_verified` | BOOLEAN | האם אומת |
| `otp_attempts` | INT | ניסיונות (rate limit) |

#### `analytics_events` — אירועי אנליטיקס
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | מזהה |
| `dj_id` | UUID | DJ |
| `event_id` | UUID | אירוע (optional) |
| `session_id` | TEXT | מזהה סשן |
| `event_name` | TEXT | שם האירוע (e.g. `stage_enter`, `swipe`) |
| `category` | TEXT | קטגוריה |
| `metadata` | JSONB | מידע נוסף |
| `user_agent`, `referrer` | TEXT | מידע דפדפן |

---

## 6. ניהול State

ארבעה Zustand stores מנהלים את ה-state בצד הלקוח:

### `eventStore` — סטור האירוע (זוג)
> Persist key: `compakt-event`

```
State:
  event: EventData | null      # מידע על האירוע
  answers: QuestionAnswer[]    # תשובות לשאלות
  swipes: SongSwipe[]          # סווייפ שירים
  requests: EventRequest[]     # בקשות מיוחדות
  upsellClicks: UpsellClick[]  # קליקים על upsells
  analytics: AnalyticsEvent[]  # אירועי tracking
  theme: "night" | "day"       # ערכת נושא

Actions:
  createEvent(data)            # יצירת אירוע חדש (DB + local)
  loadEvent(token)             # טעינת אירוע קיים לפי magic token
  setStage(n)                  # מעבר שלב (0-4)
  saveAnswer(qId, value)       # שמירת תשובה (upsert to DB)
  saveSwipe(songId, action)    # שמירת סווייפ (upsert to DB)
  addRequest(req)              # הוספת בקשה (insert to DB)
  removeRequest(id)            # מחיקת בקשה
  setSwipes(swipes)            # set bulk swipes (for resume)
  reset()                      # איפוס מלא
```

### `adminStore` — סטור ה-Admin
> Persist key: `compakt-admin` (partialize: songs, questions, upsells only)

```
State:
  isAuthenticated: boolean     # האם מחובר
  userId: string | null        # Supabase user ID
  authError: string | null     # שגיאת auth
  songs: Song[]                # רשימת שירים
  questions: Question[]        # רשימת שאלות
  upsells: Upsell[]           # רשימת upsells

Auth Actions:
  login(password)              # Legacy password login
  loginWithEmail(email, pwd)   # Supabase email/password
  signUp(email, pwd)           # הרשמה
  loginWithOAuth(provider)     # Google / Facebook / Apple
  checkSession()               # בדיקת סשן קיים
  logout()                     # התנתקות

CRUD Actions:
  add/update/delete Song       # + DB sync
  add/update/delete Question   # + DB sync
  add/update/delete Upsell     # + DB sync
  reorderSongs/Questions       # + DB sync
  loadContentFromDB(profileId) # טעינה מ-Supabase
```

### `profileStore` — סטור פרופיל DJ
> Persist key: `compakt-profile` (partialize: profile, profileId)

```
State:
  profile: ProfileState        # כל שדות הפרופיל
  profileId: string | null     # ID בטבלת profiles
  loading: boolean

Actions:
  setProfile(patch)            # עדכון local state
  resetProfile()               # איפוס
  loadProfileFromDB(userId)    # טעינה לפי user ID
  saveProfileToDB(userId)      # שמירה דרך API route (service role)
  loadProfileBySlug(slug)      # טעינה לפי slug (public)
```

### `eventsStore` — סטור אירועי DJ
> No persistence (fetched fresh each time)

```
State:
  events: DJEvent[]            # רשימת אירועים
  loading: boolean
  error: string | null

Actions:
  loadEvents(profileId)        # טעינה מ-API
  createEvent(profileId, data) # יצירת אירוע
  updateEvent(eventId, patch)  # עדכון
  deleteEvent(eventId)         # מחיקה
  addScreenshot(eventId, url)  # הוספת screenshot
  removeScreenshot(id)         # מחיקת screenshot
  reorderScreenshots(eventId, ids) # סידור מחדש
```

---

## 7. פורטל הזוג — זרימה

```
┌────────────┐    ┌────────────┐    ┌────────────┐    ┌────────────┐    ┌────────────┐
│  Stage 0   │───▶│  Stage 1   │───▶│  Stage 2   │───▶│  Stage 3   │───▶│  Stage 4   │
│ EventSetup │    │ Questions  │    │ SongTinder │    │  Dreams &  │    │   Music    │
│            │    │   Flow     │    │  (Swipe)   │    │  Requests  │    │   Brief    │
│ סוג אירוע  │    │ 10 שאלות   │    │ סווייפ שירים│    │ רגעים מיוחדים│   │ סיכום + PDF│
│ שמות + תאריך│   │ 4 סוגים    │    │ Like/Dislike│   │ Do/Don't   │    │ WhatsApp   │
│ מקום       │    │ ניווט חופשי │    │ Super Like │    │ לינקים     │    │ Copy Link  │
└────────────┘    └────────────┘    │ Undo       │    │ Upsells    │    └────────────┘
                                    │ Keyboard   │    └────────────┘
                                    │ YouTube    │
                                    └────────────┘
```

### אימות OTP (PhoneGate)

```
Couple opens ?token=xxx
        │
        ▼
┌─ sessionStorage has session? ─┐
│  YES                     NO   │
│   │                       │   │
│   ▼                       ▼   │
│ Load event          PhoneGate │
│ directly            component │
│                       │       │
│                 Enter phone    │
│                       │       │
│            POST /api/auth/    │
│            phone/send-otp     │
│                       │       │
│                 Enter OTP      │
│                 (6 digits)     │
│                       │       │
│            POST /api/auth/    │
│            phone/verify-otp   │
│                       │       │
│                 ┌─────┴──────┐│
│                 │ Has resume ││
│                 │   data?    ││
│                 ├──YES───────┤│
│                 │ Show resume││
│                 │  prompt    ││
│                 ├──NO────────┤│
│                 │ Start fresh││
│                 └────────────┘│
└───────────────────────────────┘
```

### סוגי שאלות

| סוג | קומפוננטה | תיאור |
|-----|----------|-------|
| `single_select` | רדיו כפתורים | בחירה יחידה מרשימת אופציות |
| `multi_select` | צ'קבוקסים | בחירה מרובה |
| `slider` | Slider | ערך מספרי בטווח (min-max) |
| `text` | Text input | טקסט חופשי |

### פעולות Swipe

| פעולה | Gesture | Keyboard | אפקט |
|-------|---------|----------|------|
| **Like** | Swipe ימינה | Arrow Right | ירוק, ✓ |
| **Dislike** | Swipe שמאלה | Arrow Left | אדום, ✗ + reason chips |
| **Super Like** | Swipe למעלה | Arrow Up | כחול, ⭐ + burst animation |
| **Unsure** | — | Space | צהוב, ~ |
| **Undo** | — | Backspace | ביטול פעולה אחרונה |

---

## 8. פורטל DJ / Admin

### מבנה הפאנל

```
┌─────────────────────────────────────────────┐
│                Admin Panel                   │
│                                             │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐       │
│  │ Email/  │ │ Legacy  │ │ OAuth   │       │
│  │ Password│ │ Password│ │ Google/ │       │
│  │ Login   │ │ Login   │ │ FB/Apple│       │
│  └────┬────┘ └────┬────┘ └────┬────┘       │
│       └───────────┼───────────┘             │
│                   ▼                         │
│  ┌─────────────────────────────────────┐    │
│  │             Tab Bar                 │    │
│  ├──────┬───────┬───────┬──────┬──────┤    │
│  │ 🎵   │ ❓    │ 💰   │ 📋   │ 🔗   │    │
│  │Songs │ Q's  │Upsell│Events│Links │    │
│  ├──────┴───────┴───────┴──────┴──────┤    │
│  │                                     │    │
│  │  ┌─ Profile Tab (split view) ────┐  │    │
│  │  │  Edit Form  │  Live Preview   │  │    │
│  │  │  (left)     │  (right)        │  │    │
│  │  └──────────────────────────────┘  │    │
│  │                                     │    │
│  │  ┌─ Songs Tab ───────────────────┐  │    │
│  │  │  Add/Edit/Delete/Reorder      │  │    │
│  │  │  Spotify Import               │  │    │
│  │  │  YouTube Preview              │  │    │
│  │  └──────────────────────────────┘  │    │
│  │                                     │    │
│  │  ┌─ Events Tab ──────────────────┐  │    │
│  │  │  Create/Edit DJ Events        │  │    │
│  │  │  Screenshots Carousel         │  │    │
│  │  │  Google Calendar Sync         │  │    │
│  │  └──────────────────────────────┘  │    │
│  │                                     │    │
│  │  ┌─ Couple Links Tab ────────────┐  │    │
│  │  │  Create Magic Link            │  │    │
│  │  │  View Completion Stats        │  │    │
│  │  │  Share via WhatsApp / Copy    │  │    │
│  │  └──────────────────────────────┘  │    │
│  └─────────────────────────────────────┘    │
└─────────────────────────────────────────────┘
```

### זרימת Auth

```
Admin opens /admin
        │
        ▼
  ┌─ checkSession() ─┐
  │  Active session   │  No session
  │       │           │      │
  │       ▼           │      ▼
  │  Load profile     │  Show login form
  │  + content        │      │
  │       │           │  ┌───┴────────────┐
  │       ▼           │  │ Email/Password │
  │  Admin Panel      │  │ Legacy Password│
  │                   │  │ OAuth Provider │
  │                   │  └───┬────────────┘
  │                   │      │
  │                   │  ┌───▼────────────┐
  │                   │  │ On success:    │
  │                   │  │ 1. loadProfile │
  │                   │  │ 2. loadContent │
  │                   │  │ 3. ensureDefaults│
  │                   │  └───┬────────────┘
  │                   │      │
  └───────────────────┴──────┘
```

---

## 9. אינטגרציות חיצוניות

### Supabase

```
┌────────────────────────────────────────┐
│             Supabase Platform          │
│                                        │
│  ┌──────────┐  ┌──────────────────┐    │
│  │   Auth    │  │    PostgreSQL    │    │
│  │ GoTrue    │  │   12 Tables     │    │
│  │ Email/Pwd │  │   RLS Policies  │    │
│  │ OAuth     │  │   Triggers      │    │
│  └──────────┘  └──────────────────┘    │
│                                        │
│  ┌──────────┐  ┌──────────────────┐    │
│  │ Storage  │  │    REST API      │    │
│  │ dj-media │  │  PostgREST       │    │
│  │ bucket   │  │  Auto-generated  │    │
│  └──────────┘  └──────────────────┘    │
└────────────────────────────────────────┘
```

**שני Clients:**
- **Browser client** (`supabase`) — `NEXT_PUBLIC_SUPABASE_ANON_KEY` — for public reads + RLS-protected writes
- **Service client** (`getServiceSupabase()`) — `SUPABASE_SERVICE_ROLE_KEY` — for API routes, bypasses RLS

### Spotify

```
DJ → /api/spotify/connect → Spotify OAuth → /api/spotify/callback
                                                    │
                                              Access Token
                                                    │
                             ┌──────────────────────┤
                             ▼                      ▼
                    /api/spotify/me/playlists   /api/spotify/playlist?id=xxx
                             │                      │
                             ▼                      ▼
                      List playlists          Get tracks
                                                    │
                                                    ▼
                                    /api/spotify/import/playlist
                                    (Import to songs table)
```

### Google Calendar

```
DJ → /api/gcal/connect → Google OAuth → /api/gcal/callback
                                              │
                                        Token stored in
                                        profiles.google_calendar_tokens
                                              │
                                    /api/gcal/sync { direction }
                                         │         │
                                   pull (GCal→DB)  push (DB→GCal)
```

### Twilio (SMS)

```
/api/auth/phone/send-otp
         │
    Production mode?
    ├── YES → Twilio API → SMS to phone
    └── NO  → Return OTP in response (dev mode)
```

### YouTube

```
SongTinder component
         │
    Song has external_link (YouTube URL)?
    ├── YES → Embed 30-sec iframe preview
    └── NO  → Show cover image only

/api/youtube/oembed?url=xxx → YouTube oEmbed API → thumbnail + title
```

---

## 10. Deployment

### Google Cloud Run (Primary)

```
GitHub (main branch)
         │ push
         ▼
┌─ GitHub Actions ─────────────┐
│ .github/workflows/           │
│ deploy-cloud-run.yml         │
│                              │
│ 1. Checkout                  │
│ 2. Auth to GCP               │
│    (Workload Identity)       │
│ 3. gcloud run deploy         │
│    --source . (build from    │
│     source, Dockerfile auto) │
│ 4. Set env vars from secrets │
└──────────┬───────────────────┘
           ▼
  Google Cloud Run
  Service: "compakt"
  Region: us-central1
  Port: $PORT
  Public access: allowed
```

**Environment Variables (Cloud Run):**
| Variable | Source |
|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | GitHub Secret |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | GitHub Secret |
| `SUPABASE_SERVICE_ROLE_KEY` | GitHub Secret |
| `SPOTIFY_CLIENT_ID` | GitHub Secret |
| `SPOTIFY_CLIENT_SECRET` | GitHub Secret |
| `GOOGLE_CLIENT_ID` | GitHub Secret |
| `GOOGLE_CLIENT_SECRET` | GitHub Secret |
| `GOOGLE_CALENDAR_REDIRECT_URI` | GitHub Secret |
| `NEXT_PUBLIC_APP_URL` | GitHub Secret |
| `NEXT_PUBLIC_GIT_SHA` | Auto (`github.sha`) |

### Netlify (Alternative)

```
netlify.toml:
  build command: npm run build
  publish: .next
  plugin: @netlify/plugin-nextjs
```

---

## 11. אבטחה ו-RLS

### Row Level Security (RLS)

כל הטבלאות מוגנות ב-RLS. הפוליסות מחולקות לשתי קבוצות:

#### טבלאות DJ (Owner-only writes)

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| `profiles` | Public | Own (`auth.uid = user_id`) | Own | Own |
| `songs` | Public | Own (`dj_id = get_my_profile_id()`) | Own | Own |
| `questions` | Public | Own | Own | Own |
| `upsells` | Public | Own | Own | Own |
| `dj_events` | Public | Own | Own | Own |
| `event_screenshots` | Public | Own | Own | Own |

> `get_my_profile_id()` — SECURITY DEFINER function שמחזירה את ה-profile ID של ה-user המחובר.

#### טבלאות זוג (Anonymous access)

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| `events` | Public | Open | Open | — |
| `answers` | Public | Open | — | — |
| `swipes` | Public | Open | — | — |
| `requests` | Public | Open | — | — |
| `event_sessions` | Public | Open | Open | — |
| `analytics_events` | Public | Open | — | — |

> טבלאות הזוג פתוחות כי הזוגות הם anonymous users (לא מחוברים ל-Supabase Auth).

### אימות

```
┌─────────────────────────────────────────────────┐
│                  Authentication                  │
│                                                 │
│  DJ/Admin:                                      │
│  ├── Supabase Auth (email/password)  [Primary]  │
│  ├── Supabase OAuth (Google/FB/Apple) [Primary] │
│  └── Legacy password ("compakt2024") [Fallback] │
│                                                 │
│  Couple:                                        │
│  └── Phone OTP (6-digit, 5-min expiry)          │
│      ├── Production: Twilio SMS                 │
│      └── Development: OTP in HTTP response      │
│                                                 │
│  API Routes:                                    │
│  └── Service Role Key (bypasses RLS)            │
│      Used by all /api/admin/* routes            │
└─────────────────────────────────────────────────┘
```

### Supabase Client Usage

| Context | Client | Key |
|---------|--------|-----|
| Browser (stores, components) | `supabase` (may be `null`) | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| API Routes (server-side) | `getServiceSupabase()` | `SUPABASE_SERVICE_ROLE_KEY` |

> **הערה:** ה-browser client יכול להיות `null` אם אין env vars (למשל בזמן build). כל שימוש בו צריך לבדוק `if (!supabase) return`.
