# 🎉 מערכת מנויים פשוטה - מוכן לפיילוט!

הפתרון הכי פשוט ויציב למערכת מנויים עם trial אוטומטי.

---

## ✅ מה בנינו?

### Backend (API Routes):
1. **`/api/auth/signup`** - הרשמה פשוטה עם trial אוטומטי (7 ימים)
2. **`/api/payments/create-link`** - יצירת לינק תשלום במורנינג
3. **`/api/hq/subscriptions`** - רשימת מנויים (staff/owner)
4. **`/api/hq/subscriptions/[id]/approve`** - אישור תשלום ידני
5. **`/api/hq/subscriptions/[id]/extend`** - הארכת מנוי

### Frontend (דפים):
1. **`/pricing`** - דף מחירון מעודכן (₪55/89/150)
2. **`/signup`** - דף הרשמה פשוט (3 שדות בלבד)
3. **`UpgradePrompt`** - קומפוננטה להתראות trial
4. **`SubscriptionsTab`** - ניהול מנויים ב-HQ

### Database:
1. **Migration 026** - טבלאות subscriptions + events
2. **פונקציות SQL** - create_subscription_from_coupon, convert_trial_to_paid, check_expired_subscriptions

---

## 🚀 הוראות הפעלה

### שלב 1: הרצת Migration

1. פתח את Supabase Dashboard:
   ```
   https://supabase.com/dashboard/project/rgfajvnkrszwksiidspm/editor
   ```

2. לחץ על SQL Editor (בצד שמאל)

3. העתק והדבק את כל התוכן מהקובץ:
   ```
   supabase/migrations/026_subscriptions_system.sql
   ```

4. לחץ "Run" (או Ctrl/Cmd + Enter)

5. אמת שהטבלאות נוצרו:
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('subscriptions', 'subscription_events');
   ```

### שלב 2: הגדרת Environment Variables

הוסף ל-`.env.local`:

```env
# Morning (Green Invoice) API
MORNING_API_KEY=your-api-key-here
MORNING_API_URL=https://api.greeninvoice.co.il/api/v1

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**איך לקבל API Key של מורנינג:**
1. היכנס ל-https://app.greeninvoice.co.il
2. הגדרות → API
3. צור מפתח API חדש
4. העתק את המפתח

### שלב 3: הרצת השרת

```bash
npm run dev
```

---

## 🎯 Flow מלא למשתמש

### הרשמה:
1. משתמש נכנס ל-`/pricing`
2. לוחץ "נסו חינם 7 ימים" על Pro (₪55)
3. מועבר ל-`/signup?plan=pro`
4. ממלא: אימייל, שם עסק, סיסמה
5. לוחץ "התחל עכשיו"
6. **מקבל גישה מיידית ל-7 ימי trial!**
7. מועבר ל-`/onboarding`

### Trial (ימים 1-7):
- משתמש במערכת בחינם
- ביום 5: רואה התראה "נשארו 2 ימים"
- יכול ללחוץ "שדרג עכשיו" → לינק תשלום מורנינג

### תשלום:
1. משתמש לוחץ "שדרג עכשיו"
2. מועבר ללינק תשלום במורנינג
3. משלם ₪55 בכרטיס אשראי
4. מורנינג שולח לך אימייל: "תשלום התקבל"

### אישור (אתה):
1. נכנס ל-`/hq` → טאב Subscriptions
2. רואה את המשתמש עם סטטוס "trial"
3. לוחץ "אשר תשלום"
4. מזין מספר אסמכתא מהאימייל של מורנינג
5. **המנוי מוארך ל-30 יום אוטומטית!**

### אחרי 7 ימים (אם לא שילם):
- Cron job בודק אוטומטית
- Subscription: status = trial_expired
- Profile: plan = starter (free)
- משתמש חוזר ל-2 אירועים בחודש

---

## 🛠️ ניהול ב-HQ

### טאב Subscriptions:

**התראות:**
- 🔴 X trials מסתיימים היום
- 🟡 Y trials מסתיימים בעוד 3 ימים

