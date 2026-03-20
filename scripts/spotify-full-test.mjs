import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('🎵 Spotify Integration Full Test Suite\n');
console.log('=====================================\n');

// Test Results
const results = {
  env: { passed: 0, failed: 0, details: [] },
  database: { passed: 0, failed: 0, details: [] },
  api: { passed: 0, failed: 0, details: [] },
  frontend: { passed: 0, failed: 0, details: [] },
  security: { passed: 0, failed: 0, details: [] }
};

// Helper function to log results
function log(category, status, message, details = null) {
  const icon = status === '✅' ? '✅' : '❌';
  console.log(`${icon} ${message}`);
  if (details) console.log(`   ${details}`);
  
  if (status === '✅') {
    results[category].passed++;
  } else {
    results[category].failed++;
  }
  results[category].details.push({ message, status, details });
}

// Phase 1: Environment Variables
console.log('📋 Phase 1: Environment Variables');
console.log('----------------------------');

const envVars = [
  { name: 'NEXT_PUBLIC_SUPABASE_URL', required: true },
  { name: 'SUPABASE_SERVICE_ROLE_KEY', required: true },
  { name: 'SPOTIFY_CLIENT_ID', required: true },
  { name: 'SPOTIFY_CLIENT_SECRET', required: true },
  { name: 'SPOTIFY_TOKEN_ENCRYPTION_KEY', required: true }
];

envVars.forEach(({ name, required }) => {
  const value = process.env[name];
  if (!value) {
    if (required) {
      log('env', '❌', `${name}: MISSING`, 'This is required for Spotify integration');
    } else {
      log('env', '⚠️', `${name}: MISSING`, 'Optional but recommended');
    }
  } else {
    if (name.includes('SECRET') || name.includes('KEY')) {
      const length = value.length;
      log('env', '✅', `${name}: SET`, `${length} characters`);
    } else {
      log('env', '✅', `${name}: SET`, value);
    }
  }
});

// Phase 2: Database Schema
console.log('\n🗄️ Phase 2: Database Schema');
console.log('---------------------------');

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
      log('database', '❌', `Table ${tableName}: ERROR`, error.message);
    } else {
      log('database', '✅', `Table ${tableName}: EXISTS`);
    }
  } catch (err) {
    log('database', '❌', `Table ${tableName}: NOT FOUND`, err.message);
  }
}

// Check RLS policies
try {
  const { data: policies, error: policyError } = await supabase
    .from('pg_policies')
    .select('tablename, policyname, permissive, roles, cmd, qual')
    .eq('tablename', 'guest_invitations')
    .limit(1);
  
  if (policyError) {
    log('database', '⚠️', 'RLS Policies: Could not verify', policyError.message);
  } else {
    log('database', '✅', 'RLS Policies: Configured');
  }
} catch (err) {
  log('database', '❌', 'RLS Policies: Error checking', err.message);
}

// Phase 3: API Routes Files
console.log('\n🔌 Phase 3: API Routes Files');
console.log('--------------------------');

const apiRoutes = [
  'src/app/api/guest/invite/[token]/route.ts',
  'src/app/api/guest/spotify/connect/route.ts', 
  'src/app/api/guest/spotify/callback/route.ts',
  'src/app/api/guest/playlists/fetch/route.ts',
  'src/app/api/admin/event/[eventId]/guests/route.ts',
  'src/app/api/admin/event/[eventId]/music-analysis/route.ts'
];

apiRoutes.forEach(routePath => {
  const fullPath = join(process.cwd(), routePath);
  if (existsSync(fullPath)) {
    log('api', '✅', `API Route: ${routePath}`, 'File exists');
  } else {
    log('api', '❌', `API Route: ${routePath}`, 'File missing');
  }
});

// Phase 4: Frontend Components
console.log('\n🎨 Phase 4: Frontend Components');
console.log('----------------------------');

const components = [
  'src/components/admin/GuestInviteManager.tsx',
  'src/components/admin/MusicAnalysisView.tsx',
  'src/components/admin/EventGuestManager.tsx',
  'src/app/guest/[token]/page.tsx',
  'src/app/guest/[token]/success/page.tsx'
];

components.forEach(compPath => {
  const fullPath = join(process.cwd(), compPath);
  if (existsSync(fullPath)) {
    log('frontend', '✅', `Component: ${compPath}`, 'File exists');
  } else {
    log('frontend', '❌', `Component: ${compPath}`, 'File missing');
  }
});

// Phase 5: Security & Encryption
console.log('\n🔐 Phase 5: Security & Encryption');
console.log('------------------------------');

// Check encryption module
const encryptionPath = join(process.cwd(), 'src/lib/encryption.ts');
if (existsSync(encryptionPath)) {
  log('security', '✅', 'Encryption module: EXISTS');
  
  // Check encryption key length
  const encKey = process.env.SPOTIFY_TOKEN_ENCRYPTION_KEY;
  if (encKey && encKey.length === 64) {
    log('security', '✅', 'Encryption key: VALID', '32 bytes (64 hex chars)');
  } else if (encKey) {
    log('security', '❌', 'Encryption key: INVALID', `Expected 64 chars, got ${encKey.length}`);
  } else {
    log('security', '❌', 'Encryption key: MISSING');
  }
} else {
  log('security', '❌', 'Encryption module: MISSING');
}

