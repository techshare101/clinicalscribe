/**
 * Change user roles directly in Firestore
 * 
 * Usage:
 * 1. Add FIREBASE_SERVICE_ACCOUNT_BASE64 to your .env.local
 * 2. Run:
 *    npx ts-node scripts/changeRole.ts <UID> <newRole>
 *
 * Example:
 *    npx ts-node scripts/changeRole.ts cKqJu50j... nurse-admin
 *    npx ts-node scripts/changeRole.ts cKqJu50j... system-admin
 * 
 * Available roles:
 *    - nurse (regular nurse user)
 *    - nurse-admin (nurse with admin capabilities)
 *    - system-admin (full system administrator)
 */

import * as admin from "firebase-admin";
import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

// Initialize Firebase Admin
if (!admin.apps.length) {
  if (!process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    console.error("❌ Error: FIREBASE_SERVICE_ACCOUNT_BASE64 not found in .env.local");
    process.exit(1);
  }

  const serviceAccount = JSON.parse(
    Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, "base64").toString()
  );
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

const VALID_ROLES = ["nurse", "nurse-admin", "system-admin"];

async function changeRole(uid: string, newRole: string) {
  try {
    // Check if role is valid
    if (!VALID_ROLES.includes(newRole)) {
      console.error(`❌ Invalid role: ${newRole}`);
      console.log(`   Valid roles: ${VALID_ROLES.join(", ")}`);
      process.exit(1);
    }

    // Get current profile
    const profileRef = db.collection("profiles").doc(uid);
    const profileDoc = await profileRef.get();

    if (!profileDoc.exists) {
      console.error(`❌ No profile found for UID: ${uid}`);
      process.exit(1);
    }

    const currentData = profileDoc.data();
    const currentRole = currentData?.role || "none";

    console.log(`\n📋 Current profile:`);
    console.log(`   UID: ${uid}`);
    console.log(`   Email: ${currentData?.email || "unknown"}`);
    console.log(`   Current role: ${currentRole}`);
    console.log(`   New role: ${newRole}`);

    if (currentRole === newRole) {
      console.log(`\n✅ Role is already set to ${newRole}, no change needed.`);
      process.exit(0);
    }

    // Update the role
    await profileRef.update({ 
      role: newRole,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`\n✅ Successfully updated role from '${currentRole}' to '${newRole}'`);

    // Warning for demoting yourself
    if (currentRole === "system-admin" && newRole !== "system-admin") {
      console.log("\n⚠️  WARNING: You demoted an admin account!");
      console.log("   Make sure you have another system-admin account to manage the system.");
    }

  } catch (error) {
    console.error("\n❌ Failed to update role:", error);
    process.exit(1);
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log("ClinicalScribe Role Change Tool");
    console.log("================================");
    console.log("\nUsage: npx ts-node scripts/changeRole.ts <UID> <role>");
    console.log("\nExample:");
    console.log("  npx ts-node scripts/changeRole.ts cKqJu50j... nurse-admin");
    console.log("\nAvailable roles:");
    console.log("  - nurse         : Regular nurse user");
    console.log("  - nurse-admin   : Nurse with admin capabilities");
    console.log("  - system-admin  : Full system administrator");
    console.log("\nTo find UIDs, run: npx ts-node scripts/listRoles.ts");
    process.exit(1);
  }

  const [uid, newRole] = args;
  await changeRole(uid, newRole);
  process.exit(0);
}

main().catch((error) => {
  console.error("Unexpected error:", error);
  process.exit(1);
});