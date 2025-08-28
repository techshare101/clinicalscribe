import admin from "firebase-admin";

console.log('🔧 Firebase Admin: Module loaded');

// 🔧 Singleton pattern (prevents re-init in Next.js hot reload / serverless)
if (!admin.apps.length) {
  try {
    console.log('🔧 Firebase Admin: Initializing new app instance');
    if (!process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
      throw new Error("❌ Missing FIREBASE_SERVICE_ACCOUNT_BASE64");
    }

    let serviceAccount: any;
    try {
      serviceAccount = JSON.parse(
        Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, "base64").toString("utf8")
      );
      console.log('✅ Service account parsed successfully');
      console.log(`   Project ID: ${serviceAccount.project_id}`);
      console.log(`   Client Email: ${serviceAccount.client_email}`);
      console.log(`   Private Key ID: ${serviceAccount.private_key_id?.substring(0, 8)}...`);
    } catch (parseError: any) {
      console.error("❌ Failed to parse service account JSON:", parseError.message);
      // Fallback to default initialization
      throw parseError;
    }

    console.log('🔧 Firebase Admin: Initializing app with service account credential');
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      projectId: serviceAccount.project_id, // 👈 critical fix for Vercel (no metadata server)
    });

    console.log("✅ Firebase Admin initialized with service account");

  } catch (error: any) {
    console.error("❌ Firebase Admin initialization failed:", error.message);
    console.error("Error stack:", error.stack);
    // Instead of throwing, we'll initialize with default credentials
    // This will allow the app to run, but Firebase Admin features won't work
    try {
      admin.initializeApp({
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      });
      console.log("⚠️ Firebase Admin initialized with default credentials (limited functionality)");
    } catch (fallbackError: any) {
      console.error("❌ Firebase Admin fallback initialization also failed:", fallbackError.message);
      console.error("Fallback error stack:", fallbackError.stack);
    }
  }
} else {
  console.log("🔧 Firebase Admin: Using existing app instance");
}

// ✅ Export safe handles
console.log('🔧 Firebase Admin: Exporting auth, db, and storage handles');
export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
export const adminBucket = admin.storage().bucket();

export default admin;