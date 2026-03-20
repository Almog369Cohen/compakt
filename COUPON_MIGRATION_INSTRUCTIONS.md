# הוראות להשלמת Migration הקופונים

## מצב נוכחי
✅ טבלת `coupons` קיימת  
❌ טבלת `coupon_usages` חסרה  
❌ טבלת `coupon_analytics` חסרה  
❌ כל הפונקציות חסרות

## דרך 1: דרך Supabase Dashboard (מומלץ)

### שלבים:
1. **פתח את Supabase Dashboard**
   - גש ל: https://supabase.com/dashboard/project/rgfajvnkrszwksiidspm/sql/new

2. **העתק את ה-SQL**
   - פתח את הקובץ: `scripts/complete-coupon-migration.sql`
   - העתק את כל התוכן (Cmd+A, Cmd+C)

3. **הדבק והרץ**
   - הדבק ב-SQL Editor (Cmd+V)
   - לחץ על כפתור "RUN" (או Cmd+Enter)

4. **בדוק הצלחה**
   - אמור לראות הודעה "Success. No rows returned"
   - אם יש שגיאות - העתק אותן ושלח לי

5. **אמת שהכל עבד**
   ```bash
   node scripts/check-missing-tables.mjs
   ```

---

## דרך 2: דרך Supabase CLI (אם מותקן)

```bash
# התחבר ל-Supabase
supabase login

# הרץ את ה-migration
supabase db execute -f scripts/complete-coupon-migration.sql --project-ref rgfajvnkrszwksiidspm
```

---

## דרך 3: העתקה ידנית של ה-SQL

אם אתה מעדיף, הנה ה-SQL המלא להעתקה:

