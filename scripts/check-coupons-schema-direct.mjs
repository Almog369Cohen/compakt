import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSchema() {
  console.log('🔍 בדיקת schema של טבלת coupons\n');

  // Try to select all columns to see what exists
  const { data, error } = await supabase
    .from('coupons')
    .select('*')
    .limit(0);

  if (error) {
    console.log('❌ שגיאה:', error.message);
    
    // Try to insert a minimal record to see what columns are required
    console.log('\n🧪 ניסיון insert כדי לראות אילו עמודות קיימות:\n');
    
    const { error: insertError } = await supabase
      .from('coupons')
      .insert({
        code: 'TEST_' + Date.now(),
        discount_type: 'percentage',
        discount_value: 10
      });
    
    if (insertError) {
      console.log('שגיאת insert:', insertError.message);
      console.log('\nזה עוזר לנו להבין אילו עמודות חסרות.');
    }
  } else {
    console.log('✅ הטבלה קיימת אבל ריקה');
    console.log('לא ניתן לראות את העמודות כי אין רשומות');
  }
}

checkSchema();
