#!/usr/bin/env bash
# ============================================================
# Phase 1 Auth Smoke Tests
# Run against a running dev server: ./scripts/smoke-test-auth.sh [BASE_URL]
# ============================================================

BASE="${1:-http://localhost:3000}"
PASS=0
FAIL=0

check() {
  local name="$1"
  local expected="$2"
  local actual="$3"

  if [ "$actual" = "$expected" ]; then
    echo "  ✅ $name (HTTP $actual)"
    PASS=$((PASS + 1))
  else
    echo "  ❌ $name — expected $expected, got $actual"
    FAIL=$((FAIL + 1))
  fi
}

echo ""
echo "🔒 Phase 1 Auth Smoke Tests"
echo "   Target: $BASE"
echo "   $(date)"
echo ""

# ─── 1. Unauthenticated API calls should return 401 ───
echo "── Test Group 1: Unauthenticated → 401 ──"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/admin/profile")
check "GET /api/admin/profile" "401" "$STATUS"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/admin/events")
check "GET /api/admin/events" "401" "$STATUS"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/admin/db-health")
check "GET /api/admin/db-health" "401" "$STATUS"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/admin/couple-link")
check "GET /api/admin/couple-link" "401" "$STATUS"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST -H "Content-Type: application/json" -d '{}' "$BASE/api/admin/ensure-profile")
check "POST /api/admin/ensure-profile" "401" "$STATUS"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST -H "Content-Type: application/json" -d '{}' "$BASE/api/admin/ensure-defaults")
check "POST /api/admin/ensure-defaults" "401" "$STATUS"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST -H "Content-Type: application/json" -d '{}' "$BASE/api/admin/profile")
check "POST /api/admin/profile" "401" "$STATUS"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST -F "file=@/dev/null" "$BASE/api/admin/upload")
check "POST /api/admin/upload" "401" "$STATUS"

echo ""

# ─── 2. HQ API without auth should return 401 ───
echo "── Test Group 2: HQ API unauthenticated → 401 ──"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/hq/profiles")
check "GET /api/hq/profiles" "401" "$STATUS"

echo ""

# ─── 3. Public routes should still work ───
echo "── Test Group 3: Public routes still accessible ──"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/")
check "GET / (main page)" "200" "$STATUS"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/health")
check "GET /api/health" "200" "$STATUS"

echo ""

# ─── Summary ───
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Results: $PASS passed, $FAIL failed"
if [ "$FAIL" -eq 0 ]; then
  echo "  🎉 All tests passed!"
else
  echo "  ⚠️  $FAIL test(s) failed"
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

exit "$FAIL"
