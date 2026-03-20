// בדיקת תקינות מערך הקופונים אחרי הרצת migration
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// קריאת משתני סביבה מקובץ .env.local
config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkCouponSystem() {
  console.log('🔍 בודק מערך קופונים...\n');

  try {
    // 1. בדיקת טבלאות
    console.log('📊 בדיקת טבלאות:');

    const tables = ['coupons', 'coupon_usages', 'coupon_analytics'];
    for (const table of tables) {
      const { data, error } = await supabase.from(table).select('count').limit(1);
      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
      } else {
        console.log(`✅ ${table}: קיימת`);
      }
    }

    // 2. בדיקת פונקציות
    console.log('\n🔧 בדיקת פונקציות:');

    try {
      const { data, error } = await supabase.rpc('create_coupon', {
        p_name: 'test-coupon',
        p_discount_type: 'percentage',
        p_discount_value: 10
      });

      if (error) {
        console.log(`❌ create_coupon: ${error.message}`);
      } else {
        console.log(`✅ create_coupon: עובדת (ID: ${data})`);

        // נקה את הקופון שיצרנו לבדיקה
        await supabase.from('coupons').delete().eq('id', data);
      }
    } catch (err) {
      console.log(`❌ create_coupon: ${err.message}`);
    }

    // 3. בדיקת API endpoints
    console.log('\n🌐 בדיקת API endpoints:');

    try {
      const response = await fetch('http://localhost:3000/api/hq/coupons', {
        headers: { 'Cookie': 'compakt-admin-bypass=almog22@gmail.com' }
      });

      if (response.ok) {
        console.log('✅ /api/hq/coupons: נגיש');
      } else {
        console.log(`❌ /api/hq/coupons: ${response.status}`);
      }
    } catch (err) {
      console.log(`❌ /api/hq/coupons: ${err.message}`);
    }

    try {
      const response = await fetch('http://localhost:3000/api/hq/profiles', {
        headers: { 'Cookie': 'compakt-admin-bypass=almog22@gmail.com' }
      });

      if (response.ok) {
        console.log('✅ /api/hq/profiles: נגיש');
      } else {
        console.log(`❌ /api/hq/profiles: ${response.status}`);
      }
    } catch (err) {
      console.log(`❌ /api/hq/profiles: ${err.message}`);
    }

    console.log('\n🎉 בדיקה הסתיימה!');

  } catch (error) {
    console.error('❌ שגיאת חיבור:', error.message);
  }
}

checkCouponSystem();
