# Troubleshooting Guide

Common issues and quick fixes.

## Firestore Errors
- Listen 400 / “index required”
  - Run: `firebase deploy --only firestore:indexes`
  - Verify `firestore.indexes.json` contains required indexes:
    - patients: `name_lower` ASC
    - soapNotes: `patientId` ASC + `createdAt` DESC
    - soapNotes: `userId` ASC + `createdAt` DESC
- Permission denied
  - Publish Firestore rules in Console.
  - Confirm patient creation includes `ownerId`; soapNotes include `userId`.

## Auth Issues
- Signup fails “setDoc is not defined”
  - Ensure imports in signup page: `doc`, `setDoc` from `firebase/firestore`, and `db` from `lib/firebase`.
- Dashboard spins forever
  - Ensure the dashboard query uses `userId` for filtering notes.
  - Re-login and refresh the page.

## PDF Issues
- Chromium executablePath error
  - Use `await chromium.executablePath()` in PDF route handlers.
- Upload denied
  - Verify Storage rules allow signed-in users to write to `pdfs/{uid}/`.

## Indexes Stuck “Building”
- Wait until indexes show “Enabled” in Firebase Console, then reload the app.

## Env Errors
- Cross-check `.env.local` with `.env.example`.
- Restart the dev server after changing env variables.

## Rate Limiting (/api/redflag)
- Default limit is 5 requests per minute per key (IP + optional user hint).
- Configure via `REDFLAG_RPM` and `REDFLAG_WINDOW_SEC` environment variables.
