import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testProfilesAPI() {
  console.log('🔍 בדיקת API של profiles\n');

  // 1. בדיקת גישה ישירה לטבלה
  console.log('📊 בדיקה 1: גישה ישירה לטבלת profiles');
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, user_id, business_name, dj_slug, role, email, plan, is_active, feature_overrides, notes, managed_by, created_at, updated_at')
      .limit(5);

    if (error) {
      console.log('❌ שגיאה:', error.message);
      console.log('   Code:', error.code);
      console.log('   Details:', error.details);
    } else {
      console.log('✅ גישה ישירה עובדת');
      console.log(`   מצא ${data?.length || 0} profiles\n`);
      if (data && data.length > 0) {
        console.log('   דוגמה לעמודות:', Object.keys(data[0]).join(', '));
      }
    }
  } catch (e) {
    console.log('❌ שגיאה כללית:', e.message);
  }

  // 2. בדיקת API endpoint
  console.log('\n🌐 בדיקה 2: בדיקת API endpoint');
  try {
    const response = await fetch('http://localhost:3003/api/hq/profiles', {
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
      console.log(`   מצא ${data.profiles?.length || 0} profiles`);
    }
  } catch (e) {
    console.log('❌ לא הצלחתי להתחבר ל-API');
    console.log('   האם השרת רץ? (npm run dev)');
    console.log('   ', e.message);
  }

  console.log('\n' + '='.repeat(60));
}

testProfilesAPI();
