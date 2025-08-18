# -------------------------------
# QA Test Script for Card 1 + 2
# PowerShell version with PASS/FAIL
# -------------------------------

# 🔑 Paste your tokens + UIDs here
$OWNER_UID = "cKqluS0jgLQyFPu9MYkKO3OUK5z1"
$OWNER_TOKEN = "PASTE_YOUR_OWNER_TOKEN_HERE"
$ADMIN_TOKEN = "PASTE_YOUR_ADMIN_TOKEN_HERE"
$OTHER_UID = "PASTE_ANOTHER_TEST_UID_HERE"

$BASE_URL = "http://localhost:3000"
$REPORT_NAME = "test-report.pdf"

function Get-StatusCode {
  param(
    [ScriptBlock]$Request
  )
  try {
    $resp = & $Request
    if ($resp -and $resp.StatusCode) { return [int]$resp.StatusCode }
    # Invoke-RestMethod may return parsed body; fallback to 200 if no exception
    return 200
  } catch {
    try {
      $status = $_.Exception.Response.StatusCode.value__
      if ($status) { return [int]$status }
    } catch {
      # noop
    }
    return 0
  }
}

function Assert-Status {
  param(
    [string]$Label,
    [int]$Actual,
    [int]$Expected
  )
  if ($Actual -eq $Expected) {
    Write-Host "✅ $Label -> PASS ($Actual)" -ForegroundColor Green
  } else {
    Write-Host "❌ $Label -> FAIL (got $Actual, expected $Expected)" -ForegroundColor Red
  }
}

Write-Host "🚀 QA for Card 1 + Card 2 starting..."

# Ensure test-report.pdf exists
if (-not (Test-Path $REPORT_NAME)) {
  Write-Host "📝 Creating $REPORT_NAME"
  $pdf = @"
%PDF-1.4
1 0 obj << >> endobj
trailer << >>
%%EOF
"@
  Set-Content -Path $REPORT_NAME -Value $pdf -Encoding Ascii
}

# Helper headers
$ownerAuth = @{ Authorization = "Bearer $OWNER_TOKEN" }
$adminAuth = @{ Authorization = "Bearer $ADMIN_TOKEN" }

# 0. Pre-step: Upload OTHER_UID file as admin (so admin signed URL test has a real file)
$code0 = Get-StatusCode { 
  Invoke-WebRequest -Uri "$BASE_URL/api/storage/upload" -Method Post -Headers $adminAuth -Form @{ path = "pdfs/$OTHER_UID/$REPORT_NAME"; file = (Get-Item $REPORT_NAME) } -SkipHeaderValidation -ErrorAction Stop 
}
Assert-Status "Admin upload for OTHER_UID" $code0 200

# 1. Upload dummy PDF as owner
$code1 = Get-StatusCode { 
  Invoke-WebRequest -Uri "$BASE_URL/api/storage/upload" -Method Post -Headers $ownerAuth -Form @{ path = "pdfs/$OWNER_UID/$REPORT_NAME"; file = (Get-Item $REPORT_NAME) } -SkipHeaderValidation -ErrorAction Stop 
}
Assert-Status "Owner upload own PDF" $code1 200

# 2. Owner can get signed URL for own file
$body2 = @{ path = "pdfs/$OWNER_UID/$REPORT_NAME" } | ConvertTo-Json
$code2 = Get-StatusCode {
  Invoke-WebRequest -Uri "$BASE_URL/api/storage/signed-url" -Method Post -Headers (@{ Authorization = "Bearer $OWNER_TOKEN"; "Content-Type" = "application/json" }) -Body $body2 -ErrorAction Stop
}
Assert-Status "Owner signed URL for own file" $code2 200

# 3. Non-owner blocked when requesting someone else's file
$body3 = @{ path = "pdfs/$OTHER_UID/$REPORT_NAME" } | ConvertTo-Json
$code3 = Get-StatusCode {
  Invoke-WebRequest -Uri "$BASE_URL/api/storage/signed-url" -Method Post -Headers (@{ Authorization = "Bearer $OWNER_TOKEN"; "Content-Type" = "application/json" }) -Body $body3 -ErrorAction Stop
}
Assert-Status "Non-owner requesting other user's file" $code3 403

# 4. Admin override works for someone else's file
$body4 = @{ path = "pdfs/$OTHER_UID/$REPORT_NAME" } | ConvertTo-Json
$code4 = Get-StatusCode {
  Invoke-WebRequest -Uri "$BASE_URL/api/storage/signed-url" -Method Post -Headers (@{ Authorization = "Bearer $ADMIN_TOKEN"; "Content-Type" = "application/json" }) -Body $body4 -ErrorAction Stop
}
Assert-Status "Admin requesting other user's file" $code4 200

Write-Host "🎯 QA Complete!"
