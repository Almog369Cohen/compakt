import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 Checking Spotify Guest Integration System...\n');

// 1. Check Environment Variables
console.log('📋 Environment Variables:');
const envVars = [
  'SPOTIFY_CLIENT_ID',
  'SPOTIFY_CLIENT_SECRET', 
  'SPOTIFY_TOKEN_ENCRYPTION_KEY',
  'SPOTIFY_GUEST_REDIRECT_URI'
];

envVars.forEach(envVar => {
  const value = process.env[envVar];
  if (value) {
    if (envVar.includes('SECRET') || envVar.includes('KEY')) {
      console.log(`✅ ${envVar}: SET (${value.length} chars)`);
    } else {
      console.log(`✅ ${envVar}: ${value}`);
    }
  } else {
    console.log(`❌ ${envVar}: MISSING`);
  }
});

console.log('\n🗄️ Database Tables:');

// 2. Check Spotify Guest Tables
const spotifyTables = [
  'guest_invitations',
  'guest_spotify_tokens', 
  'guest_playlists',
  'guest_tracks',
  'event_music_analysis'
];

for (const tableName of spotifyTables) {
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

console.log('\n📁 API Routes Check:');

// 3. Check API Routes (by checking if files exist)
const fs = require('fs');
const path = require('path');

const apiRoutes = [
  'src/app/api/guest/invite/[token]/route.ts',
  'src/app/api/guest/spotify/connect/route.ts', 
  'src/app/api/guest/spotify/callback/route.ts',
  'src/app/api/guest/playlists/fetch/route.ts',
  'src/app/api/admin/event/[eventId]/guests/route.ts',
  'src/app/api/admin/event/[eventId]/music-analysis/route.ts'
];

apiRoutes.forEach(routePath => {
  const fullPath = path.join(process.cwd(), routePath);
  if (fs.existsSync(fullPath)) {
    console.log(`✅ ${routePath}: EXISTS`);
  } else {
    console.log(`❌ ${routePath}: MISSING`);
  }
});

console.log('\n🎨 Frontend Components Check:');

// 4. Check Frontend Components
const components = [
  'src/components/admin/GuestInviteManager.tsx',
  'src/components/admin/MusicAnalysisView.tsx',
  'src/components/admin/EventGuestManager.tsx',
  'src/app/guest/[token]/page.tsx',
  'src/app/guest/[token]/success/page.tsx'
];

components.forEach(compPath => {
  const fullPath = path.join(process.cwd(), compPath);
  if (fs.existsSync(fullPath)) {
    console.log(`✅ ${compPath}: EXISTS`);
  } else {
    console.log(`❌ ${compPath}: MISSING`);
  }
});

console.log('\n🔐 Security Check:');

// 5. Check Encryption Module
const encryptionPath = path.join(process.cwd(), 'src/lib/encryption.ts');
if (fs.existsSync(encryptionPath)) {
  console.log('✅ src/lib/encryption.ts: EXISTS');
} else {
  console.log('❌ src/lib/encryption.ts: MISSING');
}

// 6. Check Migration File
const migrationPath = path.join(process.cwd(), 'supabase/migrations/025_spotify_guest_integration.sql');
if (fs.existsSync(migrationPath)) {
  console.log('✅ Migration 025: EXISTS');
} else {
  console.log('❌ Migration 025: MISSING');
}

console.log('\n📊 Sample Data Check:');

// 7. Check if there's sample data
try {
  const { data: invitations, error: invError } = await supabase
    .from('guest_invitations')
    .select('id, status, guest_email')
    .limit(5);
    
  if (invError) {
    console.log(`❌ Sample invitations check: ${invError.message}`);
  } else {
    console.log(`✅ Sample invitations: ${invitations?.length || 0} found`);
    if (invitations && invitations.length > 0) {
      invitations.forEach(inv => {
        console.log(`   - ${inv.guest_email}: ${inv.status}`);
      });
    }
  }
} catch (err) {
  console.log('❌ Sample invitations check: FAILED');
}

try {
  const { data: tokens, error: tokenError } = await supabase
    .from('guest_spotify_tokens')
    .select('id, spotify_user_id')
    .limit(3);
    
  if (tokenError) {
    console.log(`❌ Sample tokens check: ${tokenError.message}`);
  } else {
    console.log(`✅ Sample tokens: ${tokens?.length || 0} found`);
  }
} catch (err) {
  console.log('❌ Sample tokens check: FAILED');
}

console.log('\n🎯 Integration Summary:');

// 8. Overall Assessment
const missingEnv = envVars.filter(env => !process.env[env]).length;
const missingTables = spotifyTables.filter(table => {
  try {
    const { error } = supabase.from(table).select('count').limit(1);
    return !!error;
  } catch {
    return true;
  }
}).length;
const missingAPIs = apiRoutes.filter(route => !fs.existsSync(path.join(process.cwd(), route))).length;
const missingComponents = components.filter(comp => !fs.existsSync(path.join(process.cwd(), comp))).length;

if (missingEnv === 0 && missingTables === 0 && missingAPIs === 0 && missingComponents === 0) {
  console.log('🎉 SPOTIFY GUEST INTEGRATION: FULLY OPERATIONAL');
  console.log('\n📋 Next Steps:');
  console.log('1. Test guest invite flow: /admin → Events → Select Event → Guest Management');
  console.log('2. Add a guest with your email');
  console.log('3. Copy the invite link and test the full flow');
  console.log('4. Check music analysis after guest connects');
} else {
  console.log('⚠️  SPOTIFY GUEST INTEGRATION: PARTIALLY CONFIGURED');
  
  if (missingEnv > 0) {
    console.log(`\n❌ Missing Environment Variables: ${missingEnv}`);
    console.log('Fix: Add missing env vars to .env.local');
  }
  
  if (missingTables > 0) {
    console.log(`\n❌ Missing Database Tables: ${missingTables}`);
    console.log('Fix: Run migration 025 in Supabase Dashboard');
  }
  
  if (missingAPIs > 0) {
    console.log(`\n❌ Missing API Routes: ${missingAPIs}`);
    console.log('Fix: Check the missing API route files');
  }
  
  if (missingComponents > 0) {
    console.log(`\n❌ Missing Components: ${missingComponents}`);
    console.log('Fix: Check the missing component files');
  }
}

console.log('\n🔗 Useful Links:');
console.log('- Spotify Developer Dashboard: https://developer.spotify.com/dashboard');
console.log('- Migration File: supabase/migrations/025_spotify_guest_integration.sql');
console.log('- Setup Guide: docs/SPOTIFY_GUEST_SETUP.md');
console.log('- Complete Documentation: SPOTIFY_INTEGRATION_COMPLETE.md');
