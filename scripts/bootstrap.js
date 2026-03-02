#!/usr/bin/env node
/**
 * Compakt Bootstrap Script
 * Run once after cloning / setting up .env.local
 * Usage: npm run setup
 *
 * What it does:
 * 1. Validates required environment variables
 * 2. Creates Supabase Storage bucket (dj-media) if missing
 * 3. Runs SQL migrations against Supabase (if not already applied)
 */

const fs = require("fs");
const path = require("path");

// ── Load .env.local manually (no dotenv dependency) ──────────────────────
function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const lines = fs.readFileSync(filePath, "utf-8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    // Remove surrounding quotes
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = val;
    }
  }
}

loadEnvFile(path.resolve(__dirname, "..", ".env.local"));
loadEnvFile(path.resolve(__dirname, "..", ".env"));

// ── Helpers ──────────────────────────────────────────────────────────────
const OK = "\x1b[32m✓\x1b[0m";
const FAIL = "\x1b[31m✗\x1b[0m";
const WARN = "\x1b[33m⚠\x1b[0m";
const BOLD = "\x1b[1m";
const RESET = "\x1b[0m";

function log(icon, msg) {
  console.log(`  ${icon} ${msg}`);
}

// ── 1. Validate env ─────────────────────────────────────────────────────
function validateEnv() {
  console.log(`\n${BOLD}── בדיקת משתני סביבה ──${RESET}`);

  const required = [
    ["NEXT_PUBLIC_SUPABASE_URL", "Supabase project URL"],
    ["NEXT_PUBLIC_SUPABASE_ANON_KEY", "Supabase anon key"],
    ["SUPABASE_SERVICE_ROLE_KEY", "Supabase service role key (for bootstrap only)"],
  ];

  const optional = [
    ["NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET", "Storage bucket name (default: dj-media)"],
    ["GOOGLE_CLIENT_ID", "Google OAuth (for Calendar sync)"],
    ["GOOGLE_CLIENT_SECRET", "Google OAuth secret"],
    ["GOOGLE_CALENDAR_REDIRECT_URI", "Google Calendar redirect URI"],
    ["SPOTIFY_CLIENT_ID", "Spotify (for playlist import)"],
    ["SPOTIFY_CLIENT_SECRET", "Spotify secret"],
  ];

  let allGood = true;
  for (const [key, desc] of required) {
    if (process.env[key]) {
      log(OK, `${key} — ${desc}`);
    } else {
      log(FAIL, `${key} — ${desc} — ${BOLD}חסר!${RESET}`);
      allGood = false;
    }
  }

  for (const [key, desc] of optional) {
    if (process.env[key]) {
      log(OK, `${key} — ${desc}`);
    } else {
      log(WARN, `${key} — ${desc} (אופציונלי, לא מוגדר)`);
    }
  }

  if (!allGood) {
    console.error(`\n${FAIL} חסרים משתני סביבה חובה. עדכנו .env.local ונסו שוב.`);
    process.exit(1);
  }

  return true;
}

// ── 2. Ensure Storage bucket ────────────────────────────────────────────
async function ensureBucket() {
  console.log(`\n${BOLD}── יצירת Storage Bucket ──${RESET}`);

  const { createClient } = require("@supabase/supabase-js");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucketName = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || "dj-media";

  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // List existing buckets
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) {
    log(FAIL, `שגיאה ברשימת buckets: ${listError.message}`);
    return false;
  }

  const exists = (buckets || []).some((b) => b.name === bucketName);
  if (exists) {
    log(OK, `Bucket '${bucketName}' כבר קיים`);
    return true;
  }

  // Create bucket
  const { error: createError } = await supabase.storage.createBucket(bucketName, {
    public: true,
  });

  if (createError) {
    log(FAIL, `נכשל ביצירת bucket '${bucketName}': ${createError.message}`);
    return false;
  }

  log(OK, `Bucket '${bucketName}' נוצר בהצלחה (public)`);
  return true;
}

// ── 3. Check DB tables (verify migrations were applied) ─────────────────
async function checkDB() {
  console.log(`\n${BOLD}── בדיקת טבלאות בדאטאבייס ──${RESET}`);

  const { createClient } = require("@supabase/supabase-js");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const tables = ["profiles", "events", "dj_events", "event_screenshots", "songs", "questions", "upsells"];
  let missing = [];

  for (const table of tables) {
    const { error } = await supabase.from(table).select("*").limit(0);
    if (error) {
      log(FAIL, `טבלה '${table}' — לא נמצאה`);
      missing.push(table);
    } else {
      log(OK, `טבלה '${table}' — קיימת`);
    }
  }

  if (missing.length > 0) {
    console.log(`\n  ${WARN} ${BOLD}טבלאות חסרות.${RESET} הריצו את המיגרציות ב-Supabase SQL Editor:`);
    const migrationsDir = path.resolve(__dirname, "..", "supabase", "migrations");
    if (fs.existsSync(migrationsDir)) {
      const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith(".sql")).sort();
      for (const file of files) {
        console.log(`     → supabase/migrations/${file}`);
      }
    }
    return false;
  }

  return true;
}

// ── Main ────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n${BOLD}🎵 Compakt Bootstrap${RESET}\n`);

  validateEnv();

  const bucketOk = await ensureBucket();
  const dbOk = await checkDB();

  console.log(`\n${BOLD}── סיכום ──${RESET}`);
  log(bucketOk ? OK : FAIL, `Storage bucket ${bucketOk ? "מוכן" : "— נכשל (ראו למעלה)"}`);
  log(dbOk ? OK : FAIL, `טבלאות DB ${dbOk ? "קיימות" : "— חסרות (הריצו migrations)"}`);

  if (bucketOk && dbOk) {
    console.log(`\n  ${OK} ${BOLD}הכל מוכן! הפעילו: npm run dev${RESET}\n`);
  } else {
    console.log(`\n  ${WARN} ${BOLD}תקנו את הבעיות למעלה והריצו שוב: npm run setup${RESET}\n`);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error("Bootstrap failed:", e);
  process.exit(1);
});
