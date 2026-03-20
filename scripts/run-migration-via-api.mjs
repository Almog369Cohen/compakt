import { config } from 'dotenv';
import { readFileSync } from 'fs';

config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function runSQL(sql) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({ query: sql })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`HTTP ${response.status}: ${error}`);
  }

  return response.json();
}

async function createTablesDirectly() {
  console.log('🚀 יוצר טבלאות ופונקציות חסרות...\n');

  const steps = [
    {
      name: 'coupon_usages table',
      check: async () => {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/coupon_usages?limit=0`, {
          headers: { 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}` }
        });
        return res.ok;
      },
      sql: `
        CREATE TABLE IF NOT EXISTS coupon_usages (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
          profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
          subscription_id TEXT,
          discount_applied NUMERIC NOT NULL,
          discount_currency TEXT DEFAULT 'ILS',
          used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(coupon_id, profile_id)
        );
      `
    },
    {
      name: 'coupon_analytics table',
      check: async () => {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/coupon_analytics?limit=0`, {
          headers: { 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}` }
        });
        return res.ok;
      },
      sql: `
        CREATE TABLE IF NOT EXISTS coupon_analytics (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
          event_type TEXT NOT NULL CHECK (event_type IN ('created', 'viewed', 'applied', 'expired', 'deactivated')),
          event_data JSONB,
          ip_address INET,
          user_agent TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    }
  ];

  for (const step of steps) {
    try {
      const exists = await step.check();
      if (exists) {
        console.log(`✅ ${step.name}: כבר קיימת`);
        continue;
      }
    } catch (e) {
      console.log(`🔍 ${step.name}: לא קיימת, יוצר...`);
    }

    try {
      await runSQL(step.sql);
      console.log(`✅ ${step.name}: נוצרה בהצלחה`);
    } catch (error) {
      console.log(`❌ ${step.name}: ${error.message}`);
    }
  }

  console.log('\n📝 הערה: הפונקציות (create_coupon, validate_coupon וכו\') צריכות להיווצר ב-Supabase Dashboard SQL Editor');
  console.log('   הקובץ המלא נמצא ב: scripts/complete-coupon-migration.sql\n');
}

createTablesDirectly();