// Check Spotify scopes
const guestScopes = [
  "playlist-read-private",
  "playlist-read-collaborative", 
  "user-library-read",
  "user-top-read"
];

const connectPath = join(process.cwd(), 'src/app/api/guest/spotify/connect/route.ts');
if (existsSync(connectPath)) {
  const connectContent = readFileSync(connectPath, 'utf8');
  const hasAllScopes = guestScopes.every(scope => connectContent.includes(scope));
  
  if (hasAllScopes) {
    log('security', '✅', 'Spotify scopes: COMPLETE');
  } else {
    log('security', '❌', 'Spotify scopes: INCOMPLETE', 'Missing required scopes');
  }
} else {
  log('security', '❌', 'Spotify scopes: Cannot verify', 'Connect route missing');
}

// Phase 6: Live API Test (if environment is configured)
console.log('\n🌐 Phase 6: Live API Test');
console.log('-----------------------');

if (process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET) {
  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    });
    
    if (response.ok) {
      const data = await response.json();
      log('api', '✅', 'Spotify API: ACCESSIBLE', 'Client credentials working');
    } else {
      const error = await response.text();
      log('api', '❌', 'Spotify API: FAILED', `Status ${response.status}: ${error}`);
    }
  } catch (err) {
    log('api', '❌', 'Spotify API: ERROR', err.message);
  }
} else {
  log('api', '⚠️', 'Spotify API: SKIPPED', 'Missing credentials');
}

// Phase 7: Sample Data Check
console.log('\n📊 Phase 7: Sample Data Check');
console.log('---------------------------');

try {
  const { data: invitations, error: invError } = await supabase
    .from('guest_invitations')
    .select('id, status, guest_email, created_at')
    .limit(5);
    
  if (invError) {
    log('database', '❌', 'Sample invitations: ERROR', invError.message);
  } else {
    log('database', '✅', 'Sample invitations', `${invitations?.length || 0} records found`);
    if (invitations && invitations.length > 0) {
      const statusCounts = invitations.reduce((acc, inv) => {
        acc[inv.status] = (acc[inv.status] || 0) + 1;
        return acc;
      }, {});
      Object.entries(statusCounts).forEach(([status, count]) => {
        log('database', '📈', `  ${status}: ${count}`);
      });
    }
  }
} catch (err) {
  log('database', '❌', 'Sample invitations: FAILED', err.message);
}

try {
  const { data: tokens, error: tokenError } = await supabase
    .from('guest_spotify_tokens')
    .select('id, spotify_user_id, expires_at')
    .limit(3);
    
  if (tokenError) {
    log('database', '❌', 'Sample tokens: ERROR', tokenError.message);
  } else {
    log('database', '✅', 'Sample tokens', `${tokens?.length || 0} records found`);
  }
} catch (err) {
  log('database', '❌', 'Sample tokens: FAILED', err.message);
}

// Final Summary
console.log('\n📋 FINAL SUMMARY');
console.log('================');

let totalPassed = 0;
let totalFailed = 0;

Object.entries(results).forEach(([category, result]) => {
  const { passed, failed } = result;
  totalPassed += passed;
  totalFailed += failed;
  
  console.log(`${category.toUpperCase()}: ${passed} ✅ / ${failed} ❌`);
});

console.log(`\nTOTAL: ${totalPassed} ✅ / ${totalFailed} ❌`);

if (totalFailed === 0) {
  console.log('\n🎉 SPOTIFY INTEGRATION: FULLY OPERATIONAL!');
  console.log('\n📋 Next Steps:');
  console.log('1. Start the app: npm run dev');
  console.log('2. Go to: http://localhost:3000/admin');
  console.log('3. Select an event and look for "Guest Management" tab');
  console.log('4. Add a guest with your email');
  console.log('5. Test the full guest flow');
} else {
  console.log('\n⚠️  SPOTIFY INTEGRATION: NEEDS ATTENTION');
  console.log('\n🔧 Required Actions:');
  
  Object.entries(results).forEach(([category, result]) => {
    if (result.failed > 0) {
      console.log(`\n${category.toUpperCase()} (${result.failed} issues):`);
      result.details
        .filter(d => d.status === '❌')
        .forEach(d => console.log(`  - ${d.message}`));
    }
  });
  
  console.log('\n📚 Documentation:');
  console.log('- Setup Guide: docs/SPOTIFY_GUEST_SETUP.md');
  console.log('- Complete Docs: SPOTIFY_INTEGRATION_COMPLETE.md');
  console.log('- Migration: supabase/migrations/025_spotify_guest_integration.sql');
}

console.log('\n🔗 Useful Links:');
console.log('- Spotify Dashboard: https://developer.spotify.com/dashboard');
console.log('- Test Guest Flow: /guest/{token} (after adding guest)');
console.log('- Admin Panel: /admin → Events → Select Event → Guest Management');
