# 🚨 תיקון דחוף - מערך תקופות הניסיון

## הבעיה שזוהתה

טבלאות תקופות הניסיון **לא קיימות במסד הנתונים**:
- ❌ `trial_periods` - חסרה
- ❌ `trial_events` - חסרה
- ❌ `trial_reminders` - חסרה
- ❌ `trial_settings` - חסרה

**זו הסיבה לשגיאות בטאב "ניסיון" בממשק HQ**

---

## הפתרון

יש להריץ את הקובץ `scripts/create-trial-tables.sql` ב-Supabase Dashboard.

הסקריפט:
1. יוצר את כל 4 הטבלאות הנדרשות
2. מוסיף indexes, RLS policies (עם type casting מתוקן)
3. יוצר 4 פונקציות: `start_trial`, `extend_trial`, `convert_trial_to_paid`, `check_trial_status`
4. מוסיף triggers ו-default settings

---

## הוראות הרצה

### שלב 1: פתח Supabase Dashboard
```
https://supabase.com/dashboard/project/rgfajvnkrszwksiidspm/sql/new
```

### שלב 2: העתק את ה-SQL
1. פתח את הקובץ: `scripts/create-trial-tables.sql`
2. בחר הכל: `Cmd+A`
3. העתק: `Cmd+C`

### שלב 3: הדבק והרץ
1. הדבק ב-SQL Editor: `Cmd+V`
2. הרץ: לחץ "RUN" או `Cmd+Enter`

### שלב 4: אמת שהכל עבד
```bash
node scripts/diagnose-trials.mjs
```

אמור לראות:
```
✅ טבלת trial_periods קיימת
✅ טבלת trial_events קיימת
✅ API endpoint נגיש
```

---

## אחרי התיקון

1. **רענן את הדף HQ**:
   ```
   http://localhost:3003/hq
   ```

2. **לחץ על טאב "ניסיון"**

3. **אמור לראות**:
   - רשימת trials (ריקה בהתחלה)
   - כפתור "צור תקופת ניסיון חדשה"
   - ללא שגיאות

---

## מה הסקריפט עושה?

### טבלאות שנוצרות:
1. **trial_periods** - תקופות ניסיון של משתמשים
2. **trial_events** - מעקב אחר אירועים (התחלה, הארכה, המרה)
3. **trial_reminders** - תזכורות אוטומטיות
4. **trial_settings** - הגדרות מערכת

### פונקציות שנוצרות:
1. **start_trial()** - יצירת תקופת ניסיון חדשה
2. **extend_trial()** - הארכת תקופת ניסיון
3. **convert_trial_to_paid()** - המרה לתשלום
4. **check_trial_status()** - בדיקת סטטוס

### תיקוני Type Casting:
- ✅ `auth.uid()::text` → `auth.uid()` (UUID native)
- ✅ `WHERE id = auth.uid()::text` → `WHERE user_id = auth.uid()`
- ✅ הוספת `DROP POLICY IF EXISTS` למניעת שגיאות

---

## למה זה קרה?

Migration 016 (`016_trial_management.sql`) לא הורץ במסד הנתונים, לכן הטבלאות לא נוצרו.

---

## מוכן? לך על זה! 🚀

פתח את Supabase Dashboard והרץ את `scripts/create-trial-tables.sql`

**אחרי ההרצה, הודע לי ואני אמשיך עם הבדיקות.**
