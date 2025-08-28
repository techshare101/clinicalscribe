import { adminAuth, adminDb, adminBucket } from "../lib/firebaseAdmin";

export async function runSmokeTest() {
  try {
    console.log("🚀 Running Firebase Admin smoke test...");

    // 🔑 Test Auth
    const userList = await adminAuth.listUsers(1);
    console.log("✅ Auth: Able to list users. First user:", userList.users[0]?.uid || "No users yet");

    // 📄 Test Firestore
    const testDoc = adminDb.collection("smoke_tests").doc("test1");
    await testDoc.set({ createdAt: new Date().toISOString() });
    const docSnap = await testDoc.get();
    console.log("✅ Firestore: Document read:", docSnap.data());

    // 📦 Test Storage
    const [files] = await adminBucket.getFiles({ maxResults: 1 });
    console.log("✅ Storage: Bucket accessible. First file:", files[0]?.name || "No files in bucket");

    console.log("🎉 All Firebase Admin services are working correctly.");
  } catch (err: any) {
    console.error("❌ Firebase Smoke Test Failed:", err.message);
    process.exit(1);
  }
}

// Run directly if called from command line
if (typeof window === 'undefined' && require.main === module) {
  runSmokeTest();
}