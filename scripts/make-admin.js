/**
 * Role Management Script
 * 
 * Usage:
 *   node scripts/make-admin.js email@example.com system-admin  # Full admin access
 *   node scripts/make-admin.js email@example.com nurse-admin   # Training tools access
 *   node scripts/make-admin.js email@example.com nurse         # Standard user (removes admin)
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
    console.error("❌ Missing FIREBASE_SERVICE_ACCOUNT_BASE64 or GOOGLE_APPLICATION_CREDENTIALS");
    process.exit(1);
  }
}

const validRoles = ["nurse", "nurse-admin", "system-admin"];

async function main() {
  initAdmin();
  const auth = admin.auth();
  const db = admin.firestore();
  
  const [email, role] = process.argv.slice(2);
  
  if (!email || !role) {
    console.error("Usage: node scripts/make-admin.js email@example.com [nurse|nurse-admin|system-admin]");
    process.exit(1);
  }

  if (!validRoles.includes(role)) {
    console.error(`❌ Invalid role: ${role}. Must be one of: ${validRoles.join(", ")}`);
    process.exit(1);
  }

  try {
    // Get user by email
    const userRecord = await auth.getUserByEmail(email);
    const uid = userRecord.uid;

    // Update or create profile with role
    await db.collection("profiles").doc(uid).set(
      {
        role,
        email,
        displayName: userRecord.displayName,
        updatedAt: new Date().toISOString(),
        roleUpdatedAt: new Date().toISOString(),
        roleUpdatedBy: "make-admin-script",
      },
      { merge: true }
    );

    console.log(`✅ Successfully set ${email} (uid: ${uid}) to role: ${role}`);
    
    const roleDescriptions = {
      "nurse": "Standard nurse - can access SOAP notes and patient records",
      "nurse-admin": "Nurse administrator - can access training tools and user management",
      "system-admin": "System administrator - full access to all admin features including demo accounts"
    };
    
    console.log(`   ${roleDescriptions[role]}`);

  } catch (err) {
    console.error("❌ Error setting role:", err.message);
    process.exit(1);
  }

  process.exit(0);
}

main();