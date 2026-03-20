import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { readFileSync } from 'fs';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runMigrationStepByStep() {
  console.log('🚀 מריץ migration שלב אחר שלב...\n');

  // Step 1: Create coupon_usages table
  console.log('📋 שלב 1: יצירת טבלת coupon_usages');
  try {
    // Try to query the table first
    const { error: checkError } = await supabase
      .from('coupon_usages')
      .select('count')
      .limit(0);

    if (checkError && checkError.message.includes('not find')) {
      console.log('   הטבלה לא קיימת - צריך ליצור אותה ב-Supabase Dashboard');
      console.log('   ❌ לא ניתן ליצור טבלאות דרך Supabase JS Client\n');
    } else {
      console.log('   ✅ הטבלה כבר קיימת\n');
    }
  } catch (e) {
    console.log(`   ❌ שגיאה: ${e.message}\n`);
  }

  // Step 2: Create coupon_analytics table
  console.log('📋 שלב 2: יצירת טבלת coupon_analytics');
  try {
    const { error: checkError } = await supabase
      .from('coupon_analytics')
      .select('count')
      .limit(0);

    if (checkError && checkError.message.includes('not find')) {
      console.log('   הטבלה לא קיימת - צריך ליצור אותה ב-Supabase Dashboard');
      console.log('   ❌ לא ניתן ליצור טבלאות דרך Supabase JS Client\n');
    } else {
      console.log('   ✅ הטבלה כבר קיימת\n');
    }
  } catch (e) {
    console.log(`   ❌ שגיאה: ${e.message}\n`);
  }

  console.log('━'.repeat(60));
  console.log('\n📌 סיכום: יש להריץ את ה-SQL ב-Supabase Dashboard ידנית\n');
  console.log('🔗 פתח: https://supabase.com/dashboard/project/rgfajvnkrszwksiidspm/sql/new');
  console.log('\n📄 העתק והדבק את התוכן מהקובץ:');
  console.log('   scripts/complete-coupon-migration.sql\n');
  console.log('💡 או העתק את ה-SQL הבא:\n');
  
  const sql = readFileSync('scripts/complete-coupon-migration.sql', 'utf8');
  console.log('━'.repeat(60));
  console.log(sql);
  console.log('━'.repeat(60));
  
  console.log('\n✅ אחרי הרצת ה-SQL, הרץ:');
  console.log('   node scripts/check-missing-tables.mjs\n');
}

runMigrationStepByStep();
