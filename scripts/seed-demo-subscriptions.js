/**
 * Usage:
 *   node scripts/seed-demo-subscriptions.js email1@example.com email2@example.com
 *
 * Auto-loads .env.local for Firebase credentials
 * This will set a profiles/{uid} doc with betaActive:true and fake stripe fields.
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import admin from "firebase-admin";
import crypto from "crypto";

// Load .env.local
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

function initAdmin() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    const json = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, "base64").toString("utf8");
    const sa = JSON.parse(json);
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(sa),
      });
    }
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
      });
    }
  } else {
    console.error("Missing FIREBASE_SERVICE_ACCOUNT_BASE64 or GOOGLE_APPLICATION_CREDENTIALS");
    process.exit(1);
  }
}

function makeId(prefix = "test") {
  return `${prefix}_${crypto.randomBytes(6).toString("hex")}`;
}

async function main() {
  initAdmin();
  const auth = admin.auth();
  const db = admin.firestore();
  const args = process.argv.slice(2);
  if (!args.length) {
    console.error("Usage: node seed-demo-subscriptions.js email1@example.com email2@example.com");
    process.exit(1);
  }

  for (const identifier of args) {
    try {
      // try treat as email first
      let userRecord;
      try {
        userRecord = await auth.getUserByEmail(identifier);
      } catch (e) {
        // maybe a UID
        try {
          userRecord = await auth.getUser(identifier);
        } catch (e2) {
          console.warn(`❌ Could not find user by email or UID: ${identifier}`);
          continue;
        }
      }

      const uid = userRecord.uid;
      const fakeCustomer = makeId("cus_test");
      const fakeSub = makeId("sub_test");
      const fakeSession = makeId("cs_test");

      const profileRef = db.collection("profiles").doc(uid);
      const payload = {
        betaActive: true,
        betaActivatedAt: admin.firestore.FieldValue.serverTimestamp(),
        activationSource: "seed-script",
        stripeCustomerId: fakeCustomer,
        stripeSubscriptionId: fakeSub,
        stripeSessionId: fakeSession,
        stripePriceId: process.env.NEXT_PUBLIC_STRIPE_LINK_BETA || "price_test_beta",
        stripeSubscriptionStatus: "active",
        subscriptionStatus: "active",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      await profileRef.set(payload, { merge: true });
      console.log(`✅ Seeded demo subscription for ${identifier} (uid: ${uid})`);
    } catch (err) {
      console.error("Error seeding", identifier, err);
    }
  }

  process.exit(0);
}

main();