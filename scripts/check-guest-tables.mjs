import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkGuestTables() {
  console.log('🔍 Checking Spotify Guest Integration tables...\n');
  
  const tables = [
    'guest_invitations',
    'guest_spotify_tokens', 
    'guest_playlists',
    'guest_tracks',
    'event_music_analysis'
  ];
  
  for (const tableName of tables) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('count')
        .limit(1);
      
      if (error) {
        console.log(`❌ ${tableName}: ${error.message}`);
      } else {
        console.log(`✅ ${tableName}: EXISTS`);
      }
    } catch (err) {
      console.log(`❌ ${tableName}: NOT FOUND`);
    }
  }
}

checkGuestTables().catch(console.error);
