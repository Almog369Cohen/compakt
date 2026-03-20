# 🚨 תיקון מהיר - Audit Log

## הבעיה

טבלת `hq_audit_logs` קיימת אבל יש בעיית **type casting ב-RLS policies**.

ה-policy הקיים משתמש ב-`auth.uid()::text` במקום `auth.uid()` (UUID).

**זו הסיבה לשגיאה "שגיאה בטעינת audit log"**

---

## הפתרון המהיר

הרץ את `scripts/fix-audit-policies.sql` ב-Supabase Dashboard.

הסקריפט:
1. מוחק את ה-policies הישנות
2. יוצר מחדש עם type casting נכון

---

## הוראות הרצה

### פתח Supabase Dashboard
```
https://supabase.com/dashboard/project/rgfajvnkrszwksiidspm/sql/new
```

### העתק והרץ
1. פתח: `scripts/fix-audit-policies.sql`
2. העתק הכל (Cmd+A, Cmd+C)
3. הדבק ב-SQL Editor והרץ (RUN)

### אמת
```bash
node scripts/diagnose-audit.mjs
```

---

## אחרי התיקון

רענן את http://localhost:3003/hq → טאב "Audit"

אמור לעבוד! ✅

---

## מה השתנה?

**לפני:**
```sql
WHERE id = auth.uid()::text  -- ❌ שגוי
```

**אחרי:**
```sql
WHERE user_id = auth.uid()  -- ✅ נכון
```
