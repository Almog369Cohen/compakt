#!/usr/bin/env bash
# =============================================================
# DB Health & Sync Verification — Automated Script
# Runs all checks against the live API. Exit 1 on any failure.
# =============================================================
set -euo pipefail

BASE="${1:-http://localhost:3000}"
PASS=0
FAIL=0
WARN=0

green()  { printf "\033[32m%s\033[0m\n" "$1"; }
red()    { printf "\033[31m%s\033[0m\n" "$1"; }
yellow() { printf "\033[33m%s\033[0m\n" "$1"; }
bold()   { printf "\033[1m%s\033[0m\n" "$1"; }

assert_eq() {
  local label="$1" expected="$2" actual="$3"
  if [ "$expected" = "$actual" ]; then
    green "  PASS: $label (expected=$expected)"
    PASS=$((PASS+1))
  else
    red "  FAIL: $label (expected=$expected, got=$actual)"
    FAIL=$((FAIL+1))
  fi
}

assert_not_empty() {
  local label="$1" val="$2"
  if [ -n "$val" ] && [ "$val" != "null" ] && [ "$val" != "" ]; then
    green "  PASS: $label is not empty ($val)"
    PASS=$((PASS+1))
  else
    red "  FAIL: $label is empty/null"
    FAIL=$((FAIL+1))
  fi
}

assert_gt() {
  local label="$1" threshold="$2" actual="$3"
  if [ "$actual" -gt "$threshold" ] 2>/dev/null; then
    green "  PASS: $label ($actual > $threshold)"
    PASS=$((PASS+1))
  else
    red "  FAIL: $label ($actual not > $threshold)"
    FAIL=$((FAIL+1))
  fi
}

assert_http() {
  local label="$1" expected="$2" actual="$3"
  if [ "$expected" = "$actual" ]; then
    green "  PASS: $label → HTTP $actual"
    PASS=$((PASS+1))
  else
    red "  FAIL: $label → HTTP $actual (expected $expected)"
    FAIL=$((FAIL+1))
  fi
}

# ---- Get a profile ID ----
bold "═══ Phase 1: Discover profile ═══"
PROFILE_RES=$(curl -sf "$BASE/api/admin/db-health" 2>/dev/null || echo '{}')
HTTP=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/api/admin/db-health")
assert_http "GET /api/admin/db-health" "200" "$HTTP"

# We need a real profileId — extract from Supabase via the ensure-defaults or use the known one
# Try to get profileId from the health endpoint first; if it doesn't expose it, we'll find it
# Actually let's hit the profile API if it exists, or use a known ID
# Let's try to list couple-links for profiles we know exist
bold ""
bold "═══ Phase 2: DB Health Check (no profile) ═══"
HEALTH_GLOBAL=$(curl -sf "$BASE/api/admin/db-health" 2>/dev/null)
HEALTHY=$(echo "$HEALTH_GLOBAL" | python3 -c "import sys,json; print(json.load(sys.stdin).get('healthy',''))" 2>/dev/null || echo "")
PASS_COUNT=$(echo "$HEALTH_GLOBAL" | python3 -c "import sys,json; print(json.load(sys.stdin).get('summary',{}).get('pass',0))" 2>/dev/null || echo "0")
FAIL_COUNT=$(echo "$HEALTH_GLOBAL" | python3 -c "import sys,json; print(json.load(sys.stdin).get('summary',{}).get('fail',0))" 2>/dev/null || echo "0")
WARN_COUNT=$(echo "$HEALTH_GLOBAL" | python3 -c "import sys,json; print(json.load(sys.stdin).get('summary',{}).get('warn',0))" 2>/dev/null || echo "0")
CHECK_TOTAL=$(echo "$HEALTH_GLOBAL" | python3 -c "import sys,json; print(len(json.load(sys.stdin).get('checks',[])))" 2>/dev/null || echo "0")

assert_gt "Health checks returned" "0" "$CHECK_TOTAL"
assert_eq "Global health (no profile) healthy" "True" "$HEALTHY"
echo "  Summary: pass=$PASS_COUNT warn=$WARN_COUNT fail=$FAIL_COUNT"

