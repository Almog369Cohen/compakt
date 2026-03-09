#!/usr/bin/env bash
# =============================================================
# Audit Verification Pack
# Checks all P0/P1 items from AUDIT_GAP_FIX_PLAN.md
# Usage: bash scripts/verify-audit.sh [base_url]
# =============================================================
set -uo pipefail

BASE="${1:-http://localhost:3000}"
PASS=0
FAIL=0
WARN=0

green()  { printf "\033[32m%s\033[0m" "$1"; }
red()    { printf "\033[31m%s\033[0m" "$1"; }
yellow() { printf "\033[33m%s\033[0m" "$1"; }
bold()   { printf "\033[1m%s\033[0m\n" "$1"; }

check() {
  local label="$1" status="$2" detail="$3"
  if [ "$status" = "pass" ]; then
    echo "  $(green '✓') $label"
    PASS=$((PASS+1))
  elif [ "$status" = "warn" ]; then
    echo "  $(yellow '⚠') $label — $detail"
    WARN=$((WARN+1))
  else
    echo "  $(red '✗') $label — $detail"
    FAIL=$((FAIL+1))
  fi
}

# =============================================================
bold "═══ SECTION 1: Static Code Checks ═══"
# =============================================================

# P0-1: GCal sync targets wrong table
GCAL_SYNC="src/app/api/gcal/sync/route.ts"
if [ -f "$GCAL_SYNC" ]; then
  EVENTS_REFS=$(grep -c '\.from("events")' "$GCAL_SYNC" 2>/dev/null | tr -dc '0-9' || echo "0")
  DJ_EVENTS_REFS=$(grep -c '\.from("dj_events")' "$GCAL_SYNC" 2>/dev/null | tr -dc '0-9' || echo "0")
  [ -z "$EVENTS_REFS" ] && EVENTS_REFS=0
  [ -z "$DJ_EVENTS_REFS" ] && DJ_EVENTS_REFS=0
  if [ "$EVENTS_REFS" -gt 0 ] && [ "$DJ_EVENTS_REFS" -eq 0 ]; then
    check "P0-1: GCal sync uses dj_events (not events)" "fail" "Found $EVENTS_REFS refs to .from(\"events\"), 0 to .from(\"dj_events\")"
  elif [ "$DJ_EVENTS_REFS" -gt 0 ]; then
    check "P0-1: GCal sync uses dj_events (not events)" "pass" ""
  else
    check "P0-1: GCal sync uses dj_events (not events)" "warn" "Could not determine table usage"
  fi
else
  check "P0-1: GCal sync file exists" "fail" "$GCAL_SYNC not found"
fi

# P0-3: OTP brute-force protection
VERIFY_OTP="src/app/api/auth/phone/verify-otp/route.ts"
if [ -f "$VERIFY_OTP" ]; then
  HAS_ATTEMPT_CHECK=$(grep -c 'otp_attempts\|attempt' "$VERIFY_OTP" 2>/dev/null | tr -dc '0-9' || echo "0")
  [ -z "$HAS_ATTEMPT_CHECK" ] && HAS_ATTEMPT_CHECK=0
  if [ "$HAS_ATTEMPT_CHECK" -gt 0 ]; then
    check "P0-3: OTP brute-force protection" "pass" ""
  else
    check "P0-3: OTP brute-force protection" "fail" "No attempt limiting in verify-otp route"
  fi
else
  check "P0-3: OTP verify route exists" "fail" "$VERIFY_OTP not found"
fi

# P1-9: Admin store mock data
ADMIN_STORE="src/stores/adminStore.ts"
if [ -f "$ADMIN_STORE" ]; then
  HAS_DEFAULTS=$(grep -c 'songs: defaultSongs\|questions: defaultQuestions\|upsells: defaultUpsells' "$ADMIN_STORE" 2>/dev/null | tr -dc '0-9' || echo "0")
  [ -z "$HAS_DEFAULTS" ] && HAS_DEFAULTS=0
  if [ "$HAS_DEFAULTS" -gt 0 ]; then
    check "P1-9: Admin store uses empty defaults (not mock data)" "warn" "Still initializes with mock defaults ($HAS_DEFAULTS refs)"
  else
    check "P1-9: Admin store uses empty defaults (not mock data)" "pass" ""
  fi
fi

