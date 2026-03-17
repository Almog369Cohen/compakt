# בדיקת מסעי לקוח מקצה לקצה - Compakt

תאריך: ${new Date().toISOString().split('T')[0]}
שעה: ${new Date().toTimeString().split(' ')[0]}

---

## ✅ תוצאות בדיקה

### 1. Health Check
**URL**: `http://localhost:3000/api/health`
**סטטוס**: ✅ עובד
**תגובה**:
```json
{
  "ok": true,
  "service": "compakt",
  "env": "development",
  "config": {
    "supabase_url_set": true,
    "supabase_anon_key_set": true,
    "supabase_service_key_set": true,
    "db_reachable": true,
    "db_error": null
  }
}
```

---

## 🔗 לינקים לבדיקה ידנית

### מסלול DJ/Admin

**1. דף התחברות**
```
http://localhost:3000/admin
```
**מה לבדוק**:
- [ ] טופס login מוצג
- [ ] שדות email + password
- [ ] כפתורי OAuth (Google, Facebook, Apple)
- [ ] קישור "שכחתי סיסמה"
- [ ] קישור הרשמה

**2. Dashboard (אחרי login)**
```
http://localhost:3000/admin
```
**מה לבדוק**:
- [ ] Dashboard נטען
- [ ] טאבים מוצגים (Dashboard, Couples, Events, Profile, Songs, Questions)
- [ ] כפתור logout
- [ ] Theme toggle

**3. יצירת אירוע**
```
http://localhost:3000/admin
→ טאב "אירועי DJ"
→ "צור אירוע"
```
**מה לבדוק**:
- [ ] טופס יצירת אירוע
- [ ] שמירה עובדת
- [ ] קבלת קישור לשיתוף
- [ ] העתקה ללוח

---

### מסלול Couples - חימום למכירה

**1. פרופיל DJ (בלי token)**
```
http://localhost:3000/dj/[slug]
```
*החלף [slug] ב-slug אמיתי*

**מה לבדוק**:
- [ ] פרופיל DJ נטען
- [ ] לוגו/שם עסק מוצג
- [ ] Bio מוצג
- [ ] שירים מומלצים (אם יש)
- [ ] רשתות חברתיות (Instagram, Spotify, וכו')
- [ ] גלריית תמונות (אם יש)
- [ ] **CTA ראשי**: "נתחיל עם ה-DJ הזה"
- [ ] שדה "מספר אירוע" לחזרה
- [ ] כפתור שיתוף
- [ ] כפתור WhatsApp (אם מוגדר)

**2. שאלון עם token**
```
http://localhost:3000/dj/[slug]?token=xxx
```
**מה לבדוק**:
- [ ] מעבר ישיר לשאלון (לא עובר דרך פרופיל)
- [ ] Email gate מוצג
- [ ] שליחת OTP עובדת
- [ ] אימות OTP עובד
- [ ] מעבר לשאלון
- [ ] שאלות נטענות
- [ ] בחירת שירים (Tinder-style)
- [ ] שמירה אוטומטית
- [ ] שליחה עובדת

**3. התחלת שאלון חדש (ללא token)**
```
http://localhost:3000/dj/[slug]?start=1
```
**מה לבדוק**:
- [ ] מעבר ישיר לשאלון
- [ ] Email gate
- [ ] שאלון מתחיל מההתחלה

**4. חזרה לשאלון**
```
http://localhost:3000/dj/[slug]?resume=1
```
**מה לבדוק**:
- [ ] Email gate
- [ ] טעינת מצב שמור
- [ ] המשך מאיפה שעצרו

---

### מסלול HQ (Staff/Owner)

**1. דף HQ**
```
http://localhost:3000/hq
```
**מה לבדוק**:
- [ ] דורש authentication
- [ ] דורש role staff/owner
- [ ] Dashboard מוצג
- [ ] רשימת משתמשים
- [ ] חיפוש וסינון
- [ ] Bulk actions

---

## 🐛 בעיות שנמצאו

### בעיה 1: ERR_CONNECTION_REFUSED
**סטטוס**: ✅ תוקן
**פתרון**: הרצת `npm run dev` מחדש
**שרver רץ על**: `http://localhost:3000`

---

## 📝 הערות

1. **Port**: השרver רץ על port 3000 (לא 3001)
2. **Health Check**: עובד מצוין - DB מחובר
3. **Environment**: Development mode
4. **Supabase**: מחובר ועובד

---

## ✅ סיכום

**מה עובד**:
- ✅ Health check
- ✅ Supabase connection
- ✅ Dev server

**מה צריך לבדוק ידנית**:
- [ ] Login flow
- [ ] Onboarding flow
- [ ] Event creation
- [ ] Couple questionnaire
- [ ] DJ profile (warming-up-for-sale)
- [ ] Resume flow

---

## 🔗 לינקים מעודכנים

**Admin**:
- http://localhost:3000/admin

**DJ Profile** (החלף [slug]):
- http://localhost:3000/dj/[slug]
- http://localhost:3000/dj/[slug]?start=1
- http://localhost:3000/dj/[slug]?resume=1
- http://localhost:3000/dj/[slug]?token=xxx

**HQ**:
- http://localhost:3000/hq

**Health**:
- http://localhost:3000/api/health

---

**עודכן**: ${new Date().toISOString()}
