# 🚨 תיקון דחוף - טבלת Coupons

## הבעיה שזוהתה

טבלת `coupons` קיימת אבל **חסרות בה עמודות חיוניות**:
- ❌ `name` - חסרה
- ❌ `valid_from` - חסרה
- ❌ `valid_until` - חסרה
- ❌ עמודות נוספות חסרות

**זו הסיבה לשגיאה "Failed to create coupon"**

---

## הפתרון

יש להריץ את הקובץ `scripts/fix-coupons-table.sql` ב-Supabase Dashboard.

הסקריפט:
1. מוחק את טבלת `coupons` הקיימת (והטבלאות התלויות)
2. יוצר מחדש את `coupons` עם ה-schema המלא והנכון
3. יוצר מחדש את `coupon_usages` ו-`coupon_analytics`
4. מוסיף indexes, RLS policies, ו-triggers

---

## הוראות הרצה

### שלב 1: פתח Supabase Dashboard
```
https://supabase.com/dashboard/project/rgfajvnkrszwksiidspm/sql/new
```

### שלב 2: העתק את ה-SQL
1. פתח את הקובץ: `scripts/fix-coupons-table.sql`
2. בחר הכל: `Cmd+A`
3. העתק: `Cmd+C`

### שלב 3: הדבק והרץ
1. הדבק ב-SQL Editor: `Cmd+V`
2. הרץ: לחץ "RUN" או `Cmd+Enter`

### שלב 4: אמת שהכל עבד
```bash
node scripts/diagnose-coupon-issue.mjs
```

אמור לראות:
```
✅ כל העמודות הנדרשות קיימות
✅ create_coupon: קיימת ועובדת
✅ validate_coupon: קיימת ועובדת
✅ apply_coupon: קיימת ועובדת
✅ קופון נוצר בהצלחה!
```

---

## אחרי התיקון

1. **הרץ את השרת** (אם לא רץ):
   ```bash
   npm run dev
   ```

2. **פתח את הממשק**:
   ```
   http://localhost:3003/hq
   ```

3. **צור קופון**:
   - לחץ על טאב "קופונים"
   - לחץ "צור קופון חדש"
   - מלא את הפרטים
   - לחץ "צור קופון"

4. **אמור לעבוד!** 🎉

---

## למה זה קרה?

כנראה שטבלת `coupons` נוצרה בעבר עם schema חלקי או שונה, ולכן migration 017 לא עדכן אותה (כי השתמש ב-`CREATE TABLE IF NOT EXISTS`).

הפתרון: מחיקה ויצירה מחדש עם ה-schema המלא.

---

## מוכן? לך על זה! 🚀

פתח את Supabase Dashboard והרץ את `scripts/fix-coupons-table.sql`
