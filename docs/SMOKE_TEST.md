# ClinicalScribe Smoke Test

Use this checklist to verify core flows end-to-end after deploying Firestore rules and indexes.

## 1. Auth
- [ ] Visit `/auth/signup`, create a new test user.
- [ ] Logout, then login at `/auth/login`.
- [ ] Expect redirect to `/dashboard` with no session errors.

## 2. Patients
- [ ] Create a new patient (e.g., `New Patient`).
- [ ] Expect a Firestore document with `ownerId = your uid`.

## 3. SOAP Notes
- [ ] Create a SOAP note linked to your test patient.
- [ ] Expect a Firestore document with `userId = your uid`, `patientId`, and `createdAt`.

## 4. Dashboard
- [ ] Visit `/dashboard`.
- [ ] Expect a brief loading state, then either “No notes yet…” or a list of notes.
- [ ] Confirm no Firestore Listen 400 or index errors in the browser console.

## 5. PDF Export
- [ ] Open a note and export to PDF.
- [ ] Expect download and/or upload to Firebase Storage under `pdfs/{uid}/`.

## 6. SMART on FHIR (Optional)
- [ ] Visit `/smart/launch/default?debug=1`.
- [ ] Expect the Epic sandbox login page.
