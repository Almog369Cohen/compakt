# מפת מסעי לקוח - Compakt

## 🎯 שני מסלולים נפרדים

---

## 1️⃣ מסלול DJ/Admin - Onboarding עסקי

### נקודת כניסה
`/admin` - דף התחברות

### המסע (צעד אחר צעד)

#### שלב 1: Authentication
**קובץ**: `src/app/admin/page.tsx`
- Login/Signup עם email + password
- OAuth (Google, Facebook, Apple)
- Password recovery

**מטרה**: אימות זהות DJ

---

#### שלב 2: Onboarding (משתמשים חדשים)
**קובץ**: `src/components/onboarding-v2/OnboardingFlowV2.tsx`

**תנאי להצגה**:
```typescript
const shouldShowOnboarding = 
  isAuthenticated && 
  !onboardingComplete && 
  !profile.businessName && 
  songs.length === 0 && 
  questions.length === 0;
```

**שלבי Onboarding**:
1. ברוכים הבאים
2. הגדרת פרופיל עסקי (שם עסק, טלפון, וכו')
3. בחירת שירים ראשוניים
4. הגדרת שאלות ראשוניות
5. סיום - מעבר ל-Dashboard

**מטרה**: הכנת DJ לעבודה עם המערכת

---

#### שלב 3: Dashboard (משתמשים קיימים)
**קובץ**: `src/app/admin/page.tsx`

**טאבים זמינים**:
- Dashboard - סקירה כללית
- Couples - ניהול שאלוני זוגות
- Events - ניהול אירועים
- Profile - עריכת פרופיל
- Songs - ניהול שירים
- Questions - ניהול שאלות
- Analytics - אנליטיקות (אם זמין)

**מטרה**: ניהול שוטף של העסק

---

#### שלב 4: יצירת אירוע
**קובץ**: `src/components/admin/EventsManager.tsx`

**תהליך**:
1. לחיצה על "צור אירוע"
2. מילוי פרטי אירוע
3. קבלת קישור לשאלון
4. שיתוף עם זוג

**מטרה**: יצירת נקודת כניסה לזוגות

---

## 2️⃣ מסלול Couples - חימום למכירה

### נקודת כניסה
`/dj/[slug]?token=xxx` - קישור מהדיג'יי

### המסע (צעד אחר צעד)

#### שלב 1: Landing Page
**קובץ**: `src/app/dj/[slug]/page.tsx`

**לוגיקה**:
```typescript
// אם יש token - מעבר ישיר לשאלון
if (token) {
  return <JourneyApp initialToken={token} />
}

// אם אין token - הצגת פרופיל DJ
return <DJProfilePreview profile={profile} mode="public" />
```

**מטרה**: 
- **עם token**: התחלת שאלון
- **בלי token**: חשיפה לדיג'יי (חימום למכירה)

---

#### שלב 2: פרופיל DJ (אם אין token)
**קובץ**: `src/components/dj/DJProfilePreview.tsx`

**מה הזוג רואה**:
- שם העסק
- תמונה
- ביו
- שירים מומלצים
- קישורים לרשתות חברתיות (Spotify, Instagram)
- גלריית תמונות
- המלצות

**מטרה**: **חימום למכירה** - הזוג מתרשם מהדיג'יי

**CTA**: כפתור "התחל שאלון" (אם יש token)

---

#### שלב 3: Email Gate
**קובץ**: `src/components/journey/JourneyApp.tsx`

**תהליך**:
1. הזוג מזין email
2. שליחת OTP
3. אימות OTP
4. שמירת session

**מטרה**: זיהוי הזוג + יכולת לחזור

---

#### שלב 4: שאלון
**קובץ**: `src/components/journey/JourneyApp.tsx`

**שלבי השאלון**:
1. שאלות כלליות (סגנון, אווירה)
2. בחירת שירים (Tinder-style)
3. בקשות מיוחדות
4. סיכום

**מטרה**: איסוף מידע + חוויה מהנה

---

#### שלב 5: Success Page
**קובץ**: `src/components/journey/SuccessPage.tsx`

**מה קורה**:
- הודעת תודה
- סיכום מה נשלח
- הזוג רואה שהדיג'יי קיבל את המידע
- (אופציונלי) CTA לתיאום פגישה

**מטרה**: סגירת חוויה חיובית

---

## 🔍 ניתוח הלוגיקה הנוכחית

### ✅ מה עובד טוב

1. **הפרדה ברורה**:
   - `/admin` = DJ only
   - `/dj/[slug]` = Couples only

2. **Authentication נפרד**:
   - DJ: email/password + OAuth
   - Couples: email + OTP (קל יותר)

3. **Onboarding נפרד**:
   - DJ: `OnboardingFlowV2` - מקצועי
   - Couples: `JourneyApp` - פשוט ומהנה

4. **Token-based routing**:
   ```typescript
   if (token) {
     // מעבר ישיר לשאלון
     return <JourneyApp />
   } else {
     // הצגת פרופיל (חימום למכירה)
     return <DJProfilePreview />
   }
   ```

---

### ⚠️ נקודות לשיפור

#### 1. חימום למכירה - חלש
**בעיה**: אם זוג נכנס ל-`/dj/[slug]` **בלי token**, הם רואים פרופיל אבל אין להם דרך להתחיל שאלון.

**פתרון מוצע**:
```typescript
// src/app/dj/[slug]/page.tsx
if (!token) {
  return (
    <DJProfilePreview 
      profile={profile} 
      mode="public"
      showCTA={true} // הוסף כפתור "רוצים לעבוד איתי?"
    />
  )
}
```

#### 2. Resume Flow - לא ברור
**בעיה**: אם זוג התחיל שאלון ורוצה לחזור, איך הוא מגיע?

**פתרון מוצע**:
- שמירת `resume_token` ב-session
- שליחת קישור resume במייל
- הצגת "המשך שאלון" בדף הנחיתה

#### 3. Post-Submission - חסר
**בעיה**: אחרי שהזוג שולח שאלון, אין המשך ברור.

**פתרון מוצע**:
- הצגת פרופיל DJ שוב
- CTA לתיאום פגישה
- שיתוף ברשתות חברתיות

---

## 📊 מפת זרימה מלאה

### DJ Journey
```
/admin (login)
  ↓
[New User] → OnboardingFlowV2
  ↓
Dashboard
  ↓
Create Event → Get Link
  ↓
Share with Couple
```

### Couple Journey
```
Click Link → /dj/[slug]?token=xxx
  ↓
[No Token] → DJProfilePreview (חימום למכירה)
  ↓
[With Token] → JourneyApp
  ↓
Email Gate (OTP)
  ↓
Questionnaire
  ↓
Success Page
  ↓
[Missing] → Back to DJ Profile? CTA?
```

---

## 🎯 המלצות לשיפור

### קצר טווח (1-2 שעות)

1. **הוסף CTA בפרופיל DJ**
   ```tsx
   // src/components/dj/DJProfilePreview.tsx
   {mode === "public" && !hasActiveEvent && (
     <button className="btn-primary">
       רוצים לעבוד איתי? צרו קשר
     </button>
   )}
   ```

2. **שפר Success Page**
   ```tsx
   // src/components/journey/SuccessPage.tsx
   <div>
     <h2>תודה! השאלון נשלח</h2>
     <p>{djName} קיבל את המידע</p>
     <button onClick={viewDJProfile}>
       לפרופיל של {djName}
     </button>
   </div>
   ```

3. **הוסף Resume Logic**
   ```tsx
   // src/components/journey/JourneyApp.tsx
   useEffect(() => {
     const resumeToken = sessionStorage.getItem('resume_token');
     if (resumeToken && !completed) {
       // טען מצב שמור
     }
   }, []);
   ```

### ארוך טווח (שבוע)

1. **Analytics על מסעי לקוח**
   - כמה זוגות הגיעו לפרופיל?
   - כמה התחילו שאלון?
   - כמה סיימו?

2. **A/B Testing**
   - נסה גרסאות שונות של Landing Page
   - בדוק איזה CTA עובד טוב יותר

3. **Email Follow-up**
   - שלח תזכורת לזוגות שלא סיימו
   - שלח תודה לזוגות שסיימו

---

**עודכן**: ${new Date().toISOString().split('T')[0]}
