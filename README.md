# Compakt — המסע המוזיקלי שלכם

Mobile-first Hebrew RTL web app for DJ clients (weddings/events) to coordinate music through a fun guided journey.

## Quick Start

```bash
npm install
npm run dev        # → http://localhost:3000
npm run build      # production build
```

## Routes

| Route | Description |
|-------|-------------|
| `/` | Client journey (Event Setup → Questions → Song Tinder → Dreams → Music Brief) |
| `/admin` | Back-office (Song Library, Questions, Upsells). Password: `compakt2024` |

## Stack

- **Next.js 14** (App Router) + TypeScript
- **Tailwind CSS** + CSS custom properties (glassmorphism themes)
- **Framer Motion** (swipe physics, modal transitions)
- **Zustand** (persisted state — localStorage)
- **Lucide React** (icons)

## Themes

- **Night Glass** (dark premium) — default
- **Day Glass** (light premium)
- Toggle via sun/moon button (top-left)

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Main client journey
│   ├── admin/page.tsx        # Admin back-office
│   ├── layout.tsx            # RTL Hebrew layout
│   └── globals.css           # Theme tokens + glass utilities
├── components/
│   ├── stages/
│   │   ├── EventSetup.tsx    # Stage 0: Event creation + magic link
│   │   ├── QuestionFlow.tsx  # Stage 1: One-question-per-card modal
│   │   ├── SongTinder.tsx    # Stage 2: Swipe cards + reason chips
│   │   ├── DreamsRequests.tsx# Stage 3: Requests, do/don't, links, upsells
│   │   └── MusicBrief.tsx    # Stage 4: Summary + PDF export
│   ├── admin/
│   │   ├── SongManager.tsx   # CRUD songs table + modal
│   │   ├── QuestionManager.tsx # CRUD questions + type templates
│   │   └── UpsellManager.tsx # CRUD upsell cards
│   └── ui/
│       ├── ThemeToggle.tsx   # Night/Day switch
│       └── StageNav.tsx      # Progress navigation
├── data/
│   ├── songs.ts              # Mock song library (12 songs)
│   ├── questions.ts          # Default wedding questions (7)
│   └── upsells.ts            # Sample upsell offerings (4)
├── stores/
│   ├── eventStore.ts         # Client journey state (persisted)
│   └── adminStore.ts         # Admin CRUD state (persisted)
└── lib/
    ├── types.ts              # TypeScript interfaces
    └── utils.ts              # cn(), generateMagicToken(), formatDate()
```

## Brand Colors

| Color | Hex | Usage |
|-------|-----|-------|
| Blue | `#059cc0` | Primary accent, CTAs |
| Green | `#03b28c` | Success, likes |
| Gray | `#1f1f21` | Dark surfaces |
| White | `#ffffff` | Light surfaces |

## Phase Plan

- **Phase 1 (current)**: Full client flow + admin + mock data
- **Phase 2**: Supabase DB + multi-DJ SaaS + Spotify embeds
- **Phase 3**: Billing (Stripe) + AI taste analysis
