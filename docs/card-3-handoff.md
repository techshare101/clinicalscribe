# Card 3 — Handoff: SMART on FHIR → Epic Sandbox E2E

Scope
- End-to-end SMART OAuth in Epic sandbox.
- Build a DocumentReference (FHIR) and POST to sandbox.
- Confirm “Connected” status and successful resource creation.

What already exists
- Launch (PKCE):
  - GET /smart/launch?fhirBase=<FHIR_BASE>
- Callback (PKCE token exchange):
  - GET /smart/callback
- Status (cookie-based):
  - GET /api/smart/status → { connected, fhirBase }
- Post DocumentReference (cookie-based):
  - POST /api/smart/post-document-reference
- Disconnect:
  - POST /api/smart/disconnect
- EHR sandbox helper UI:
  - /ehr-sandbox — builds DocumentReference JSON via /api/fhir/document-reference

Required env
```bash
NEXT_PUBLIC_SMART_CLIENT_ID=your_client_id
SMART_CLIENT_SECRET=your_client_secret   # if issued
SMART_SCOPES="launch/patient patient/*.write openid fhirUser offline_access"
# Example Epic public sandbox FHIR base:
# https://fhir.epic.com/interconnect-fhir-oauth/api/FHIR/R4
```

Editor tasks (one section = one commit)
1) Verify env values exist in .env.local
2) Confirm the following routes respond (200 or redirect):
   - /smart/launch?fhirBase=...
   - /smart/callback
   - /api/smart/status
   - /api/smart/post-document-reference
3) Run E2E flow:
   - Launch Epic OAuth: open /smart/launch?fhirBase=https://fhir.epic.com/interconnect-fhir-oauth/api/FHIR/R4
   - Complete consent; callback sets cookies: smart_access_token, smart_fhir_base
   - Verify status: GET /api/smart/status → { connected: true, fhirBase }
   - Build a DocumentReference using /ehr-sandbox (or via /api/fhir/document-reference)
   - POST it via /api/smart/post-document-reference

Commands and examples

Build DocumentReference (via API) — optional if you use /ehr-sandbox

bash
```bash
curl -sS -X POST "${BASE_URL}/api/fhir/document-reference" \
  -H "Content-Type: application/json" \
  -d '{
    "soap": {
      "subjective": "Patient c/o headache",
      "objective": "BP 120/80",
      "assessment": "Tension headache",
      "plan": "Ibuprofen 400mg PRN",
      "patientName": "Jane Doe",
      "encounterType": "Outpatient",
      "timestamp": "'"$(date -u +%Y-%m-%dT%H:%M:%SZ)"'"
    },
    "patient": { "id": "example-patient", "name": "Jane Doe" },
    "author": { "id": "clinician-1", "name": "Dr. Smith" }
  }'
```
Expected: FHIR JSON resource for DocumentReference.

Post DocumentReference to EHR (cookie-based)
- Run this in a browser context or a client that forwards cookies set by /smart/callback.

bash
```bash
curl -sS -X POST "${BASE_URL}/api/smart/post-document-reference" \
  -H "Content-Type: application/json" \
  -b "smart_access_token=${SMART_ACCESS_TOKEN}; smart_fhir_base=${FHIR_BASE}" \
  --data-binary @docref.json
```
Expected: { posted: true, server: <FHIR_BASE>, resourceId: ..., response: ... }

UI flow (recommended)
1) Navigate to /ehr-sandbox
2) Enter SOAP fields, patient, author → Build FHIR → Review JSON
3) Click Export (or use a simple fetch to POST to /api/smart/post-document-reference)
4) Confirm success message and resource id

PR and workflow
- PR title: feat(3): SMART on FHIR Epic sandbox E2E
- Move Trello Card 3 → Ready for Test
- QA will confirm OAuth, status, and posting.
