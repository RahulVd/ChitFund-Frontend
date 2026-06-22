#!/bin/bash

BASE_URL="http://localhost:8080/api"
DB_USER="rahul"
DB_NAME="chitfund_db"

PASS=0
FAIL=0

# ---- helpers ----------------------------------------------------------

check() {
  # check "label" "$RESPONSE" "$HTTP_CODE" expected_code
  local LABEL=$1
  local BODY=$2
  local CODE=$3
  local EXPECTED=$4
  if [ "$CODE" == "$EXPECTED" ]; then
    echo "  PASS: $LABEL (HTTP $CODE)"
    PASS=$((PASS+1))
  else
    echo "  FAIL: $LABEL (expected $EXPECTED, got $CODE)"
    echo "        Response: $BODY"
    FAIL=$((FAIL+1))
  fi
}

# curl wrapper that returns body and code separated by a marker line
do_curl() {
  curl -s -w "\nHTTPSTATUS:%{http_code}" "$@"
}

split_body() {
  echo "$1" | sed -e 's/HTTPSTATUS\:.*//'
}

split_code() {
  echo "$1" | tr -d '\n' | sed -e 's/.*HTTPSTATUS://'
}

extract_id() {
  echo "$1" | grep -o '"id":[0-9]*' | head -1 | grep -o '[0-9]*'
}

# ---- 0. Wipe DB clean ---------------------------------------------------

echo "==============================="
echo " 0. WIPING DATABASE"
echo "==============================="
psql -U "$DB_USER" -d "$DB_NAME" -c "TRUNCATE TABLE settlements RESTART IDENTITY CASCADE;" 2>/dev/null
psql -U "$DB_USER" -d "$DB_NAME" -c "TRUNCATE TABLE owner_month RESTART IDENTITY CASCADE;" 2>/dev/null
psql -U "$DB_USER" -d "$DB_NAME" -c "TRUNCATE TABLE auctions RESTART IDENTITY CASCADE;" 2>/dev/null
psql -U "$DB_USER" -d "$DB_NAME" -c "TRUNCATE TABLE payments RESTART IDENTITY CASCADE;" 2>/dev/null
psql -U "$DB_USER" -d "$DB_NAME" -c "TRUNCATE TABLE member RESTART IDENTITY CASCADE;" 2>/dev/null
psql -U "$DB_USER" -d "$DB_NAME" -c "TRUNCATE TABLE chit_group RESTART IDENTITY CASCADE;" 2>/dev/null
echo "Database wiped, IDs reset to 1."

# ---- 1. Create Chit Group ----------------------------------------------

echo ""
echo "==============================="
echo " 1. CREATE CHIT GROUP"
echo "==============================="
RAW=$(do_curl -X POST "$BASE_URL/chits" \
  -H "Content-Type: application/json" \
  -d '{
    "chitName": "Lakshmi Chit",
    "totalMembers": 10,
    "monthlyContribution": 10000,
    "totalChitAmount": 100000,
    "startDate": "2026-01-01",
    "status": "ACTIVE"
  }')
BODY=$(split_body "$RAW"); CODE=$(split_code "$RAW")
check "Create chit group" "$BODY" "$CODE" "200"
GROUP_ID=$(extract_id "$BODY")
echo "Group ID: $GROUP_ID"

# ---- 2. Add Members -----------------------------------------------------

echo ""
echo "==============================="
echo " 2. ADD 10 MEMBERS"
echo "==============================="
MEMBERS=("Amma" "Ravi" "Sunita" "Bharath" "Meena" "Kiran" "Priya" "Arjun" "Deepa" "Suresh")
MEMBER_IDS=()

for NAME in "${MEMBERS[@]}"; do
  RAW=$(do_curl -X POST "$BASE_URL/members" \
    -H "Content-Type: application/json" \
    -d "{
      \"name\": \"$NAME\",
      \"phone\": \"9999999999\",
      \"address\": \"Bangalore\",
      \"chitGroup\": { \"id\": $GROUP_ID }
    }")
  BODY=$(split_body "$RAW"); CODE=$(split_code "$RAW")
  check "Add member $NAME" "$BODY" "$CODE" "200"
  MID=$(extract_id "$BODY")
  MEMBER_IDS+=("$MID")
done
echo "Member IDs: ${MEMBER_IDS[@]}"

# ---- helper functions for the cycle -------------------------------------

record_payment() {
  local MEMBER_ID=$1
  local MONTH=$2
  local LABEL=$3
  local EXPECTED=$4
  RAW=$(do_curl -X POST "$BASE_URL/payments/record" \
    -H "Content-Type: application/json" \
    -d "{
      \"chitGroupId\": $GROUP_ID,
      \"memberId\": $MEMBER_ID,
      \"monthNumber\": $MONTH,
      \"amountPaid\": 10000
    }")
  BODY=$(split_body "$RAW"); CODE=$(split_code "$RAW")
  check "$LABEL" "$BODY" "$CODE" "$EXPECTED"
}

record_payments_for_month() {
  local MONTH=$1
  echo ""
  echo "--- Payments for Month $MONTH ---"
  for MEMBER_ID in "${MEMBER_IDS[@]}"; do
    record_payment "$MEMBER_ID" "$MONTH" "Payment member $MEMBER_ID month $MONTH" "200"
  done
}

