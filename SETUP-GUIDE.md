# 🎧 מדריך הגדרה - Compakt

## מה צריך לעשות (4 שלבים)

---

## שלב 1: הגדרת Supabase (5 דקות)

### 1.1 — אם אין לך פרויקט Supabase עדיין:
1. לכו ל: **https://supabase.com/dashboard**
2. לחצו **New Project**
3. שם: `compakt`
4. סיסמה: בחרו סיסמה חזקה (שמרו אותה!)
5. Region: `eu-central-1` (אירופה) או `us-east-1`
6. לחצו **Create new project**

### 1.2 — העתיקו את המפתחות:
1. לכו ל: **Project Settings → API** (בתפריט הצדדי למטה)
2. העתיקו את שלושת הערכים הבאים:
   - **Project URL** — זה ה-`NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key — זה ה-`NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key — זה ה-`SUPABASE_SERVICE_ROLE_KEY`

### 1.3 — צרו קובץ `.env.local`:
בתיקיית הפרויקט, צרו קובץ חדש בשם `.env.local` והדביקו:

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ_YOUR_ANON_KEY_HERE
SUPABASE_SERVICE_ROLE_KEY=eyJ_YOUR_SERVICE_ROLE_KEY_HERE
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> ⚠️ החליפו את הערכים עם מה שהעתקתם מ-Supabase!

---

## שלב 2: הרצת Migrations (3 דקות)

### מה זה עושה?
יוצר את כל הטבלאות בדאטאבייס: profiles, events, songs, questions, upsells, answers, swipes, requests, event_screenshots

### איך?
1. לכו ל-Supabase Dashboard → **SQL Editor** (בתפריט הצדדי)
2. לחצו **New Query**
3. הריצו את שלושת הקבצים **בסדר הזה**, אחד אחרי השני:

   | # | קובץ | מה עושה |
   |---|---|---|
   | 1 | `supabase/migrations/013_profiles_and_events.sql` | טבלאות בסיס (profiles, songs, events, וכו') |
   | 2 | `supabase/migrations/014_events.sql` | טבלת אירועים + צילומי מסך עם RLS |
   | 3 | `supabase/migrations/015_gcal_tokens.sql` | עמודת Google Calendar tokens + אינדקס |

4. לכל קובץ: פתחו → העתיקו הכל → הדביקו ב-SQL Editor → **Run** (כפתור ירוק)
5. תראו הודעת Success ✅ לכל אחד

---

## שלב 3: הפעלת Auth + Social Login (5 דקות)

### 3.1 — Email Auth:
1. Supabase Dashboard → **Authentication** (בתפריט הצדדי)
2. **Providers** (בתפריט העליון)
3. וודאו ש-**Email** מופעל (enabled) — בדרך כלל הוא כבר מופעל כברירת מחדל
4. מומלץ: כבו את **Confirm email** בשביל פיתוח (אפשר להדליק מחדש בפרודקשן)
   - Authentication → Settings → **Enable email confirmations** → כבוי

### 3.2 — Social Login (אופציונלי):
כדי להפעיל כניסה עם Google / Facebook / Apple:

1. **Google**: Supabase → Auth → Providers → Google → הפעילו ← הדביקו Client ID + Secret מ-[Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. **Facebook**: Supabase → Auth → Providers → Facebook → הפעילו ← הדביקו App ID + Secret מ-[Meta Developers](https://developers.facebook.com/)
3. **Apple**: Supabase → Auth → Providers → Apple → הפעילו ← הגדירו לפי [מדריך Supabase](https://supabase.com/docs/guides/auth/social-login/auth-apple)

> 💡 כל provider הוא אופציונלי. הכפתורים יעבדו רק אחרי ההגדרה ב-Supabase.

---

## שלב 3.5: יצירת Storage Bucket (1 דקה)

1. Supabase Dashboard → **Storage** (בתפריט הצדדי)
2. לחצו **New bucket**
3. שם: `dj-media`
4. סמנו **Public bucket** ✅
5. לחצו **Create bucket**

> 📸 ה-bucket הזה משמש להעלאת תמונות גלריה וצילומי מסך WhatsApp

---

## שלב 4: תיקון GitHub Actions Deploy (5 דקות)

### 4.1 — בדקו את ה-Service Account Email ב-GCP:
1. לכו ל: **https://console.cloud.google.com/iam-admin/serviceaccounts?project=compakt-488215**
2. חפשו את ה-Service Account שנקרא `github-cloudrun-deployer`
3. **העתיקו את ה-Email המלא** — זה נראה כך:
   ```
   github-cloudrun-deployer@compakt-488215.iam.gserviceaccount.com
   ```

### 4.2 — עדכנו את ה-GitHub Secrets:
1. לכו ל: **https://github.com/Almog369Cohen/compakt/settings/secrets/actions**
2. עדכנו/צרו את ה-Secrets הבאים:

| Secret Name | ערך |
|---|---|
| `GCP_PROJECT_ID` | `compakt-488215` |
| `GCP_SERVICE_ACCOUNT_EMAIL` | ה-Email מסעיף 4.1 (העתקה מדויקת!) |
| `GCP_WORKLOAD_IDENTITY_PROVIDER` | ה-Provider שהגדרתם (פורמט: `projects/453296955394/locations/global/workloadIdentityPools/...`) |
| `NEXT_PUBLIC_APP_URL` | `https://compakt-219831650310.us-central1.run.app` |
| `NEXT_PUBLIC_SUPABASE_URL` | אותו ערך מ-`.env.local` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | אותו ערך מ-`.env.local` |
| `SUPABASE_SERVICE_ROLE_KEY` | אותו ערך מ-`.env.local` |
| `SPOTIFY_CLIENT_ID` | (אופציונלי) מ-Spotify Developer Dashboard |
| `SPOTIFY_CLIENT_SECRET` | (אופציונלי) מ-Spotify Developer Dashboard |
| `GOOGLE_CLIENT_ID` | (אופציונלי) מ-Google Cloud Console — לסנכרון Calendar |
| `GOOGLE_CLIENT_SECRET` | (אופציונלי) מ-Google Cloud Console |
| `GOOGLE_CALENDAR_REDIRECT_URI` | `https://YOUR_DOMAIN/api/gcal/callback` |

### 4.3 — הפעילו מחדש את ה-Deploy:
1. לכו ל: **https://github.com/Almog369Cohen/compakt/actions**
2. לחצו על הריצה האחרונה שנכשלה
3. לחצו **Re-run all jobs**

---

## בדיקה שהכל עובד ✅

### לוקאלי:
```bash
npm run dev
```
- דף הבית: http://localhost:3000
- אדמין: http://localhost:3000/admin
- Health: http://localhost:3000/api/health
- פרופיל DJ (אחרי הגדרה): http://localhost:3000/dj/YOUR_SLUG

### בפרודקשן (אחרי deploy):
- Health: https://compakt-219831650310.us-central1.run.app/api/health
- צריך להחזיר: `{"ok":true,"sha":"..."}` עם ה-SHA האחרון מ-GitHub

---

## שאלות נפוצות

**ש: אני מקבל שגיאה "Gaia id not found for email" ב-GitHub Actions**
ת: ה-`GCP_SERVICE_ACCOUNT_EMAIL` לא נכון. העתיקו את ה-Email **המדויק** מ-GCP Console.

**ש: הלוגין עם אימייל לא עובד**
ת: וודאו שה-`.env.local` מוגדר נכון עם מפתחות Supabase. אם עדיין לא עובד, השתמשו בכניסה עם "סיסמת מנהל" (compakt2024).

**ש: ה-DJ Profile page מראה "הדף לא נמצא"**
ת: קודם הגדירו פרופיל ב-Admin → Profile → הגדירו slug → שמרו. אחר כך גשו ל-`/dj/YOUR_SLUG`.