# P1-10: Resume flow restores Zustand state
PAGE_TSX="src/app/page.tsx"
if [ -f "$PAGE_TSX" ]; then
  HAS_RESTORE=$(grep -c 'restoreFromResume\|setAnswers\|setSwipes\|bulkRestore' "$PAGE_TSX" 2>/dev/null | tr -dc '0-9' || echo "0")
  [ -z "$HAS_RESTORE" ] && HAS_RESTORE=0
  if [ "$HAS_RESTORE" -gt 0 ]; then
    check "P1-10: Resume flow restores answers/swipes into store" "pass" ""
  else
    check "P1-10: Resume flow restores answers/swipes into store" "fail" "handleResume doesn't populate eventStore with resumeData"
  fi
fi

# P0-15 / P0-1: GCal unique index on correct table
MIGRATION_015="supabase/migrations/015_gcal_tokens.sql"
if [ -f "$MIGRATION_015" ]; then
  HAS_DJ_EVENTS_IDX=$(grep -c 'dj_events' "$MIGRATION_015" 2>/dev/null | tr -dc '0-9' || echo "0")
  HAS_EVENTS_IDX=$(grep -c 'ON events' "$MIGRATION_015" 2>/dev/null | tr -dc '0-9' || echo "0")
  [ -z "$HAS_DJ_EVENTS_IDX" ] && HAS_DJ_EVENTS_IDX=0
  [ -z "$HAS_EVENTS_IDX" ] && HAS_EVENTS_IDX=0
  if [ "$HAS_EVENTS_IDX" -gt 0 ] && [ "$HAS_DJ_EVENTS_IDX" -eq 0 ]; then
    check "P2-15: GCal unique index on dj_events (not events)" "warn" "Index targets 'events' table, should be 'dj_events'"
  else
    check "P2-15: GCal unique index on dj_events (not events)" "pass" ""
  fi
fi

# Check TypeScript compilation
bold ""
bold "═══ SECTION 2: TypeScript Check ═══"
if command -v npx &>/dev/null; then
  TSC_OUTPUT=$(npx tsc --noEmit 2>&1 || true)
  TSC_ERRORS=$(echo "$TSC_OUTPUT" | grep -c "error TS" 2>/dev/null | tr -dc '0-9' || echo "0")
  [ -z "$TSC_ERRORS" ] && TSC_ERRORS=0
  if [ "$TSC_ERRORS" -eq 0 ]; then
    check "TypeScript compiles without errors" "pass" ""
  else
    check "TypeScript compiles without errors" "fail" "$TSC_ERRORS TS errors found"
  fi
else
  check "TypeScript check" "warn" "npx not available"
fi

# =============================================================
bold ""
bold "═══ SECTION 3: API Health Checks (requires running server at $BASE) ═══"
# =============================================================

# Check if server is reachable
HEALTH_HTTP=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/api/health" 2>/dev/null | tr -dc '0-9' || echo "000")
[ -z "$HEALTH_HTTP" ] && HEALTH_HTTP="000"
if [ "$HEALTH_HTTP" = "000" ] || [ "$HEALTH_HTTP" = "0" ]; then
  check "Server reachable at $BASE" "warn" "Server not running — skipping API checks"
  bold ""
  bold "  ℹ Start the dev server with: npm run dev"
  bold "  Then re-run: bash scripts/verify-audit.sh"