bold ""
bold "═══ Phase 3: DB Health Check (with profileId) ═══"
# Try to find a real profileId from the ensure-defaults or known value
# We'll try the known one from earlier session, and also try to discover dynamically
KNOWN_PROFILE="1a40dcd5-f80f-412d-8658-81bb3b333769"

HEALTH_DJ=$(curl -sf "$BASE/api/admin/db-health?profileId=$KNOWN_PROFILE" 2>/dev/null || echo '{}')
DJ_HEALTHY=$(echo "$HEALTH_DJ" | python3 -c "import sys,json; print(json.load(sys.stdin).get('healthy',''))" 2>/dev/null || echo "")
DJ_FAIL=$(echo "$HEALTH_DJ" | python3 -c "import sys,json; print(json.load(sys.stdin).get('summary',{}).get('fail',0))" 2>/dev/null || echo "0")
DJ_CHECKS=$(echo "$HEALTH_DJ" | python3 -c "import sys,json; print(len(json.load(sys.stdin).get('checks',[])))" 2>/dev/null || echo "0")
SONG_STATUS=$(echo "$HEALTH_DJ" | python3 -c "import sys,json; checks=json.load(sys.stdin).get('checks',[]); c=[x for x in checks if x['name']=='dj_has_songs']; print(c[0]['status'] if c else 'missing')" 2>/dev/null || echo "missing")
Q_STATUS=$(echo "$HEALTH_DJ" | python3 -c "import sys,json; checks=json.load(sys.stdin).get('checks',[]); c=[x for x in checks if x['name']=='dj_has_questions']; print(c[0]['status'] if c else 'missing')" 2>/dev/null || echo "missing")
SONG_COUNT=$(echo "$HEALTH_DJ" | python3 -c "import sys,json; checks=json.load(sys.stdin).get('checks',[]); c=[x for x in checks if x['name']=='dj_has_songs']; print(c[0].get('count',0) if c else 0)" 2>/dev/null || echo "0")
Q_COUNT=$(echo "$HEALTH_DJ" | python3 -c "import sys,json; checks=json.load(sys.stdin).get('checks',[]); c=[x for x in checks if x['name']=='dj_has_questions']; print(c[0].get('count',0) if c else 0)" 2>/dev/null || echo "0")

assert_gt "DJ health checks returned" "0" "$DJ_CHECKS"
assert_eq "DJ songs status" "pass" "$SONG_STATUS"
assert_eq "DJ questions status" "pass" "$Q_STATUS"
assert_gt "DJ song count in DB" "0" "$SONG_COUNT"
assert_gt "DJ question count in DB" "0" "$Q_COUNT"

# Show any failing checks
echo "$HEALTH_DJ" | python3 -c "
import sys,json
data = json.load(sys.stdin)
fails = [c for c in data.get('checks',[]) if c['status'] != 'pass']
for f in fails:
    print(f'  ⚠ {f[\"status\"].upper()}: {f[\"detail\"]}')
if not fails:
    print('  All checks pass!')
" 2>/dev/null || true

bold ""
bold "═══ Phase 4: Ensure-Defaults (idempotency) ═══"
# Call ensure-defaults twice — second call should say "already exists"
ED_RES=$(curl -sf -X POST "$BASE/api/admin/ensure-defaults" \
  -H 'Content-Type: application/json' \
  -d "{\"profileId\":\"$KNOWN_PROFILE\"}" 2>/dev/null || echo '{}')
ED_HTTP=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$BASE/api/admin/ensure-defaults" \
  -H 'Content-Type: application/json' \
  -d "{\"profileId\":\"$KNOWN_PROFILE\"}")
assert_http "POST /api/admin/ensure-defaults" "200" "$ED_HTTP"

SEEDED=$(echo "$ED_RES" | python3 -c "import sys,json; print(len(json.load(sys.stdin).get('seeded',[])))" 2>/dev/null || echo "-1")
ALREADY_SONGS=$(echo "$ED_RES" | python3 -c "import sys,json; print(json.load(sys.stdin).get('alreadyHad',{}).get('songs',0))" 2>/dev/null || echo "0")
assert_eq "Ensure-defaults idempotent (nothing new seeded)" "0" "$SEEDED"
assert_gt "Already had songs" "0" "$ALREADY_SONGS"