record_auction() {
  local WINNER_ID=$1
  local MONTH=$2
  local BID=$3
  local WINNER_NAME=$4
  local IS_DOUBLE=$5   # true/false
  local EXPECTED=$6
  echo ""
  echo "Auction - Month $MONTH | Winner: $WINNER_NAME | Bid: Rs.$BID | DoubleChit: $IS_DOUBLE"
  RAW=$(do_curl -X POST "$BASE_URL/auctions/record" \
    -H "Content-Type: application/json" \
    -d "{
      \"chitGroupId\": $GROUP_ID,
      \"winnerId\": $WINNER_ID,
      \"monthNumber\": $MONTH,
      \"bidAmount\": $BID,
      \"doubleChit\": $IS_DOUBLE
    }")
  BODY=$(split_body "$RAW"); CODE=$(split_code "$RAW")
  check "Auction month $MONTH winner $WINNER_NAME" "$BODY" "$CODE" "$EXPECTED"
}

trigger_owner_month() {
  local MONTH=$1
  echo ""
  echo "Owner Month trigger - Month $MONTH"
  RAW=$(do_curl -X POST "$BASE_URL/owner-month/trigger" \
    -H "Content-Type: application/json" \
    -d "{
      \"chitGroupId\": $GROUP_ID,
      \"monthNumber\": $MONTH
    }")
  BODY=$(split_body "$RAW"); CODE=$(split_code "$RAW")
  check "Owner month trigger month $MONTH" "$BODY" "$CODE" "200"
}

# ---- 3. Run the cycle -----------------------------------------------------

echo ""
echo "==============================="
echo " 3. RUNNING FULL CYCLE"
echo "==============================="

record_payments_for_month 1
record_auction "${MEMBER_IDS[0]}" 1 30000 "Amma" "false" "200"

# Month 2 - Owner month, no bidding
record_payments_for_month 2
trigger_owner_month 2

record_payments_for_month 3
record_auction "${MEMBER_IDS[2]}" 3 20000 "Sunita" "false" "200"
echo ""
echo "*** DOUBLE CHIT TEST - Month 3, second winner ***"
record_auction "${MEMBER_IDS[3]}" 3 15000 "Bharath" "true" "200"

record_payments_for_month 4
record_auction "${MEMBER_IDS[4]}" 4 35000 "Meena" "false" "200"

record_payments_for_month 5
record_auction "${MEMBER_IDS[5]}" 5 28000 "Kiran" "false" "200"

record_payments_for_month 6
record_auction "${MEMBER_IDS[6]}" 6 22000 "Priya" "false" "200"
echo ""
echo "*** DOUBLE CHIT TEST - Month 6, second winner ***"
record_auction "${MEMBER_IDS[7]}" 6 18000 "Arjun" "true" "200"

record_payments_for_month 7
record_auction "${MEMBER_IDS[8]}" 7 40000 "Deepa" "false" "200"

record_payments_for_month 8
record_auction "${MEMBER_IDS[9]}" 8 10000 "Suresh" "false" "200"

# ---- 4. Negative tests for tonight's fixes --------------------------------

echo ""
echo "==============================="
echo " 4. EDGE CASE TESTS (tonight's fixes)"
echo "==============================="

echo ""
echo "--- Should FAIL: double chit flagged without an existing first winner (month 9) ---"
record_auction "${MEMBER_IDS[0]}" 9 30000 "Amma (invalid double)" "true" "400"

echo ""
echo "--- Should FAIL: duplicate payment for same member/month ---"
record_payment "${MEMBER_IDS[0]}" 1 "Duplicate payment (should fail)" "400"

# ---- 5. Unmark payment test (tonight's frontend fix, backend path) -------

echo ""
echo "==============================="
echo " 5. UNMARK PAYMENT TEST"
echo "==============================="
TEST_MEMBER="${MEMBER_IDS[0]}"
echo "Unmarking payment for member $TEST_MEMBER, month 1..."
RAW=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE \
  "$BASE_URL/payments/group/$GROUP_ID/month/1/member/$TEST_MEMBER")
check "Unmark payment member $TEST_MEMBER month 1" "" "$RAW" "204"

echo "Re-recording it so totals stay consistent for dashboard checks..."
record_payment "$TEST_MEMBER" 1 "Re-record payment after unmark" "200"

# ---- 6. Final auction to complete the group --------------------------------

record_payments_for_month 9
record_auction "${MEMBER_IDS[1]}" 9 25000 "Ravi" "false" "200"

# ---- 7. Dashboard + Settlement ----------------------------------------------

echo ""
echo "==============================="
echo " 6. DASHBOARD CHECK"
echo "==============================="
RAW=$(do_curl "$BASE_URL/dashboard/group/$GROUP_ID")
BODY=$(split_body "$RAW"); CODE=$(split_code "$RAW")
check "Get dashboard" "$BODY" "$CODE" "200"
echo "Dashboard: $BODY"

echo ""
echo "==============================="
echo " 7. SETTLEMENT"
echo "==============================="
RAW=$(do_curl -X POST "$BASE_URL/settlements/group/$GROUP_ID/settle")
BODY=$(split_body "$RAW"); CODE=$(split_code "$RAW")
check "Settle group" "$BODY" "$CODE" "200"
echo "Settlement: $BODY"

# ---- summary ---------------------------------------------------------------

echo ""
echo "==============================="
echo " TEST SUMMARY"
echo "==============================="
echo "PASS: $PASS"
echo "FAIL: $FAIL"
if [ "$FAIL" -gt 0 ]; then
  echo "RESULT: SOME CHECKS FAILED - review output above"
  exit 1
else
  echo "RESULT: ALL CHECKS PASSED"
  exit 0
fi