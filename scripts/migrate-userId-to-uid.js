// One-time migration: copy userId -> uid on soapNotes
// Usage:
//   set GOOGLE_APPLICATION_CREDENTIALS=path\to\serviceAccount.json (Windows)
//   export GOOGLE_APPLICATION_CREDENTIALS=path/to/serviceAccount.json (macOS/Linux)
//   node scripts/migrate-userId-to-uid.js

const { initializeApp, applicationDefault, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Initialize using ADC (Application Default Credentials)
initializeApp({
  credential: applicationDefault(),
});

const db = getFirestore();

db.settings({ ignoreUndefinedProperties: true });

async function migrate() {
  const snap = await db.collection('soapNotes').get();
  let updated = 0;
  for (const doc of snap.docs) {
    const data = doc.data();
    if (data && data.userId && !data.uid) {
      await doc.ref.update({ uid: data.userId });
      updated++;
      console.log(`Migrated ${doc.id}`);
    }
  }
  console.log(`Done. Updated ${updated} documents.`);
}

migrate().catch((e) => {
  console.error(e);
  process.exit(1);
});
