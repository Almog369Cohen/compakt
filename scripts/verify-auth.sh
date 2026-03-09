#!/usr/bin/env bash
# ============================================================
# Auth & Supabase Connection E2E Smoke Tests
# Usage: bash scripts/verify-auth.sh [BASE_URL]
# Default: http://localhost:3000
# ============================================================
set -euo pipefail

BASE="${1:-http://localhost:3000}"
PASS=0; FAIL=0; WARN=0; TOTAL=0

bold() { printf "\033[1m%s\033[0m\n" "$*"; }
green() { printf "\033[32m  ✓ %s\033[0m\n" "$*"; }
red()   { printf "\033[31m  ✗ %s\033[0m\n" "$*"; }
yellow(){ printf "\033[33m  ⚠ %s\033[0m\n" "$*"; }

check() {
  TOTAL=$((TOTAL+1))
  local name="$1" status="$2" detail="${3:-}"
  if [ "$status" = "pass" ]; then
    PASS=$((PASS+1)); green "$name"
  elif [ "$status" = "warn" ]; then
    WARN=$((WARN+1)); yellow "$name — $detail"
  else
    FAIL=$((FAIL+1)); red "$name — $detail"
  fi
}

# ============================================================
bold ""
bold "═══ SECTION 1: Health & Config ═══"
# ============================================================

# 1.1 Server reachable
HEALTH_HTTP=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/api/health" 2>/dev/null | tr -dc '0-9' || echo "0")
[ -z "$HEALTH_HTTP" ] && HEALTH_HTTP="0"

if [ "$HEALTH_HTTP" = "0" ] || [ "$HEALTH_HTTP" = "000" ]; then
  check "Server reachable at $BASE" "fail" "Server not running (HTTP $HEALTH_HTTP)"
  bold ""
  bold "  ⛔ Cannot continue — start server with: npm run dev"
  bold ""
  echo "Total: $TOTAL | PASS: $PASS | FAIL: $FAIL | WARN: $WARN"
  exit 1
fi
check "Server reachable at $BASE" "pass"

# 1.2 Health endpoint returns 200
HEALTH_BODY=$(curl -sf "$BASE/api/health" 2>/dev/null || echo '{}')
HEALTH_OK=$(echo "$HEALTH_BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('ok',False))" 2>/dev/null || echo "False")

if [ "$HEALTH_OK" = "True" ]; then
  check "Health endpoint ok=true" "pass"
else
  check "Health endpoint ok=true" "fail" "Response: $HEALTH_BODY"
fi

# 1.3 Config flags
for FLAG in supabase_url_set supabase_anon_key_set supabase_service_key_set db_reachable; do
  VAL=$(echo "$HEALTH_BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('config',{}).get('$FLAG','missing'))" 2>/dev/null || echo "missing")
  if [ "$VAL" = "True" ]; then
    check "Config: $FLAG" "pass"
  elif [ "$VAL" = "missing" ]; then
    check "Config: $FLAG" "warn" "Not reported by health endpoint"
  else
    check "Config: $FLAG" "fail" "$FLAG = $VAL"
  fi
done

# ============================================================
bold ""
bold "═══ SECTION 2: Ensure Profile (API) ═══"
# ============================================================

# 2.1 ensure-profile with test UUID
TEST_USER_ID="00000000-0000-0000-0000-000000000099"
# First call
EP_BODY=$(curl -s -X POST "$BASE/api/admin/ensure-profile" \
  -H 'Content-Type: application/json' \
  -d "{\"userId\":\"$TEST_USER_ID\",\"email\":\"test@compakt.dev\"}" 2>/dev/null || echo '{}')
EP_HTTP=$(echo "$EP_BODY" | python3 -c "import sys,json; d=json.load(sys.stdin); print('200' if 'profile' in d else d.get('error','unknown'))" 2>/dev/null || echo "error")

if [ "$EP_HTTP" = "200" ]; then
  EP_PROFILE_ID=$(echo "$EP_BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('profile',{}).get('id',''))" 2>/dev/null || echo "")
  if [ -n "$EP_PROFILE_ID" ] && [ "$EP_PROFILE_ID" != "" ]; then
    check "ensure-profile returns profile" "pass"
  else
    check "ensure-profile returns profile" "fail" "No profile.id in response"
  fi

  # Idempotency: call again, should not error
  EP2_BODY=$(curl -s -X POST "$BASE/api/admin/ensure-profile" \
    -H 'Content-Type: application/json' \
    -d "{\"userId\":\"$TEST_USER_ID\"}" 2>/dev/null || echo '{}')
  EP2_OK=$(echo "$EP2_BODY" | python3 -c "import sys,json; print('ok' if 'profile' in json.load(sys.stdin) else 'fail')" 2>/dev/null || echo "fail")
  if [ "$EP2_OK" = "ok" ]; then
    check "ensure-profile idempotent (2nd call)" "pass"
  else
    check "ensure-profile idempotent (2nd call)" "fail" "$EP2_BODY"
  fi
else
  # Check if it's a FK constraint error (expected — test UUID not in auth.users)
  if echo "$EP_HTTP" | grep -qi "foreign\|violates\|fkey\|referenced"; then
    check "ensure-profile route works" "warn" "FK constraint (expected — test UUID not a real auth user)"
    check "ensure-profile idempotent" "warn" "Skipped (FK constraint on test UUID)"
  else
    check "ensure-profile route works" "fail" "$EP_HTTP"
    check "ensure-profile idempotent" "warn" "Skipped"
  fi