**טבלה:**
| שם עסק | Plan | סטטוס | נשארו | תשלום | פעולות |
|---------|------|--------|-------|--------|---------|
| DJ Mike | Pro | trial | 2 ימים | - | [אשר תשלום] |
| DJ Sara | Premium | active | 25 ימים | REF-123 | [הארך] |

**פילטרים:**
- הכל
- ניסיון
- פעיל
- פג תוקף

**פעולות:**
- **אשר תשלום** - ממיר trial למנוי משלם (30 יום)
- **הארך** - מוסיף ימים למנוי קיים

---

## 📊 סטטיסטיקות

בתחתית הטאב:
- **ניסיון**: כמה משתמשים ב-trial
- **פעיל**: כמה מנויים פעילים
- **מסתיים בקרוב**: כמה trials מסתיימים ב-3 ימים הקרובים
- **פג תוקף**: כמה מנויים פגו

---

## 🧪 בדיקות

### בדיקה 1: הרשמה חדשה
```
1. פתח http://localhost:3000/pricing
2. לחץ "נסו חינם 7 ימים" על Pro
3. מלא פרטים והירשם
4. ודא שהגעת ל-/onboarding
5. בדוק ב-HQ → Subscriptions שהמשתמש מופיע עם status: trial
```

### בדיקה 2: אישור תשלום
```
1. היכנס ל-HQ → Subscriptions
2. מצא משתמש עם status: trial
3. לחץ "אשר תשלום"
4. הזן מספר אסמכתא: TEST-123
5. ודא שהסטטוס השתנה ל-active
6. ודא שה-expires_at הוא +30 ימים מהיום
```

### בדיקה 3: התראת Trial
```
1. צור משתמש חדש
2. עדכן ידנית ב-Supabase את trial_ends_at ל-2 ימים מהיום
3. רענן את הדף
4. ודא שמופיעה התראה "נשארו 2 ימים"
```

---

## 📝 TODO לפני Launch Production

### Technical:
- [ ] הרץ migration 026 ב-production Supabase
- [ ] הגדר MORNING_API_KEY ב-production env
- [ ] הגדר NEXT_PUBLIC_APP_URL לדומיין האמיתי
- [ ] הגדר Cron job ב-Vercel/Railway (daily)

### Content:
- [ ] כתוב email template ל-"trial ending"
- [ ] כתוב email template ל-"subscription activated"
- [ ] עדכן תנאי שימוש + מדיניות ביטולים
- [ ] הכן FAQ למשתמשים

### Testing:
- [ ] בדוק הרשמה חדשה
- [ ] בדוק אישור תשלום
- [ ] בדוק הארכת מנוי
- [ ] בדוק trial expiry
- [ ] בדוק את כל הדפים במובייל

---

## 🎨 מה נראה מקצועי?

1. **דף Pricing** - עיצוב נקי כמו Notion
2. **דף Signup** - 3 שדות בלבד, פשוט ומהיר
3. **Trial אוטומטי** - ללא כרטיס אשראי
4. **התראות** - countdown ברור
5. **HQ Dashboard** - ניהול נוח עם פילטרים
6. **תשלום** - לינק רשמי ממורנינג

---

## 💰 מחירון סופי

- **Free**: ₪0/חודש - 2 אירועים
- **Pro**: ₪55/חודש - 7 ימי trial חינם
- **Premium**: ₪89/חודש - 7 ימי trial חינם
- **Enterprise**: ₪150/חודש - 7 ימי trial חינם

---

## 🚀 מוכן ל-Launch!

**מה יש לך עכשיו:**
- ✅ מערכת פשוטה ויציבה
- ✅ Trial אוטומטי
- ✅ ניהול נוח ב-HQ
- ✅ אינטגרציה עם מורנינג
- ✅ נראה מקצועי

**הצעד הבא:**
1. הרץ את migration 026
2. הגדר MORNING_API_KEY
3. בדוק עם 2-3 משתמשי test
4. **Launch לפיילוט עם 10 דיג'יס!**

---

## 📞 תמיכה

אם יש בעיה:
1. בדוק שה-migration רץ
2. בדוק שיש MORNING_API_KEY
3. בדוק logs ב-console
4. בדוק טבלת subscription_events ב-Supabase

**בהצלחה! 🎉**
