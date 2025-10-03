/**
 * List all users and their roles from Firestore
 * 
 * Usage:
 * 1. Add FIREBASE_SERVICE_ACCOUNT_BASE64 to your .env.local
 * 2. Run:
 *    npx ts-node scripts/listRoles.ts
 *
 * Options:
 *    --role <role>    Filter by specific role
 *    --email <email>  Search by email (partial match)
 * 
 * Examples:
 *    npx ts-node scripts/listRoles.ts
 *    npx ts-node scripts/listRoles.ts --role system-admin
 *    npx ts-node scripts/listRoles.ts --email caresim
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

interface UserProfile {
  uid: string;
  email?: string;
  role?: string;
  createdAt?: any;
  betaActive?: boolean;
}

function formatDate(timestamp: any): string {
  if (!timestamp) return "N/A";
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString();
}

async function listRoles(filterRole?: string, filterEmail?: string) {
  try {
    console.log("\n🔍 Fetching user profiles from Firestore...\n");

    // Get all profiles
    const snapshot = await db.collection("profiles").get();
    
    if (snapshot.empty) {
      console.log("No profiles found in the database.");
      return;
    }

    const users: UserProfile[] = [];
    
    snapshot.forEach(doc => {
      const data = doc.data();
      const user: UserProfile = {
        uid: doc.id,
        email: data.email,
        role: data.role || "none",
        createdAt: data.createdAt,
        betaActive: data.betaActive
      };

      // Apply filters
      if (filterRole && user.role !== filterRole) return;
      if (filterEmail && !user.email?.toLowerCase().includes(filterEmail.toLowerCase())) return;

      users.push(user);
    });

    if (users.length === 0) {
      console.log("No users match the specified filters.");
      return;
    }

    // Sort by role (admins first) then by email
    users.sort((a, b) => {
      const roleOrder = { "system-admin": 0, "nurse-admin": 1, "nurse": 2, "none": 3 };
      const aOrder = roleOrder[a.role as keyof typeof roleOrder] ?? 3;
      const bOrder = roleOrder[b.role as keyof typeof roleOrder] ?? 3;
      
      if (aOrder !== bOrder) return aOrder - bOrder;
      return (a.email || "").localeCompare(b.email || "");
    });

    // Count roles
    const roleCounts: Record<string, number> = {};
    users.forEach(user => {
      roleCounts[user.role || "none"] = (roleCounts[user.role || "none"] || 0) + 1;
    });

    // Display summary
    console.log("📊 Role Summary:");
    Object.entries(roleCounts).forEach(([role, count]) => {
      const emoji = role === "system-admin" ? "👑" : role === "nurse-admin" ? "⭐" : "👤";
      console.log(`   ${emoji} ${role}: ${count} user${count !== 1 ? 's' : ''}`);
    });
    console.log(`   📋 Total: ${users.length} user${users.length !== 1 ? 's' : ''}\n`);

    // Display users
    console.log("👥 User List:");
    console.log("─".repeat(80));
    
    users.forEach(user => {
      const roleEmoji = user.role === "system-admin" ? "👑" : 
                       user.role === "nurse-admin" ? "⭐" : "👤";
      const betaStatus = user.betaActive ? "✅ Beta" : "";
      
      console.log(`${roleEmoji} ${user.email || "No email"}`);
      console.log(`   UID: ${user.uid}`);
      console.log(`   Role: ${user.role}`);
      if (betaStatus) console.log(`   Status: ${betaStatus}`);
      console.log(`   Created: ${formatDate(user.createdAt)}`);
      console.log("─".repeat(80));
    });

    // Helper commands
    console.log("\n💡 Quick Actions:");
    console.log("To change a role, copy the UID and run:");
    console.log("  npx ts-node scripts/changeRole.ts <UID> <new-role>\n");
    
    if (roleCounts["system-admin"] === 1) {
      console.log("⚠️  WARNING: Only 1 system-admin exists!");
      console.log("   Consider promoting another user before demoting the only admin.\n");
    }

  } catch (error) {
    console.error("❌ Failed to fetch profiles:", error);
    process.exit(1);
  }
}

async function main() {
  const args = process.argv.slice(2);
  let filterRole: string | undefined;
  let filterEmail: string | undefined;

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--role" && i + 1 < args.length) {
      filterRole = args[i + 1];
      i++; // Skip next arg
    } else if (args[i] === "--email" && i + 1 < args.length) {
      filterEmail = args[i + 1];
      i++; // Skip next arg
    } else if (args[i] === "--help" || args[i] === "-h") {
      console.log("ClinicalScribe Role List Tool");
      console.log("=============================");
      console.log("\nUsage: npx ts-node scripts/listRoles.ts [options]");
      console.log("\nOptions:");
      console.log("  --role <role>    Filter by specific role");
      console.log("  --email <email>  Search by email (partial match)");
      console.log("  --help, -h       Show this help message");
      console.log("\nExamples:");
      console.log("  npx ts-node scripts/listRoles.ts");
      console.log("  npx ts-node scripts/listRoles.ts --role system-admin");
      console.log("  npx ts-node scripts/listRoles.ts --email john");
      process.exit(0);
    }
  }

  await listRoles(filterRole, filterEmail);
  process.exit(0);
}

main().catch((error) => {
  console.error("Unexpected error:", error);
  process.exit(1);
});