import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function inspectTables() {
  console.log('🔍 בודק מבנה טבלאות קופונים...\n');

  // Check coupons table structure
  const { data: coupons, error: couponsError } = await supabase
    .from('coupons')
    .select('*')
    .limit(1);

  if (couponsError) {
    console.log('❌ coupons:', couponsError.message);
  } else {
    console.log('✅ coupons: קיימת');
    if (coupons && coupons.length > 0) {
      console.log('   עמודות:', Object.keys(coupons[0]).join(', '));
    }
  }

  // Try to get table info from pg_catalog
  const { data: tables, error: tablesError } = await supabase.rpc('exec_sql', {
    sql: `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE '%coupon%'
      ORDER BY table_name;
    `
  });

  if (!tablesError && tables) {
    console.log('\n📋 טבלאות קופונים במסד הנתונים:');
    console.log(tables);
  }

  // Check functions
  const { data: functions, error: functionsError } = await supabase.rpc('exec_sql', {
    sql: `
      SELECT routine_name 
      FROM information_schema.routines 
      WHERE routine_schema = 'public' 
      AND routine_name LIKE '%coupon%'
      ORDER BY routine_name;
    `
  });

  if (!functionsError && functions) {
    console.log('\n🔧 פונקציות קופונים:');
    console.log(functions);
  }
}

inspectTables();
