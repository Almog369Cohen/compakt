import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testAuditAPI() {
  console.log('🔍 בדיקת API של audit log\n');

  // 1. בדיקת גישה ישירה לטבלה
  console.log('📊 בדיקה 1: גישה ישירה לטבלה');
  try {
    const { data, error } = await supabase
      .from('hq_audit_logs')
      .select('*')
      .limit(5);

    if (error) {
      console.log('❌ שגיאה:', error.message);
      console.log('   Code:', error.code);
      console.log('   Details:', error.details);
      console.log('   Hint:', error.hint);
    } else {
      console.log('✅ גישה ישירה עובדת');
      console.log(`   מצא ${data?.length || 0} רשומות\n`);
    }
  } catch (e) {
    console.log('❌ שגיאה כללית:', e.message);
  }

  // 2. בדיקת RLS policies
  console.log('\n🔒 בדיקה 2: בדיקת RLS policies');
  try {
    // Try with a mock auth context
    const { data: policies, error: policiesError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT policyname, cmd, qual 
          FROM pg_policies 
          WHERE tablename = 'hq_audit_logs'
        `
      });

    if (policiesError) {
      console.log('⚠️  לא הצלחתי לקרוא policies (זה בסדר)');
    } else {
      console.log('✅ Policies:');
      console.log(policies);
    }
  } catch (e) {
    console.log('⚠️  לא הצלחתי לבדוק policies');
  }

  // 3. בדיקת API endpoint
  console.log('\n🌐 בדיקה 3: בדיקת API endpoint');
  try {
    const response = await fetch('http://localhost:3003/api/hq/audit', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'compakt-admin-bypass=almog22@gmail.com'
      }
    });

    console.log(`   Status: ${response.status}`);
    const data = await response.json();
    
    if (!response.ok) {
      console.log('❌ API החזיר שגיאה:');
      console.log('   ', JSON.stringify(data, null, 2));
    } else {
      console.log('✅ API עובד');
      console.log(`   מצא ${data.logs?.length || 0} logs`);
      if (data.message) {
        console.log(`   הודעה: ${data.message}`);
      }
    }
  } catch (e) {
    console.log('❌ לא הצלחתי להתחבר ל-API');
    console.log('   האם השרת רץ? (npm run dev)');
    console.log('   ', e.message);
  }

  console.log('\n' + '='.repeat(60));
}

testAuditAPI();