bold ""
bold "═══ Phase 5: Couple Link Creation & Retrieval ═══"
# Create a test couple link
CL_RES=$(curl -sf -X POST "$BASE/api/admin/couple-link" \
  -H 'Content-Type: application/json' \
  -d "{\"profileId\":\"$KNOWN_PROFILE\",\"coupleNameA\":\"AutoTest-A\",\"coupleNameB\":\"AutoTest-B\",\"eventType\":\"wedding\"}" 2>/dev/null || echo '{}')
CL_HTTP=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$BASE/api/admin/couple-link" \
  -H 'Content-Type: application/json' \
  -d "{\"profileId\":\"$KNOWN_PROFILE\",\"coupleNameA\":\"Probe\",\"coupleNameB\":\"Probe\"}")

assert_http "POST /api/admin/couple-link" "200" "$CL_HTTP"
EVENT_ID=$(echo "$CL_RES" | python3 -c "import sys,json; print(json.load(sys.stdin).get('eventId',''))" 2>/dev/null || echo "")
MAGIC_TOKEN=$(echo "$CL_RES" | python3 -c "import sys,json; print(json.load(sys.stdin).get('magicToken',''))" 2>/dev/null || echo "")
assert_not_empty "Created event ID" "$EVENT_ID"
assert_not_empty "Created magic token" "$MAGIC_TOKEN"

