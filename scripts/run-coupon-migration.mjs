import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { readFileSync } from 'fs';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runMigration() {
  console.log('🚀 מריץ השלמת migration לקופונים...\n');

  const sql = readFileSync('scripts/complete-coupon-migration.sql', 'utf8');
  
  // Split by semicolons and filter out empty statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`📝 מצאתי ${statements.length} פקודות SQL להרצה\n`);

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i] + ';';
    const preview = statement.substring(0, 60).replace(/\n/g, ' ') + '...';
    
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: statement });
      
      if (error) {
        // Some errors are OK (like "already exists")
        if (error.message.includes('already exists') || 
            error.message.includes('duplicate')) {
          console.log(`⚠️  [${i + 1}/${statements.length}] כבר קיים: ${preview}`);
          successCount++;
        } else {
          console.log(`❌ [${i + 1}/${statements.length}] שגיאה: ${preview}`);
          console.log(`   ${error.message}\n`);
          errorCount++;
        }
      } else {
        console.log(`✅ [${i + 1}/${statements.length}] הצליח: ${preview}`);
        successCount++;
      }
    } catch (e) {
      console.log(`❌ [${i + 1}/${statements.length}] שגיאה: ${preview}`);
      console.log(`   ${e.message}\n`);
      errorCount++;
    }
  }

  console.log(`\n📊 סיכום:`);
  console.log(`   ✅ הצליחו: ${successCount}`);
  console.log(`   ❌ נכשלו: ${errorCount}`);
  
  if (errorCount === 0) {
    console.log('\n🎉 Migration הושלם בהצלחה!');
  } else {
    console.log('\n⚠️  היו שגיאות - בדוק את הפלט למעלה');
  }
}

runMigration();