fi

# ============================================================
bold ""
bold "═══ SECTION 3: Profile API ═══"
# ============================================================

# 3.1 GET profile by first
PROF_HTTP=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/api/admin/profile?first=true" 2>/dev/null | tr -dc '0-9' || echo "0")
[ -z "$PROF_HTTP" ] && PROF_HTTP="0"
if [ "$PROF_HTTP" = "200" ]; then
  check "GET /api/admin/profile?first=true" "pass"
else
  check "GET /api/admin/profile?first=true" "fail" "HTTP $PROF_HTTP"
fi

# 3.2 DB health
DH_HTTP=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/api/admin/db-health" 2>/dev/null | tr -dc '0-9' || echo "0")
[ -z "$DH_HTTP" ] && DH_HTTP="0"
if [ "$DH_HTTP" = "200" ]; then
  check "GET /api/admin/db-health" "pass"
else
  check "GET /api/admin/db-health" "fail" "HTTP $DH_HTTP"
fi

# ============================================================
bold ""
bold "═══ SECTION 4: Ensure Defaults (API) ═══"
# ============================================================

# Get a real profileId from the DB (if any exist)
REAL_PROFILE_ID=$(curl -sf "$BASE/api/admin/profile?first=true" 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('data',d).get('id',''))" 2>/dev/null || echo "")

if [ -n "$REAL_PROFILE_ID" ] && [ "$REAL_PROFILE_ID" != "" ] && [ "$REAL_PROFILE_ID" != "None" ]; then
  ED_HTTP=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$BASE/api/admin/ensure-defaults" \
    -H 'Content-Type: application/json' \
    -d "{\"profileId\":\"$REAL_PROFILE_ID\"}" 2>/dev/null | tr -dc '0-9' || echo "0")
  [ -z "$ED_HTTP" ] && ED_HTTP="0"
  if [ "$ED_HTTP" = "200" ]; then
    check "ensure-defaults for existing profile" "pass"
  else
    check "ensure-defaults for existing profile" "fail" "HTTP $ED_HTTP"
  fi
else
  check "ensure-defaults for existing profile" "warn" "No profiles in DB yet — skipped"
fi

# ============================================================
bold ""
bold "═══ SECTION 5: Static Code Checks ═══"
# ============================================================

# 5.1 SERVICE_ROLE key not leaked to client
CLIENT_FILES=$(find src/components src/stores src/hooks src/app/page.tsx src/app/admin/page.tsx src/app/dj -name "*.ts" -o -name "*.tsx" 2>/dev/null || true)
LEAKED=$(echo "$CLIENT_FILES" | xargs grep -l 'SUPABASE_SERVICE_ROLE_KEY' 2>/dev/null || true)
if [ -z "$LEAKED" ]; then
  check "SERVICE_ROLE_KEY not in client code" "pass"
else
  check "SERVICE_ROLE_KEY not in client code" "fail" "Found in: $LEAKED"
fi

# 5.2 ensure-profile route exists
if [ -f "src/app/api/admin/ensure-profile/route.ts" ]; then
  check "ensure-profile route file exists" "pass"
else
  check "ensure-profile route file exists" "fail" "src/app/api/admin/ensure-profile/route.ts not found"
fi

# 5.3 admin page calls ensure-profile
ADMIN_CALLS_EP=$(grep -c 'ensure-profile' src/app/admin/page.tsx 2>/dev/null | tr -dc '0-9' || echo "0")
[ -z "$ADMIN_CALLS_EP" ] && ADMIN_CALLS_EP="0"
if [ "$ADMIN_CALLS_EP" -gt 0 ]; then
  check "Admin page calls ensure-profile on auth" "pass"
else
  check "Admin page calls ensure-profile on auth" "fail" "No reference to ensure-profile in admin/page.tsx"
fi

# 5.4 TypeScript compiles
bold ""
bold "═══ SECTION 6: TypeScript Check ═══"
if command -v npx &>/dev/null; then
  TSC_OUTPUT=$(npx tsc --noEmit 2>&1 || true)
  TSC_ERRORS=$(echo "$TSC_OUTPUT" | grep -c "error TS" 2>/dev/null | tr -dc '0-9' || echo "0")
  [ -z "$TSC_ERRORS" ] && TSC_ERRORS=0
  if [ "$TSC_ERRORS" -eq 0 ]; then
    check "TypeScript compiles without errors" "pass"
  else
    check "TypeScript compiles without errors" "fail" "$TSC_ERRORS TS errors"
  fi
else
  check "TypeScript check" "warn" "npx not available"
fi

# ============================================================
bold ""
bold "═══════════════════════════════════════"
echo "Total: $TOTAL | PASS: $PASS | FAIL: $FAIL | WARN: $WARN"
bold "═══════════════════════════════════════"
bold ""

if [ "$FAIL" -gt 0 ]; then
  bold "AUTH VERIFICATION: $FAIL issue(s) need attention."
  exit 1
else
  bold "AUTH VERIFICATION: All checks passed! ✅"
  exit 0
fi
