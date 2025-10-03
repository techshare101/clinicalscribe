/**
 * Check if Firebase Admin credentials are configured
 * Usage: node scripts/check-env.js
 * Auto-loads .env.local
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env.local
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

console.log("\n🔍 Checking Firebase Admin credentials...\n");

const hasBase64 = !!process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
const hasCredPath = !!process.env.GOOGLE_APPLICATION_CREDENTIALS;

if (hasBase64) {
  console.log("✅ FIREBASE_SERVICE_ACCOUNT_BASE64 is set");
  try {
    const json = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, "base64").toString("utf8");
    const sa = JSON.parse(json);
    console.log(`   Project ID: ${sa.project_id}`);
    console.log(`   Client Email: ${sa.client_email}`);
  } catch (e) {
    console.log("⚠️  Could not parse service account:", e.message);
  }
} else {
  console.log("❌ FIREBASE_SERVICE_ACCOUNT_BASE64 is NOT set");
}

console.log("");

if (hasCredPath) {
  console.log("✅ GOOGLE_APPLICATION_CREDENTIALS is set");
  console.log(`   Path: ${process.env.GOOGLE_APPLICATION_CREDENTIALS}`);
} else {
  console.log("❌ GOOGLE_APPLICATION_CREDENTIALS is NOT set");
}

console.log("");

if (!hasBase64 && !hasCredPath) {
  console.log("❌ No Firebase credentials found!");
  console.log("\n📝 To set credentials:\n");
  console.log("Option 1 - Using service account JSON file:");
  console.log("  $env:GOOGLE_APPLICATION_CREDENTIALS = 'C:\\path\\to\\service-account.json'");
  console.log("");
  console.log("Option 2 - Using base64 encoded service account:");
  console.log("  $json = Get-Content service-account.json -Raw");
  console.log("  $base64 = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($json))");
  console.log("  $env:FIREBASE_SERVICE_ACCOUNT_BASE64 = $base64");
  process.exit(1);
} else {
  console.log("✅ Firebase credentials are configured!");
  console.log("\n📝 You can now run:");
  console.log("  node scripts/make-admin.js your-email@example.com system-admin");
}