else
  check "Server reachable at $BASE" "pass" ""

  # DB Health (no profile)
  DH_HTTP=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/api/admin/db-health" 2>/dev/null || echo "000")
  check "GET /api/admin/db-health returns 200" "$([ "$DH_HTTP" = "200" ] && echo pass || echo fail)" "HTTP $DH_HTTP"

  if [ "$DH_HTTP" = "200" ]; then
    DH_RES=$(curl -sf "$BASE/api/admin/db-health" 2>/dev/null || echo '{}')
    DH_HEALTHY=$(echo "$DH_RES" | python3 -c "import sys,json; print(json.load(sys.stdin).get('healthy',False))" 2>/dev/null || echo "False")
    check "DB health: all core tables accessible" "$([ "$DH_HEALTHY" = "True" ] && echo pass || echo fail)" "healthy=$DH_HEALTHY"

    # Check optional tables (P0-2)
    for TABLE in dj_events event_screenshots event_sessions analytics_events; do
      STATUS=$(echo "$DH_RES" | python3 -c "
import sys,json
checks = json.load(sys.stdin).get('checks',[])
c = [x for x in checks if x['name'] == 'table_exists_$TABLE']
print(c[0]['status'] if c else 'missing')
" 2>/dev/null || echo "missing")
      if [ "$STATUS" = "pass" ]; then
        check "P0-2: Table '$TABLE' exists" "pass" ""
      else
        check "P0-2: Table '$TABLE' exists" "fail" "Run migration — status=$STATUS"
      fi
    done
  fi

  # Analytics endpoint
  AN_HTTP=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$BASE/api/analytics/track" \
    -H 'Content-Type: application/json' \
    -d '{"eventName":"audit_verify","category":"test"}' 2>/dev/null || echo "000")
  check "POST /api/analytics/track" "$([ "$AN_HTTP" = "200" ] && echo pass || echo fail)" "HTTP $AN_HTTP"
fi

# =============================================================
bold ""
bold "═══ SECTION 4: File Structure Checks ═══"
# =============================================================

REQUIRED_FILES=(
  "src/lib/supabase.ts"
  "src/lib/types.ts"
  "src/lib/storage.ts"
  "src/stores/adminStore.ts"
  "src/stores/profileStore.ts"
  "src/stores/eventStore.ts"
  "src/stores/eventsStore.ts"
  "src/components/auth/PhoneGate.tsx"
  "src/components/stages/EventSetup.tsx"
  "src/components/stages/QuestionFlow.tsx"
  "src/components/stages/SongTinder.tsx"
  "src/components/stages/DreamsRequests.tsx"
  "src/components/stages/MusicBrief.tsx"
  "src/components/admin/EventsManager.tsx"
  "src/components/admin/ProfileSettings.tsx"
  "src/components/admin/CoupleLinks.tsx"
  "src/components/dj/DJProfilePreview.tsx"
  "src/components/ui/ImageUploader.tsx"
  "src/components/ui/StageNav.tsx"
  "src/app/page.tsx"
  "src/app/admin/page.tsx"
  "src/app/dj/[slug]/page.tsx"
  "src/app/api/admin/events/route.ts"
  "src/app/api/admin/profile/route.ts"
  "src/app/api/admin/couple-link/route.ts"
  "src/app/api/admin/ensure-defaults/route.ts"
  "src/app/api/admin/db-health/route.ts"
  "src/app/api/admin/upload/route.ts"
  "src/app/api/auth/phone/send-otp/route.ts"
  "src/app/api/auth/phone/verify-otp/route.ts"
  "src/app/api/analytics/track/route.ts"
  "src/app/api/gcal/connect/route.ts"
  "src/app/api/gcal/callback/route.ts"
  "src/app/api/gcal/sync/route.ts"
  "src/hooks/useAnalytics.ts"
  "supabase/migrations/013_profiles_and_events.sql"
  "supabase/migrations/014_events.sql"
  "supabase/migrations/015_gcal_tokens.sql"
  "supabase/migrations/016_phone_auth_and_analytics.sql"
)

MISSING=0
for f in "${REQUIRED_FILES[@]}"; do
  if [ ! -f "$f" ]; then
    check "File exists: $f" "fail" "MISSING"
    MISSING=$((MISSING+1))
  fi
done
if [ "$MISSING" -eq 0 ]; then
  check "All ${#REQUIRED_FILES[@]} required files present" "pass" ""
fi

# =============================================================
# Summary
# =============================================================
bold ""
bold "════════════════════════════════════════"
TOTAL=$((PASS+FAIL+WARN))
echo "  Total: $TOTAL  |  $(green "PASS: $PASS")  |  $(red "FAIL: $FAIL")  |  $(yellow "WARN: $WARN")"
bold "════════════════════════════════════════"
echo ""

if [ "$FAIL" -gt 0 ]; then
  red "AUDIT VERIFICATION: $FAIL issue(s) need attention."
  echo ""
  echo "  See AUDIT_GAP_FIX_PLAN.md for remediation steps."
  exit 1
else
  if [ "$WARN" -gt 0 ]; then
    yellow "AUDIT VERIFICATION: All critical checks pass, $WARN warning(s)."
  else
    green "AUDIT VERIFICATION: ALL CLEAR."
  fi
  echo ""
  exit 0
fi
