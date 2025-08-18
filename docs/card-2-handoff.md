# Card 2 — Handoff: Secure Storage → Signed URLs

Scope
- Verify and ship owner-scoped signed URL downloads from Firebase Storage.
- Smoke the PDF render → store → signed URL download pipeline.

What already exists
- Endpoint (primary, used by UI):
  - POST /api/storage/signed-url — verifies Firebase ID token, checks path ownership/admin, returns signed read URL.
- Endpoint (alternate):
  - POST /api/storage/sign-url — same behavior, optional.
- PDF render endpoint:
  - POST /api/pdf/render — renders HTML → PDF on Node runtime, stores to /pdfs/{ownerId}/{timestamp}.pdf
- Client:
  - components/DownloadPdfButton.tsx — calls /api/storage/signed-url with the current user’s idToken and a provided pdfPath.
- Docs:
  - docs/card-2-checklist.md — curl-based quick test steps.
  - docs/postman-security-collection.json — Postman tests (allowed/forbidden) for signed URL endpoint.

Editor tasks (one section = one commit)

1) API verification (no code changes expected)
- Confirm both endpoints exist in the repo:
  - /api/storage/signed-url
  - /api/pdf/render
- Confirm lib/firebaseAdmin.ts is configured (FIREBASE_SERVICE_ACCOUNT_BASE64, storage bucket set).

2) Create a test PDF in Storage (optional if a file already exists)
- Use /api/pdf/render to create a PDF for the current signed-in user.
- You can trigger via curl (see docs/card-2-checklist.md) or a quick temporary UI hook.

3) Signed URL tests (API-level)
- Use Postman collection docs/postman-security-collection.json
  - Set BASE_URL, ID_TOKEN, UID, OTHER_UID, TEST_FILENAME
  - Expect: owner path 200, other user’s path 403
- Alternatively, use curl commands from docs/card-2-checklist.md

4) UI smoke (optional but recommended)
- Render a PDF via /api/pdf/render (ownerId = current user uid)
- Use <DownloadPdfButton pdfPath="returned-path" /> to verify signed URL download works end-to-end.
  - Example pdfPath format: pdfs/<uid>/<timestamp>.pdf

5) PR and workflow
- Commit any minor glue changes if you add a temporary UI button/hook for this test.
- PR title:
  - feat(2): Secure Storage signed URLs + PDF render smoke
- Move Trello Card 2 → Ready for Test.
- Notify for QA (we’ll use the checklist to verify in minutes).

Commands (reference)

bash
```bash
# Create test PDF (returns { path: "pdfs/<UID>/<timestamp>.pdf" })
curl -sS -X POST "${BASE_URL}/api/pdf/render" \
  -H "Content-Type: application/json" \
  -d '{
    "html": "<h1>Test PDF</h1><p>Card 2 smoke test</p>",
    "ownerId": "'"${UID}"'"
  }'

# Signed URL allowed (owner path)
curl -sS -X POST "${BASE_URL}/api/storage/signed-url" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${ID_TOKEN}" \
  -d '{
    "path": "pdfs/'"${UID}"'/test.pdf",
    "expiresInSec": 300
  }'

# Signed URL forbidden (other path)
curl -sS -X POST "${BASE_URL}/api/storage/signed-url" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${ID_TOKEN}" \
  -d '{
    "path": "pdfs/'"${OTHER_UID}"'/test.pdf",
    "expiresInSec": 300
  }'
```

Environment for shell

bash
```bash
export BASE_URL="http://localhost:3000"   # or your deployed URL
export UID="<your_uid>"
export OTHER_UID="<other_uid>"
export ID_TOKEN="<paste_from_auth.currentUser.getIdToken()>"
```

Expected outcomes
- Owner path returns 200 + { url }
- Other user path returns 403
- Opening the signed URL downloads/displays the PDF
- Optional: admin user (role=admin) can sign URL for other users’ paths

Notes
- Keep any temporary UI hooks behind dev flags and revert after QA if not needed.
- For production, use the DownloadPdfButton pattern or trigger signed URLs server-side as needed.
