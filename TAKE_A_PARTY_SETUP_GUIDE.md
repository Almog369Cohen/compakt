# 🎵 Take a Party - מדריך הגדרה מלא

## 🚀 סטטוס נוכחי: 90% הושלם

הקוד מוכן, הטבלאות בסופאבייס קיימות, כל מה שנשאר הוא להגדיר את Spotify.

---

## 📋 תוכן עניינים

1. [שלב 1: יצירת Spotify Developer App](#שלב-1-יצירת-spotify-developer-app)
2. [שלב 2: הגדרת Environment Variables](#שלב-2-הגדרת-environment-variables)
3. [שלב 3: הפעלה ובדיקה](#שלב-3-הפעלה-ובדיקה)
4. [שלב 4: פריסה לפרודקשן](#שלב-4-פריסה-לפרודקשן)
5. [פתרון בעיות](#פתרון-בעיות)

---

## 🔧 שלב 1: יצירת Spotify Developer App

### 1.1 פתח את Spotify Developer Dashboard
👉 [https://developer.spotify.com/dashboard](https://developer.spotify.com/dashboard)

### 1.2 צור אפליקציה חדשה
1. לחץ על **"Create App"**
2. מלא את הפרטים:
   - **App Name**: `Compakt DJ Platform`
   - **App Description**: `Music preference collection for wedding DJs`
   - **Website**: `https://compakt-453296955394.us-central1.run.app`
   - **APIs used**: `Web API`

### 1.3 הגדרת Redirect URIs (חשוב מאוד!)
בטאב **"Settings"**, הוסף את כתובות אלה **בדיוק כפי שכתוב**:

```
http://127.0.0.1:3003/api/spotify/callback
http://127.0.0.1:3003/api/guest/spotify/callback
https://compakt-453296955394.us-central1.run.app/api/spotify/callback
https://compakt-453296955394.us-central1.run.app/api/guest/spotify/callback
```

**⚠️ חשוב**: השתמש ב-`127.0.0.1` ולא ב-`localhost`!

### 1.4 קבל את המפתחות
באותו דף Settings, העתק:
- **Client ID** 👈 [לחץ כאן להעתקה](javascript:navigator.clipboard.writeText('paste_your_client_id_here'))
- **Client Secret** 👈 [לחץ כאן להעתקה](javascript:navigator.clipboard.writeText('paste_your_client_secret_here'))

---

## 🔧 שלב 2: הגדרת Environment Variables

### 2.1 פתח את קובץ הסביבה
👉 [פתח .env.local](file:///Users/almogcohen/repos/compakt/.env.local)

### 2.2 הוסף את פרטי Spotify
בסוף הקובץ, החלף את השורות הריקות:

```bash
# Spotify - Take a Party Integration
SPOTIFY_CLIENT_ID=your_client_id_here
SPOTIFY_CLIENT_SECRET=your_client_secret_here
SPOTIFY_TOKEN_ENCRYPTION_KEY=f64db6119e3a09274a42d49b4ad59e1c6d68d50e0844a322d0c7fa594669910c
```

**📝 העתק הדבקה מהירה:**
```bash
SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=
```

### 2.3 שמור את הקובץ
לחץ `Ctrl+S` או `Cmd+S`

---

## 🚀 שלב 3: הפעלה ובדיקה

### 3.1 הפעל את השרת
```bash
npm run dev
```

### 3.2 בדיקת חיבור Spotify
👉 [פתח את האפליקציה](http://localhost:3003)

### 3.3 מבחן 1: חיבור דייג'י
1. לחץ **"התחבר כמנהל"**
2. סיסמה: `compakt2024`
3. בטאב **"Songs"**, לחץ **"חבר עם Spotify"**
4. ודא שעובר ל-Spotify וחוזר

### 3.4 מבחן 2: זוג מוסיף אורחים
1. [צור אירוע חדש](http://localhost:3003)
2. מלא פרטים ועבור את כל השלבים
3. בשלב 5 **"🎵 אורחים"**, לחץ **"הוסף אורחים"**
4. הכנס מיילים ולחץ **"הוסף"**

### 3.5 מבחן 3: אורח מתחבר
1. העתק לינק מרשימת האורחים
2. פתח את הלינק בטאב חדש
3. בחר **🎵 פלייליסטים** או **⭐ Top 50**
4. לחץ **"התחבר עם Spotify"**
5. התחבר ובחר פלייליסטים

### 3.6 מבחן 4: ניתוח ופלייליסט
1. חזור ל-[ממשק המנהל](http://localhost:3003/admin)
2. טאב **"guest-stats"**
3. ראה את הסטטיסטיקות
4. לחץ **"צור פלייליסט Spotify"**
5. ודא שהפלייליסט נפתח ב-Spotify

---

## 🌐 שלב 4: פריסה לפרודקשן

### 4.1 הגדרת GitHub Secrets
👉 [פתח GitHub Secrets](https://github.com/Almog369Cohen/compakt/settings/secrets/actions)

הוסף את ה-Secrets הבאים:
- `SPOTIFY_CLIENT_ID` - הכנס את ה-Client ID
- `SPOTIFY_CLIENT_SECRET` - הכנס את ה-Client Secret
- `SPOTIFY_TOKEN_ENCRYPTION_KEY` - הכנס: `f64db6119e3a09274a42d49b4ad59e1c6d68d50e0844a322d0c7fa594669910c`

### 4.2 הפעלת דיפלוי
👉 [פתח GitHub Actions](https://github.com/Almog369Cohen/compakt/actions)

לחץ על **"Deploy to Production"**

---

## 🚨 פתרון בעיות

### בעיה: "Invalid redirect_uri"
**סימפטום**: Spotify מחזיר שגיאת redirect  
**פתרון**: ודא שה-Redirect URIs ב-Spotify Dashboard מכילים בדיוק את 4 הכתובות מהמדריך

### בעיה: "Missing client credentials"  
**סימפטום**: שגיאת 500 בהתחברות  
**פתרון**: בדוק ש-SPOTIFY_CLIENT_ID ו-SPOTIFY_CLIENT_SECRET מוגדרים ב-.env.local

### בעיה: "Table not found"
**סימפטום**: שגיאת בסיס נתונים  
**פתרון**: הרץ `node scripts/check-guest-tables.mjs` לבדיקת טבלאות

### בעיה: הכל עובד אבל אין נתונים
**סימפטום**: ריק בסטטיסטיקות  
**פתרון**: ודא שהרצת את המיגרציה בסופאבייס

---

## 📞 עזרה ותמיכה

### קבצים חשובים:
- 📄 [תיעוד Spotify](docs/SPOTIFY_GUEST_SETUP.md)
- 📄 [צ'קליסט הגדרה](SPOTIFY_SETUP_CHECKLIST.md)
- 📄 [עדכון אבטחה 2026](SPOTIFY_SECURITY_UPDATE_2026.md)

### בדיקות מהירות:
```bash
# בדיקת טבלאות סופאבייס
node scripts/check-guest-tables.mjs

# בדיקת בילד
npm run build

# הפעלת שרת
npm run dev
```

---

## 🎉 סיום

אחרי שתסיים את כל השלבים:
- ✅ Take a Party מוכן לפרודקשן
- ✅ כל הפיצ'רים עובדים
- ✅ תוכל לשלוח ללקוחות

**זמן השלמה משוער**: 10-15 דקות

---

## 📈 מה אחרי ההגדרה?

### פיצ'רים מוכנים:
- ✅ ניהול אורחים לזוגות
- ✅ בחירת פלייליסטים או Top 50
- ✅ ניתוח מוזיקלי מצטבר
- ✅ יצירת פלייליסט Spotify אוטומטית
- ✅ סנכרון נתונים בלחיצת כפתור

### הצעדים הבאים (אופציונלי):
- 🔧 WhatsApp integration (לשליחת לינקים)
- 🔧 תזכורות אוטומטיות
- 🔧 ייצוא ל-Spotify עם Write permissions

**בהצלחה! 🎵**