# List couple links and verify the new event appears
CL_LIST_HTTP=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/api/admin/couple-link?profileId=$KNOWN_PROFILE")
assert_http "GET /api/admin/couple-link" "200" "$CL_LIST_HTTP"
CL_LIST=$(curl -sf "$BASE/api/admin/couple-link?profileId=$KNOWN_PROFILE" 2>/dev/null || echo '{}')
FOUND=$(echo "$CL_LIST" | python3 -c "
import sys,json
data = json.load(sys.stdin)
events = data.get('events',[])
found = any(e.get('id') == '$EVENT_ID' for e in events)
print('yes' if found else 'no')
" 2>/dev/null || echo "no")
assert_eq "New event visible in couple-link list" "yes" "$FOUND"

bold ""
bold "═══ Phase 6: Phone OTP Flow ═══"
if [ -n "$EVENT_ID" ]; then
  OTP_HTTP=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$BASE/api/auth/phone/send-otp" \
    -H 'Content-Type: application/json' \
    -d "{\"phone\":\"0501234567\",\"eventId\":\"$EVENT_ID\"}")
  assert_http "POST /api/auth/phone/send-otp" "200" "$OTP_HTTP"

  OTP_RES=$(curl -sf -X POST "$BASE/api/auth/phone/send-otp" \
    -H 'Content-Type: application/json' \
    -d "{\"phone\":\"0502222222\",\"eventId\":\"$EVENT_ID\"}" 2>/dev/null || echo '{}')
  SESSION_ID=$(echo "$OTP_RES" | python3 -c "import sys,json; print(json.load(sys.stdin).get('sessionId',''))" 2>/dev/null || echo "")
  DEV_OTP=$(echo "$OTP_RES" | python3 -c "import sys,json; print(json.load(sys.stdin).get('devOtp',''))" 2>/dev/null || echo "")
  assert_not_empty "OTP session ID" "$SESSION_ID"

  if [ -n "$DEV_OTP" ] && [ "$DEV_OTP" != "null" ]; then
    green "  PASS: Dev OTP returned ($DEV_OTP)"
    PASS=$((PASS+1))

    # Verify the OTP
    VERIFY_HTTP=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$BASE/api/auth/phone/verify-otp" \
      -H 'Content-Type: application/json' \
      -d "{\"phone\":\"0502222222\",\"otp\":\"$DEV_OTP\",\"sessionId\":\"$SESSION_ID\"}")
    assert_http "POST /api/auth/phone/verify-otp" "200" "$VERIFY_HTTP"

    VERIFY_RES=$(curl -sf -X POST "$BASE/api/auth/phone/send-otp" \
      -H 'Content-Type: application/json' \
      -d "{\"phone\":\"0503333333\",\"eventId\":\"$EVENT_ID\"}" 2>/dev/null || echo '{}')
    VERIFY_SID=$(echo "$VERIFY_RES" | python3 -c "import sys,json; print(json.load(sys.stdin).get('sessionId',''))" 2>/dev/null || echo "")
    VERIFY_OTP2=$(echo "$VERIFY_RES" | python3 -c "import sys,json; print(json.load(sys.stdin).get('devOtp',''))" 2>/dev/null || echo "")

    if [ -n "$VERIFY_OTP2" ] && [ "$VERIFY_OTP2" != "null" ]; then
      VERIFY2_RES=$(curl -sf -X POST "$BASE/api/auth/phone/verify-otp" \
        -H 'Content-Type: application/json' \
        -d "{\"phone\":\"0503333333\",\"otp\":\"$VERIFY_OTP2\",\"sessionId\":\"$VERIFY_SID\"}" 2>/dev/null || echo '{}')
      VERIFIED=$(echo "$VERIFY2_RES" | python3 -c "import sys,json; print(json.load(sys.stdin).get('verified',False))" 2>/dev/null || echo "False")
      assert_eq "OTP verification succeeded" "True" "$VERIFIED"
    else
      yellow "  WARN: No dev OTP for second phone test"
      WARN=$((WARN+1))
    fi

    # Duplicate phone same event = same session
    DUP_RES=$(curl -sf -X POST "$BASE/api/auth/phone/send-otp" \
      -H 'Content-Type: application/json' \
      -d "{\"phone\":\"0502222222\",\"eventId\":\"$EVENT_ID\"}" 2>/dev/null || echo '{}')
    DUP_SID=$(echo "$DUP_RES" | python3 -c "import sys,json; print(json.load(sys.stdin).get('sessionId',''))" 2>/dev/null || echo "")
    assert_eq "Same phone+event = same session (upsert)" "$SESSION_ID" "$DUP_SID"
  else
    yellow "  WARN: No devOtp returned — SMS mode? Skipping verify tests."
    WARN=$((WARN+1))
  fi
else
  red "  SKIP: No event ID — can't test OTP"
  FAIL=$((FAIL+1))
fi

bold ""
bold "═══ Phase 7: Analytics Track ═══"
AN_HTTP=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$BASE/api/analytics/track" \
  -H 'Content-Type: application/json' \
  -d '{"events":[{"eventName":"verify_script_test","category":"test"}]}')
assert_http "POST /api/analytics/track (batch)" "200" "$AN_HTTP"

AN_SINGLE_HTTP=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$BASE/api/analytics/track" \
  -H 'Content-Type: application/json' \
  -d '{"eventName":"verify_script_single","category":"test"}')
assert_http "POST /api/analytics/track (single)" "200" "$AN_SINGLE_HTTP"

bold ""
bold "═══ Phase 8: Post-test Health Re-check ═══"
FINAL_HEALTH=$(curl -sf "$BASE/api/admin/db-health?profileId=$KNOWN_PROFILE" 2>/dev/null || echo '{}')
FINAL_HEALTHY=$(echo "$FINAL_HEALTH" | python3 -c "import sys,json; print(json.load(sys.stdin).get('healthy',''))" 2>/dev/null || echo "")
FINAL_FAIL=$(echo "$FINAL_HEALTH" | python3 -c "import sys,json; print(json.load(sys.stdin).get('summary',{}).get('fail',0))" 2>/dev/null || echo "0")
assert_eq "Final health check: healthy" "True" "$FINAL_HEALTHY"
assert_eq "Final health check: 0 failures" "0" "$FINAL_FAIL"

# ---- Summary ----
bold ""
bold "════════════════════════════════"
TOTAL=$((PASS+FAIL+WARN))
echo "  Total: $TOTAL  |  $(green "PASS: $PASS")  |  $(red "FAIL: $FAIL")  |  $(yellow "WARN: $WARN")"
bold "════════════════════════════════"

if [ "$FAIL" -gt 0 ]; then
  red "VERIFICATION FAILED — $FAIL test(s) failed."
  exit 1
else
  green "ALL TESTS PASSED."
  exit 0
fi
