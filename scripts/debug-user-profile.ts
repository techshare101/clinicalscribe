
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

// Load environment variables BEFORE importing firebase-admin
dotenv.config({ path: ".env.local" });

async function run() {
  const outputPath = path.resolve(process.cwd(), "debug_results.txt");
  let output = "========== START DEBUG DATA ==========\n";

  try {
    // Dynamic import to ensure env vars are loaded first
    const { adminDb } = await import("../lib/firebase-admin");

    const snapshot = await adminDb
      .collection("profiles")
      .orderBy("updatedAt", "desc")
      .limit(10)
      .get();

    if (snapshot.empty) {
      output += "⚠️ No profile documents found.\n";
    } else {
      snapshot.forEach((doc) => {
        const data = doc.data();
        output += `UID: ${doc.id}\n`;
        output += `Email: ${data.email}\n`;
        output += `betaActive: ${data.betaActive}\n`;
        output += `subscriptionStatus: ${data.subscriptionStatus}\n`;
        output += `planId: ${data.planId}\n`;
        output += `stripeCustomerId: ${data.stripeCustomerId}\n`;
        output += `currentPeriodEnd: ${data.currentPeriodEnd?.toDate?.() || data.currentPeriodEnd}\n`;
        output += `updatedAt: ${data.updatedAt?.toDate?.() || data.updatedAt}\n`;
        output += "--------------------------------------------------\n";
      });
    }
  } catch (error) {
    output += `❌ Debug script failed: ${error}\n`;
  }

  output += "========== END DEBUG DATA ==========\n";
  fs.writeFileSync(outputPath, output);
  console.log("Debug data written to debug_results.txt");
}

run();
