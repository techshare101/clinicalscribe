# Card 4 — Handoff: One-Click PDF → Watermark + Secure Storage

Scope
- Render HTML → PDF with watermark on Node runtime.
- Store under /pdfs/<uid>/ in Firebase Storage.
- Download via owner-scoped signed URL.

What already exists
- POST /api/pdf/render → stores to /pdfs/{ownerId}/{timestamp}.pdf, returns { path }
- POST /api/storage/signed-url → returns signed URL if caller owns path
- DownloadPdfButton React component → calls signed-url and opens the link

Editor tasks (one section = one commit)
1) Verify PDF render endpoint returns a valid path
2) Confirm the file is present in Storage
3) Use DownloadPdfButton in a page (pass pdfPath from render response) to download
4) Validate watermark is visible and the file opens without corruption

Commands

Create test PDF

bash
```bash
curl -sS -X POST "${BASE_URL}/api/pdf/render" \
  -H "Content-Type: application/json" \
  -d '{
    "html": "<h1>ClinicalScribe Report</h1><p>PDF smoke test</p>",
    "ownerId": "'"${UID}"'"
  }'
```
Expected: { path: "pdfs/<UID>/<timestamp>.pdf" }

Get signed URL (owner)

bash
```bash
curl -sS -X POST "${BASE_URL}/api/storage/signed-url" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${ID_TOKEN}" \
  -d '{
    "path": "pdfs/'"${UID}"'/<timestamp>.pdf",
    "expiresInSec": 300
  }'
```
Expected: { url, expiresAt }

Download
- Open the returned url; PDF should download or render inline.

UI smoke
- Use <DownloadPdfButton pdfPath="the path returned by render" />
- Click → Should open signed URL in a new tab and download/display

PR and workflow
- PR title: feat(4): One-click PDF render + secure download
- Move Trello Card 4 → Ready for Test
- QA verifies watermark and access controls
