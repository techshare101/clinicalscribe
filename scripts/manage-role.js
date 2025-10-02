/**
 * Unified Role Management Script
 * 
 * Usage:
 *   node scripts/manage-role.js set system-admin email@example.com
 *   node scripts/manage-role.js set nurse-admin email@example.com
 *   node scripts/manage-role.js set nurse email@example.com
 *   node scripts/manage-role.js list
 *   node scripts/manage-role.js audit
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
    } else {
      console.error("❌ Missing FIREBASE_SERVICE_ACCOUNT_BASE64 in .env.local");
      process.exit(1);
    }
  }
}

const VALID_ROLES = ["nurse", "nurse-admin", "system-admin"];
const ROLE_COLORS = {
  "nurse": "\x1b[37m",        // White
  "nurse-admin": "\x1b[35m",   // Magenta
  "system-admin": "\x1b[31m"   // Red
};
const RESET = "\x1b[0m";

async function setRole(role, email) {
  if (!VALID_ROLES.includes(role)) {
    console.error(`❌ Invalid role: ${role}. Must be one of: ${VALID_ROLES.join(", ")}`);
    process.exit(1);
  }

  const auth = admin.auth();
  const db = admin.firestore();

  try {
    const user = await auth.getUserByEmail(email);
    const uid = user.uid;

    // Get current role
    const profileDoc = await db.collection("profiles").doc(uid).get();
    const currentRole = profileDoc.data()?.role || "nurse";

    // Update role
    await db.collection("profiles").doc(uid).set(
      {
        role,
        email,
        displayName: user.displayName,
        previousRole: currentRole,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        roleUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
        roleUpdatedBy: "manage-role-script",
      },
      { merge: true }
    );

    // Create audit log
    await db.collection("audit_logs").add({
      action: "role_change",
      performedBy: "system",
      performedByEmail: "manage-role-script",
      targetUid: uid,
      targetEmail: email,
      previousRole: currentRole,
      newRole: role,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`✅ Successfully changed ${email} from ${currentRole} to ${role}`);
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
}

async function listUsers() {
  const db = admin.firestore();
  
  console.log("\n📋 All User Roles:\n");
  console.log("Email                                    | Role          | Updated");
  console.log("----------------------------------------------------------------------");

  try {
    const snapshot = await db.collection("profiles").get();
    
    const users = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      users.push({
        email: data.email || "Unknown",
        role: data.role || "nurse",
        updatedAt: data.roleUpdatedAt || data.updatedAt
      });
    });

    // Sort by role importance
    const roleOrder = { "system-admin": 0, "nurse-admin": 1, "nurse": 2 };
    users.sort((a, b) => (roleOrder[a.role] || 999) - (roleOrder[b.role] || 999));

    users.forEach(user => {
      const color = ROLE_COLORS[user.role] || "";
      const email = user.email.padEnd(40);
      const role = user.role.padEnd(13);
      const date = user.updatedAt ? new Date(user.updatedAt._seconds * 1000).toLocaleDateString() : "Never";
      console.log(`${email} | ${color}${role}${RESET} | ${date}`);
    });

    console.log("\nTotal users:", users.length);
  } catch (err) {
    console.error("❌ Error listing users:", err.message);
  }
}

async function showAuditLogs() {
  const db = admin.firestore();
  
  console.log("\n🔍 Recent Role Changes (last 20):\n");

  try {
    const snapshot = await db.collection("audit_logs")
      .where("action", "==", "role_change")
      .orderBy("timestamp", "desc")
      .limit(20)
      .get();

    if (snapshot.empty) {
      console.log("No role changes found in audit logs.");
      return;
    }

    snapshot.forEach(doc => {
      const data = doc.data();
      const timestamp = data.timestamp ? new Date(data.timestamp._seconds * 1000).toLocaleString() : "Unknown";
      const prevColor = ROLE_COLORS[data.previousRole] || "";
      const newColor = ROLE_COLORS[data.newRole] || "";
      
      console.log(`[${timestamp}] ${data.targetEmail}`);
      console.log(`  Changed from ${prevColor}${data.previousRole}${RESET} to ${newColor}${data.newRole}${RESET}`);
      console.log(`  By: ${data.performedByEmail}\n`);
    });
  } catch (err) {
    console.error("❌ Error fetching audit logs:", err.message);
  }
}

async function main() {
  initAdmin();
  
  const [command, ...args] = process.argv.slice(2);

  switch (command) {
    case "set":
      const [role, email] = args;
      if (!role || !email) {
        console.error("Usage: node scripts/manage-role.js set <role> <email>");
        process.exit(1);
      }
      await setRole(role, email);
      break;

    case "list":
      await listUsers();
      break;

    case "audit":
      await showAuditLogs();
      break;

    default:
      console.log(`
Unified Role Management Script

Commands:
  set <role> <email>  - Set user role (nurse, nurse-admin, system-admin)
  list               - List all users and their roles
  audit              - Show recent role changes from audit log

Examples:
  node scripts/manage-role.js set system-admin admin@example.com
  node scripts/manage-role.js set nurse-admin headnurse@example.com
  node scripts/manage-role.js set nurse user@example.com
  node scripts/manage-role.js list
  node scripts/manage-role.js audit
      `);
  }

  process.exit(0);
}

main();