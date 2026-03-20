import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function diagnoseTrials() {
  console.log('🔍 אבחון מערך תקופות הניסיון\n');
  console.log('='.repeat(60));

  // 1. בדיקת טבלת trial_periods
  console.log('\n📊 בדיקת טבלת trial_periods\n');
  
  try {
    const { data, error } = await supabase
      .from('trial_periods')
      .select('*')
      .limit(1);

    if (error) {
      if (error.message.includes('not find')) {
        console.log('❌ טבלת trial_periods לא קיימת!');
      } else {
        console.log('❌ שגיאה:', error.message);
      }
    } else {
      console.log('✅ טבלת trial_periods קיימת');
      if (data && data.length > 0) {
        console.log('   עמודות:', Object.keys(data[0]).join(', '));
      } else {
        console.log('   הטבלה ריקה');
      }
    }
  } catch (e) {
    console.log('❌ שגיאה כללית:', e.message);
  }

  // 2. בדיקת טבלת trial_events
  console.log('\n📊 בדיקת טבלת trial_events\n');
  
  try {
    const { data, error } = await supabase
      .from('trial_events')
      .select('*')
      .limit(1);

    if (error) {
      if (error.message.includes('not find')) {
        console.log('❌ טבלת trial_events לא קיימת!');
      } else {
        console.log('❌ שגיאה:', error.message);
      }
    } else {
      console.log('✅ טבלת trial_events קיימת');
      if (data && data.length > 0) {
        console.log('   עמודות:', Object.keys(data[0]).join(', '));
      } else {
        console.log('   הטבלה ריקה');
      }
    }
  } catch (e) {
    console.log('❌ שגיאה כללית:', e.message);
  }

  // 3. בדיקת API endpoint
  console.log('\n🌐 בדיקת API endpoint\n');
  
  try {
    const response = await fetch('http://localhost:3003/api/hq/trials', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ API endpoint נגיש');
      console.log(`   מצא ${data.trials?.length || 0} trials`);
    } else {
      const data = await response.json();
      console.log(`❌ API endpoint החזיר status ${response.status}`);
      console.log(`   שגיאה: ${data.error}`);
    }
  } catch (e) {
    console.log('❌ לא הצלחתי להתחבר ל-API (האם השרת רץ?)');
    console.log(`   ${e.message}`);
  }

  // 4. בדיקת migrations
  console.log('\n📋 בדיקת migrations רלוונטיות\n');
  
  try {
    const { data, error } = await supabase
      .from('_migrations')
      .select('name')
      .like('name', '%trial%')
      .order('name');

    if (error) {
      console.log('⚠️  לא הצלחתי לקרוא את טבלת migrations');
    } else if (data && data.length > 0) {
      console.log('✅ migrations שהורצו:');
      data.forEach(m => console.log(`   - ${m.name}`));
    } else {
      console.log('⚠️  לא נמצאו trial migrations');
    }
  } catch (e) {
    console.log('⚠️  טבלת _migrations לא קיימת');
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n📋 סיכום\n');
  console.log('אם טבלת trial_periods לא קיימת, צריך להריץ את ה-migration.');
  console.log('אם הטבלה קיימת אבל יש שגיאות, צריך לבדוק את המבנה.\n');
}

diagnoseTrials();
