# Card 2 — Secure Storage: Signed URLs (Quick Test Checklist)

Objective: Verify that the signed URL flow permits owners (and admins) and blocks other users.

---

Prerequisites
- Card 1 rules deployed and working.
- You are signed-in in the app and can obtain a Firebase ID token.
- You have or can create a file in Storage at pdfs/<UID>/test.pdf.
  - If you don't have one, create it via the PDF render endpoint below.

---

1) Obtain Firebase ID token (from app console)
```js
await auth.currentUser.getIdToken()
```
Copy the token and set it in your REST tool or shell as ID_TOKEN.

---

2) (Optional) Create a test PDF to ensure the file exists

bash
```bash
curl -sS -X POST "${BASE_URL}/api/pdf/render" \
  -H "Content-Type: application/json" \
  -d '{
    "html": "<h1>Test PDF</h1><p>Card 2 smoke test</p>",
    "ownerId": "'"${UID}"'"
  }'
```
Expected: { "path": "pdfs/<UID>/<timestamp>.pdf" }

---

3) API tests — allowed vs forbidden

- Allowed (owner path)

bash
```bash
curl -sS -X POST "${BASE_URL}/api/storage/signed-url" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${ID_TOKEN}" \
  -d '{
    "path": "pdfs/'"${UID}"'/test.pdf",
    "expiresInSec": 300
  }'
```
Expected: 200 and JSON with { url, expiresAt }

- Forbidden (other user's path)

bash
```bash
curl -sS -X POST "${BASE_URL}/api/storage/signed-url" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${ID_TOKEN}" \
  -d '{
    "path": "pdfs/'"${OTHER_UID}"'/test.pdf",
    "expiresInSec": 300
  }'
```
Expected: 403 with { error: "Forbidden path" }

---

4) Negative cases

- Invalid token ⇒ 401

bash
```bash
curl -sS -X POST "${BASE_URL}/api/storage/signed-url" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer bad.token" \
  -d '{ "path": "pdfs/'"${UID}"'/test.pdf" }'
```

- File not found ⇒ 404

bash
```bash
curl -sS -X POST "${BASE_URL}/api/storage/signed-url" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${ID_TOKEN}" \
  -d '{ "path": "pdfs/'"${UID}"'/does-not-exist.pdf" }'
```

- Disallowed top-level folder ⇒ 403

bash
```bash
curl -sS -X POST "${BASE_URL}/api/storage/signed-url" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${ID_TOKEN}" \
  -d '{ "path": "public/'"${UID}"'/x.pdf" }'
```

---

5) Download test
- For a successful allowed response, copy the returned url and open it in the browser; PDF should download/display.

---

6) Admin override (optional)
- Use scripts/set-admin.js to grant role=admin to a test UID.
- Obtain ID token for the admin user and repeat the forbidden case; admin should be allowed.

---

Environment variables to set in your shell

bash
```bash
export BASE_URL="http://localhost:3000"   # or your deployed URL
export UID="<your_uid>"
export OTHER_UID="<other_uid>"
export ID_TOKEN="<paste_from_auth.currentUser.getIdToken()>"
```
