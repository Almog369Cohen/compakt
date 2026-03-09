# Environment Variables — Compakt

## Required Variables

| Variable | Client/Server | Where to get | Description |
|----------|:------------:|-------------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | **Client** (build-time) | Supabase → Settings → API → Project URL | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Client** (build-time) | Supabase → Settings → API → anon public | Browser-safe key (RLS enforced) |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server only** | Supabase → Settings → API → service_role | Bypasses RLS — **never expose to client** |
| `NEXT_PUBLIC_APP_URL` | **Client** (build-time) | Your domain | e.g. `http://localhost:3000` or `https://compakt-xxx.run.app` |

## Optional Variables

| Variable | Client/Server | Where to get | Description |
|----------|:------------:|-------------|-------------|
| `RESEND_API_KEY` | Server | [Resend Dashboard](https://resend.com/api-keys) | Couple email verification code delivery |
| `RESEND_FROM_EMAIL` | Server | Verified sender/domain in Resend | From address for couple verification emails |
| `OTP_DEV_MODE` | Server | Set manually in local/dev environments | When `true`, returns OTP in API responses instead of requiring Resend |
| `NEXT_PUBLIC_ALLOW_LEGACY_LOGIN` | **Client** (build-time) | Set manually | Enables the legacy password login button on `/admin` |
| `NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET` | **Client/Server** | Supabase Storage bucket name | Storage bucket used for DJ media uploads (defaults to `dj-media`) |
| `SPOTIFY_CLIENT_ID` | Server | [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) | Playlist import |
| `SPOTIFY_CLIENT_SECRET` | Server | Spotify Developer Dashboard | Playlist import |
| `GOOGLE_CLIENT_ID` | Server | [Google Cloud Console](https://console.cloud.google.com/apis/credentials) | Calendar sync |
| `GOOGLE_CLIENT_SECRET` | Server | Google Cloud Console | Calendar sync |
| `GOOGLE_CALENDAR_REDIRECT_URI` | Server | Your domain + `/api/gcal/callback` | Calendar OAuth callback |
| `GCS_BUCKET` | Server | Existing Google Cloud Storage bucket name | Used by `/api/uploads` for SongManager cover/audio uploads |

## Run Locally

```bash
# 1. Copy example and fill in real values
cp .env.local.example .env.local
# Edit .env.local with your Supabase credentials

# 2. Install dependencies
npm install

# 3. Run migrations (first time only)
# Open Supabase Dashboard → SQL Editor → run each file in order:
#   supabase/migrations/013_profiles_and_events.sql
#   supabase/migrations/014_events.sql
#   supabase/migrations/015_gcal_tokens.sql
#   supabase/migrations/016_phone_auth_and_analytics.sql
#   supabase/migrations/017_add_role_column.sql
#   supabase/migrations/018_hq_governance.sql
#   supabase/migrations/fix_run_this.sql

# 4. Start dev server
npm run dev

# 5. Verify
curl http://localhost:3000/api/health
# Should return: { "ok": true, "config": { "supabase_url_set": true, ... } }

# 6. Run auth smoke tests
bash scripts/verify-auth.sh
```

## Supabase Dashboard Checklist

1. **Authentication → Providers → Email**: Enabled ✅
2. **Authentication → Settings → Email confirmations**: OFF (for development)
3. **Authentication → URL Configuration**:
   - Site URL: `http://localhost:3000` (dev) or your production domain
   - Redirect URLs: add `http://localhost:3000/admin` and `https://<prod-domain>/admin`
4. **Storage**: Create bucket `dj-media` (public) — for image uploads
5. **Social providers** (optional): Google / Facebook / Apple — enable and add credentials in Providers tab

## Cloud Run / Production

`NEXT_PUBLIC_*` variables must be available at **build time** (not just runtime).
The workflow `.github/workflows/deploy-cloud-run.yml` handles this via `--build-env-vars`.

GitHub Secrets required (Settings → Secrets → Actions):
- `GCP_PROJECT_ID`
- `GCP_SA_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `SPOTIFY_CLIENT_ID` (optional)
- `SPOTIFY_CLIENT_SECRET` (optional)
- `GOOGLE_CLIENT_ID` (optional)
- `GOOGLE_CLIENT_SECRET` (optional)
- `GOOGLE_CALENDAR_REDIRECT_URI` (optional)
- `GCS_BUCKET` (optional, but required if you want SongManager file uploads)

Recommended production runtime configuration:
- `NEXT_PUBLIC_ALLOW_LEGACY_LOGIN` should be unset or `false`
- `OTP_DEV_MODE` should be unset or `false`
- Run `018_hq_governance.sql` before using `/hq` profile management or audit logs
- If using `/api/uploads`, create the GCS bucket first and grant the Cloud Run service account write access

## Security Notes

- `SUPABASE_SERVICE_ROLE_KEY` is **server-only** — used in `/api/*` routes via `getServiceSupabase()`
- Never import `getServiceSupabase` in client components or stores
- The browser client (`supabase` from `src/lib/supabase.ts`) uses the anon key and is RLS-restricted
