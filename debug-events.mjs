import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://rgfajvnkrszwksiidspm.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJnZmFqdm5rcnN6d2tzaWlkc3BtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTg3ODU2MCwiZXhwIjoyMDg3NDU0NTYwfQ.hSAgJNXgFjF8-WbFwMVqSPxFRi1LSQyXICxCArI-QdU'
);

async function checkEvents() {
  console.log('🔍 Checking events in database...');

  const { data, error } = await supabase
    .from('events')
    .select('id, magic_token, token, couple_name_a, couple_name_b, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('❌ Error:', error);
  } else {
    console.log('📊 Recent events:');
    if (data.length === 0) {
      console.log('❌ No events found in database!');
    } else {
      data.forEach(event => {
        console.log(`- ID: ${event.id}`);
        console.log(`  Magic Token: ${event.magic_token}`);
        console.log(`  Token: ${event.token}`);
        console.log(`  Couple: ${event.couple_name_a} & ${event.couple_name_b}`);
        console.log(`  Created: ${event.created_at}`);
        console.log('');
      });
    }
  }
}

checkEvents().catch(console.error);
