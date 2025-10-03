// scripts/activate-beta.cjs
require("dotenv").config({ path: ".env.local" });
const admin = require("firebase-admin");

// Grab the target (email or uid) from CLI args
const target = process.argv[2];
if (!target) {
  console.error("❌ Usage: pnpm run activate-beta <email-or-uid>");
  process.exit(1);
}

// Initialize Firebase Admin with service account
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(
    Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, "base64").toString("utf8")
  );

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const auth = admin.auth();
const db = admin.firestore();

(async () => {
  try {
    let user;
    if (target.includes("@")) {
      user = await auth.getUserByEmail(target);
    } else {
      user = await auth.getUser(target);
    }

    const uid = user.uid;
    console.log(`🔑 Found user: ${uid} (${user.email})`);

    await db.collection("profiles").doc(uid).set(
      { betaActive: true },
      { merge: true }
    );

    console.log(`✅ Beta activated for ${user.email}`);
    process.exit(0);
  } catch (err) {
    console.error("❌ Error activating beta:", err);
    process.exit(1);
  }
})();