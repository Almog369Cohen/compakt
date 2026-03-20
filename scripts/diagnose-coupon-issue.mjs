import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function diagnoseCouponIssue() {
  console.log('🔍 אבחון מקיף של מערך הקופונים\n');
  console.log('='.repeat(60));

  // 1. בדיקת schema של טבלת coupons
  console.log('\n📊 שלב 1: בדיקת schema של טבלת coupons\n');
  
  try {
    const { data: columns, error: schemaError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'coupons')
      .eq('table_schema', 'public')
      .order('ordinal_position');

    if (schemaError) {
      console.log('❌ שגיאה בקריאת schema:', schemaError.message);
    } else if (!columns || columns.length === 0) {
      console.log('❌ טבלת coupons לא קיימת!');
    } else {
      console.log('✅ טבלת coupons קיימת עם העמודות הבאות:');
      columns.forEach(col => {
        const nullable = col.is_nullable === 'YES' ? '(nullable)' : '(NOT NULL)';
        console.log(`   - ${col.column_name}: ${col.data_type} ${nullable}`);
      });

      // בדיקת עמודות חסרות
      const requiredColumns = [
        'id', 'code', 'name', 'description', 'discount_type', 'discount_value',
        'discount_currency', 'max_uses', 'used_count', 'valid_from', 'valid_until',
        'is_active', 'created_by', 'created_at', 'updated_at', 'min_plan_value',
        'applicable_plans', 'first_time_only', 'trial_trigger'
      ];

      const existingColumns = columns.map(c => c.column_name);
      const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));

      if (missingColumns.length > 0) {
        console.log('\n⚠️  עמודות חסרות:');
        missingColumns.forEach(col => console.log(`   - ${col}`));
      } else {
        console.log('\n✅ כל העמודות הנדרשות קיימות');
      }
    }
  } catch (e) {
    console.log('❌ שגיאה כללית בבדיקת schema:', e.message);
  }

  // 2. בדיקת טבלאות נוספות
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 שלב 2: בדיקת טבלאות נוספות\n');

  const tables = ['coupon_usages', 'coupon_analytics'];
  for (const table of tables) {
    const { error } = await supabase.from(table).select('count').limit(0);
    if (error) {
      console.log(`❌ ${table}: לא קיימת`);
    } else {
      console.log(`✅ ${table}: קיימת`);
    }
  }

  // 3. בדיקת פונקציות
  console.log('\n' + '='.repeat(60));
  console.log('\n🔧 שלב 3: בדיקת פונקציות\n');

  const functions = [
    { name: 'generate_coupon_code', params: {} },
    { name: 'create_coupon', params: { p_name: 'Test', p_discount_type: 'percentage', p_discount_value: 10 } },
    { name: 'validate_coupon', params: { p_code: 'TEST123' } },
    { name: 'apply_coupon', params: { p_code: 'TEST123', p_profile_id: '00000000-0000-0000-0000-000000000000' } },
    { name: 'get_coupon_analytics', params: {} }
  ];

  for (const func of functions) {
    try {
      const { data, error } = await supabase.rpc(func.name, func.params);
      
      if (error) {
        if (error.message.includes('not find')) {
          console.log(`❌ ${func.name}: לא קיימת`);
        } else {
          console.log(`⚠️  ${func.name}: קיימת אבל יש שגיאה:`);
          console.log(`   ${error.message.substring(0, 100)}...`);
        }
      } else {
        console.log(`✅ ${func.name}: קיימת ועובדת`);
      }
    } catch (e) {
      console.log(`❌ ${func.name}: שגיאה - ${e.message.substring(0, 100)}`);
    }
  }

  // 4. ניסיון יצירת קופון ישירות
  console.log('\n' + '='.repeat(60));
  console.log('\n🧪 שלב 4: ניסיון יצירת קופון ישירות\n');

  try {
    const { data, error } = await supabase.rpc('create_coupon', {
      p_name: 'Test Diagnostic Coupon',
      p_discount_type: 'percentage',
      p_discount_value: 10,
      p_description: 'Test coupon for diagnostics',
      p_valid_days: 30
    });

    if (error) {
      console.log('❌ יצירת קופון נכשלה:');
      console.log(`   ${error.message}`);
      console.log('\n📋 פרטי השגיאה המלאים:');
      console.log(JSON.stringify(error, null, 2));
    } else {
      console.log('✅ קופון נוצר בהצלחה!');
      console.log(`   ID: ${data}`);
      
      // נסה למחוק אותו
      try {
        await supabase.from('coupons').delete().eq('id', data);
        console.log('✅ קופון הבדיקה נמחק');
      } catch (e) {
        console.log('⚠️  לא הצלחתי למחוק את קופון הבדיקה');
      }
    }
  } catch (e) {
    console.log('❌ שגיאה כללית ביצירת קופון:', e.message);
  }

  // 5. בדיקת API endpoint
  console.log('\n' + '='.repeat(60));
  console.log('\n🌐 שלב 5: בדיקת API endpoint\n');

  try {
    const response = await fetch('http://localhost:3003/api/hq/coupons', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      console.log('✅ API endpoint נגיש');
      const data = await response.json();
      console.log(`   מצא ${data.coupons?.length || 0} קופונים`);
    } else {
      console.log(`⚠️  API endpoint החזיר status ${response.status}`);
    }
  } catch (e) {
    console.log('❌ לא הצלחתי להתחבר ל-API (האם השרת רץ?)');
    console.log(`   ${e.message}`);
  }

  // סיכום
  console.log('\n' + '='.repeat(60));
  console.log('\n📋 סיכום האבחון\n');
  console.log('אם ראית שגיאות למעלה, הן מצביעות על הבעיה.');
  console.log('השלב הבא: תיקון הבעיות שזוהו.\n');
}

diagnoseCouponIssue();
