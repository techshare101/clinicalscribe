/**
 * Demote user back to nurse role
 * 
 * Usage:
 *   node scripts/remove-admin.js email@example.com
 *
 * Auto-loads .env.local for Firebase credentials
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import admin from "firebase-admin";

// Load .env.local
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

function initAdmin() {
  if (!admin.apps.length) {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
      const json = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, "base64").toString("utf8");
      const sa = JSON.parse(json);
      admin.initializeApp({ credential: admin.credential.cert(sa) });
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      admin.initializeApp({ credential: admin.credential.applicationDefault() });
    } else {
      console.error("❌ Missing FIREBASE_SERVICE_ACCOUNT_BASE64 in .env.local");
      process.exit(1);
    }
  }
}

async function main() {
  initAdmin();
  const auth = admin.auth();
  const db = admin.firestore();

  const email = process.argv[2];
  if (!email) {
    console.error("Usage: node scripts/remove-admin.js email@example.com");
    process.exit(1);
  }

  try {
    const user = await auth.getUserByEmail(email);
    const uid = user.uid;

    await db.collection("profiles").doc(uid).set(
      {
        role: "nurse",
        email,
        displayName: user.displayName,
        updatedAt: new Date().toISOString(),
        roleUpdatedAt: new Date().toISOString(),
        roleUpdatedBy: "remove-admin-script",
      },
      { merge: true }
    );

    console.log(`✅ Successfully demoted ${email} (uid: ${uid}) back to nurse role`);
    console.log(`   Standard nurse - can access SOAP notes and patient records`);

  } catch (err) {
    console.error("❌ Error demoting user:", err.message);
    process.exit(1);
  }

  process.exit(0);
}

main();