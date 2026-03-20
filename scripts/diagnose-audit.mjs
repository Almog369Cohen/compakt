import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function diagnoseAudit() {
  console.log('🔍 בדיקת טבלת audit logs\n');

  const { data, error } = await supabase
    .from('hq_audit_logs')
    .select('*')
    .limit(1);

  if (error) {
    if (error.message.includes('not find')) {
      console.log('❌ טבלת hq_audit_logs לא קיימת!');
      console.log('\n📋 פתרון: הרץ את scripts/create-audit-logs.sql ב-Supabase Dashboard\n');
    } else {
      console.log('❌ שגיאה:', error.message);
    }
  } else {
    console.log('✅ טבלת hq_audit_logs קיימת');
    console.log(`   מצא ${data?.length || 0} רשומות\n`);
  }
}

diagnoseAudit();
