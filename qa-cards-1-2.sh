#!/usr/bin/env bash
set -euo pipefail

# -------------------------------
# QA Test Script for Card 1 + 2
# Bash version with PASS/FAIL
# -------------------------------

# 🔑 Paste your tokens + UIDs here
OWNER_UID="cKqluS0jgLQyFPu9MYkKO3OUK5z1"
OWNER_TOKEN="PASTE_YOUR_OWNER_TOKEN_HERE"
ADMIN_TOKEN="PASTE_YOUR_ADMIN_TOKEN_HERE"
OTHER_UID="PASTE_ANOTHER_TEST_UID_HERE"

BASE_URL="http://localhost:3000"
REPORT_NAME="test-report.pdf"

pass() { echo -e "\033[32m✅ $1 -> PASS ($2)\033[0m"; }
fail() { echo -e "\033[31m❌ $1 -> FAIL (got $2, expected $3)\033[0m"; }
assert_status() {
  local label="$1"; local actual="$2"; local expected="$3"
  if [[ "$actual" == "$expected" ]]; then pass "$label" "$actual"; else fail "$label" "$actual" "$expected"; fi
}

# Ensure test-report.pdf exists
if [[ ! -f "$REPORT_NAME" ]]; then
  echo "📝 Creating $REPORT_NAME"
  cat > "$REPORT_NAME" <<'PDF'
%PDF-1.4
1 0 obj << >> endobj
trailer << >>
%%EOF
PDF
fi

echo "🚀 QA for Card 1 + Card 2 starting..."

# 0. Pre-step: Upload OTHER_UID file as admin
code0=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST "$BASE_URL/api/storage/upload" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -F "path=pdfs/$OTHER_UID/$REPORT_NAME" \
  -F "file=@$REPORT_NAME")
assert_status "Admin upload for OTHER_UID" "$code0" 200

# 1. Upload dummy PDF as owner
code1=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST "$BASE_URL/api/storage/upload" \
  -H "Authorization: Bearer $OWNER_TOKEN" \
  -F "path=pdfs/$OWNER_UID/$REPORT_NAME" \
  -F "file=@$REPORT_NAME")
assert_status "Owner upload own PDF" "$code1" 200

# 2. Owner can get signed URL
code2=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST "$BASE_URL/api/storage/signed-url" \
  -H "Authorization: Bearer $OWNER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"path\":\"pdfs/$OWNER_UID/$REPORT_NAME\"}")
assert_status "Owner signed URL for own file" "$code2" 200

# 3. Non-owner blocked
code3=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST "$BASE_URL/api/storage/signed-url" \
  -H "Authorization: Bearer $OWNER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"path\":\"pdfs/$OTHER_UID/$REPORT_NAME\"}")
assert_status "Non-owner requesting other user's file" "$code3" 403

# 4. Admin override works
code4=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST "$BASE_URL/api/storage/signed-url" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"path\":\"pdfs/$OTHER_UID/$REPORT_NAME\"}")
assert_status "Admin requesting other user's file" "$code4" 200

echo "🎯 QA Complete!"
