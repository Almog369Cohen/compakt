import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTables() {
  console.log('🔍 בודק אילו טבלאות קיימות...\n');

  const tables = ['coupons', 'coupon_usages', 'coupon_analytics'];
  
  for (const table of tables) {
    const { data, error } = await supabase
      .from(table)
      .select('count')
      .limit(0);
    
    if (error) {
      console.log(`❌ ${table}: לא קיימת - ${error.message}`);
    } else {
      console.log(`✅ ${table}: קיימת`);
    }
  }

  console.log('\n🔧 בודק פונקציות...\n');

  const functions = [
    'create_coupon',
    'validate_coupon',
    'apply_coupon',
    'get_coupon_analytics',
    'generate_coupon_code'
  ];

  for (const func of functions) {
    try {
      // Try a simple call to see if function exists
      const { error } = await supabase.rpc(func, {});
      
      if (error && error.message.includes('not find')) {
        console.log(`❌ ${func}: לא קיימת`);
      } else {
        console.log(`✅ ${func}: קיימת`);
      }
    } catch (e) {
      console.log(`❌ ${func}: שגיאה - ${e.message}`);
    }
  }
}

checkTables();
