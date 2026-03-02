// Quick script to inspect actual DB column names
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Parse .env.local manually
const envFile = readFileSync('.env.local', 'utf8');
for (const line of envFile.split('\n')) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) process.env[m[1].trim()] = m[2].trim();
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) { console.error('Missing env vars'); process.exit(1); }

const sb = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

// Query actual column names from information_schema via RPC
const { data: cols, error: colErr } = await sb.rpc('', {}).then(() => null).catch(() => null) || {};

// Use raw SQL via the REST API
const restUrl = `${url}/rest/v1/rpc/`;

// Alternative: try inserting with magic_token vs token to see which column exists
console.log('=== Testing events column names ===');

// Test 1: Try selecting magic_token
const t1 = await sb.from('events').select('magic_token').limit(0);
console.log(`SELECT magic_token: ${t1.error ? 'ERROR - ' + t1.error.message : 'OK'}`);

// Test 2: Try selecting token
const t2 = await sb.from('events').select('token').limit(0);
console.log(`SELECT token: ${t2.error ? 'ERROR - ' + t2.error.message : 'OK'}`);

// Test 3: Try selecting dj_id
const t3 = await sb.from('events').select('dj_id').limit(0);
console.log(`SELECT dj_id: ${t3.error ? 'ERROR - ' + t3.error.message : 'OK'}`);

// Test 4: Try selecting phone_number
const t4 = await sb.from('events').select('phone_number').limit(0);
console.log(`SELECT phone_number: ${t4.error ? 'ERROR - ' + t4.error.message : 'OK'}`);

// Test 5: List ALL column names by inserting a dummy and reading the error
const t5 = await sb.from('events').select('id, magic_token, token, dj_id, event_type, couple_name_a, couple_name_b, event_date, venue, current_stage, phone_number, city, created_at, updated_at').limit(0);
console.log(`\nFull column test: ${t5.error ? 'ERROR - ' + t5.error.message : 'OK (all columns exist)'}`);

// Also check what profiles has for comparison
console.log('\n=== Profiles columns (from data) ===');
const { data: p } = await sb.from('profiles').select('*').limit(1);
if (p && p[0]) console.log(Object.keys(p[0]).join(', '));

// Check event_sessions columns
console.log('\n=== event_sessions column test ===');
const es1 = await sb.from('event_sessions').select('event_id, phone_number, otp_code, phone_verified, session_token').limit(0);
console.log(`event_sessions cols: ${es1.error ? 'ERROR - ' + es1.error.message : 'OK'}`);

// Probe all likely events columns one by one
console.log('\n=== Events: probe every likely column ===');
const eventCols = ['id', 'dj_id', 'magic_token', 'token', 'event_type', 'couple_name_a', 'couple_name_b',
  'event_date', 'venue', 'city', 'current_stage', 'phone_number', 'status', 'theme',
  'created_at', 'updated_at', 'google_event_id', 'notes'];
for (const col of eventCols) {
  const { error } = await sb.from('events').select(col).limit(0);
  console.log(`  events.${col}: ${error ? 'MISSING' : 'EXISTS'}`);
}

// Probe event_sessions columns
console.log('\n=== event_sessions: probe columns ===');
const sessionCols = ['id', 'event_id', 'phone_number', 'otp_code', 'otp_expires_at',
  'phone_verified', 'session_token', 'session_id', 'token', 'magic_token',
  'attempts', 'created_at', 'updated_at', 'verified_at'];
for (const col of sessionCols) {
  const { error } = await sb.from('event_sessions').select(col).limit(0);
  console.log(`  event_sessions.${col}: ${error ? 'MISSING' : 'EXISTS'}`);
}

// Row counts
console.log('\n=== Row counts ===');
const tables = ['events', 'profiles', 'songs', 'questions', 'upsells', 'answers', 'swipes', 'requests', 'event_sessions', 'analytics_events'];
for (const table of tables) {
  const { count, error } = await sb.from(table).select('*', { count: 'exact', head: true });
  console.log(`${table}: ${error ? 'ERROR' : count} rows`);
}
