#!/bin/bash

# סקריפט להרצת migration 017_coupon_system.sql
# העתק את הפלט והרץ ב-Supabase Dashboard > SQL Editor

echo "=== Migration 017_coupon_system.sql ==="
echo "העתק את הקוד שבין הקווים המפרידים והרץ ב-Supabase Dashboard:"
echo ""
echo "--------------------------------------------------------"
cat supabase/migrations/017_coupon_system.sql
echo "--------------------------------------------------------"
echo ""
echo "אחרי הרצת ה-migration, הפעל את הבדיקה:"
echo "node scripts/check-coupon-system.mjs"
