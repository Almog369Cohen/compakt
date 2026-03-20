# מדריך הגדרה - Spotify Guest Playlist Integration

## מה אתה צריך לעשות מהצד שלך

### 1. הגדרת Spotify Developer App

#### שלב א': יצירת/עדכון Spotify App
1. היכנס ל-[Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. אם יש לך כבר App לפרויקט - לחץ עליו, אחרת לחץ "Create App"
3. הגדרות חשובות:
   - **App Name**: Compakt DJ Platform (או כל שם שתרצה)
   - **App Description**: Music preference collection for wedding DJs
   - **Redirect URIs**: הוסף את כל אלה (HTTPS בלבד לפי הדרישות החדשות של Spotify):
     ```
     http://127.0.0.1:3003/api/spotify/callback
     http://127.0.0.1:3003/api/guest/spotify/callback
     https://compakt-453296955394.us-central1.run.app/api/spotify/callback
     https://compakt-453296955394.us-central1.run.app/api/guest/spotify/callback
     ```
     **חשוב**: Spotify הפסיקה לתמוך ב-HTTP redirect URIs (חוץ מ-localhost). חייב להשתמש ב-127.0.0.1 במקום localhost.
   - **APIs used**: Web API
   - סמן את התיבה: "I understand and agree to Spotify's Developer Terms of Service and Design Guidelines"

4. לחץ "Save"
5. לחץ על "Settings" בצד שמאל
6. העתק את:
   - **Client ID**
   - **Client Secret** (לחץ "View client secret")

#### שלב ב': עדכון משתני סביבה

עדכן את הקובץ `.env.local` (אם אין לך - צור אותו):

```bash
# Spotify - עדכן עם הערכים שהעתקת
SPOTIFY_CLIENT_ID=your_client_id_here
SPOTIFY_CLIENT_SECRET=your_client_secret_here

# Spotify Token Encryption - צור מפתח אקראי
SPOTIFY_TOKEN_ENCRYPTION_KEY=your_32_byte_hex_key_here
```

**איך ליצור SPOTIFY_TOKEN_ENCRYPTION_KEY:**

הרץ בטרמינל:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

העתק את התוצאה ל-`SPOTIFY_TOKEN_ENCRYPTION_KEY`

### 2. עדכון GitHub Secrets (לפרודקשן)

1. עבור ל-[GitHub Repository Settings](https://github.com/YOUR_USERNAME/compakt/settings/secrets/actions)
2. הוסף/עדכן את ה-Secrets הבאים:
   - `SPOTIFY_CLIENT_ID` - הערך מ-Spotify Dashboard
   - `SPOTIFY_CLIENT_SECRET` - הערך מ-Spotify Dashboard
   - `SPOTIFY_TOKEN_ENCRYPTION_KEY` - המפתח שיצרת

### 3. הרצת המיגרציה בסופאבייס

1. היכנס ל-[Supabase Dashboard](https://supabase.com/dashboard)
2. בחר את הפרויקט שלך
3. לך ל-**SQL Editor** (בתפריט צד שמאל)
4. לחץ "New query"
5. העתק והדבק את הקובץ `supabase/migrations/025_spotify_guest_integration.sql` (אני אכין אותו)
6. לחץ "Run" (או Ctrl+Enter)
7. ודא שאין שגיאות

### 4. בדיקה לוקלית

אחרי שאני אסיים את הקוד:

```bash
# התחל את השרת המקומי
npm run dev

# פתח בדפדפן:
# 1. התחבר כמנהל: http://localhost:3000/admin
# 2. לך לטאב "אורחים" (חדש)
# 3. צור הזמנה לאורח עם המייל שלך
# 4. העתק את הלינק ופתח בטאב חדש
# 5. לחץ "התחבר עם Spotify"
# 6. אשר את ההרשאות ב-Spotify
# 7. ודא שאתה רואה "תודה! הפלייליסטים שלך נשמרו"
```

### 5. Spotify Extended Quota (אופציונלי - רק אם יש >25 משתמשים)

אם תעבור 25 משתמשים ייחודיים (אורחים + דייג'ים), תצטרך:

1. ב-Spotify Developer Dashboard → לחץ על ה-App שלך
2. לחץ "Request Extension"
3. מלא את הטופס:
   - **Use case**: Wedding DJ platform collecting guest music preferences
   - **Expected users**: 100-500 (או כמה שאתה מצפה)
4. זה לוקח בדרך כלל 3-5 ימי עבודה לאישור

---

## Timeline

אני אתחיל לעבוד על הקוד עכשיו בסדר הבא:

1. **מיגרציית DB** (10 דקות)
2. **API routes לאורחים** (30 דקות)
3. **UI לדף אורח** (20 דקות)
4. **API ניתוח מוזיקלי** (30 דקות)
5. **UI מנהל - טאב אורחים** (40 דקות)
6. **UI מנהל - ניתוח מוזיקלי** (30 דקות)

**סה"כ**: ~2.5 שעות עבודה

אתה יכול לעבוד במקביל על:
- הגדרת Spotify App (5 דקות)
- עדכון .env.local (2 דקות)
- עדכון GitHub Secrets (3 דקות)

ברגע שאני אסיים את המיגרציה - תוכל להריץ אותה בסופאבייס.

---

## שאלות נפוצות

**ש: מה אם אין לי Spotify Developer Account?**
ת: צור אחד חינם ב-https://developer.spotify.com - זה לוקח דקה.

**ש: האם צריך Spotify Premium?**
ת: לא, Spotify Free מספיק גם לדייג'י וגם לאורחים.

**ש: מה קורה אם אורח לא רוצה לחבר Spotify?**
ת: זה אופציונלי לחלוטין. הניתוח יעבוד עם כמה אורחים שמתחברים.

**ש: הנתונים של האורחים מאוחסנים איפה?**
ת: ב-Supabase שלך, מוצפנים. אפשר למחוק בכל רגע.
