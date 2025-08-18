# Card 5 — Handoff: Seed Demo Data (Somali, Hmong, Spanish)

Scope
- Seed demo data for pilot: sessions + patients per language/specialty.
- Ensure seeded docs are owner-scoped with ownerId field.

What already exists
- scripts/seed-demo.ts (Admin SDK): creates patients + sessions, merges a basic profile
- Firestore rules expect ownerId for patients/sessions

Editor tasks (one section = one commit)
1) Ensure FIREBASE_SERVICE_ACCOUNT_BASE64 is set in .env.local
2) Run the seeder for a target UID

bash
```bash
npx ts-node scripts/seed-demo.ts <YOUR_UID>
```

3) Verify Firestore
- patients: ownerId, name, name_lower, lang, createdAt
- sessions: ownerId, patientId, specialty, lang, transcript, createdAt

4) UI sanity
- Load dashboard → confirm seeded sessions appear (or use any UI hooks that list sessions)

PR and workflow
- PR title: feat(5): Seed demo data for multilingual pilot
- Move Trello Card 5 → Ready for Test
- QA confirms data present and visible as expected
