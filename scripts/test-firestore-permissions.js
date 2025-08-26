// Simple test script to verify Firestore rules
// This script can be run with: firebase emulators:exec --project clinicalscribe-test 'node scripts/test-firestore-permissions.js'

import { initializeTestEnvironment, assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { readFileSync } from "fs";
import { doc, setDoc, getDoc } from "firebase/firestore";

async function runTests() {
  // Check if we're running in the emulator
  const isEmulator = process.env.FIREBASE_EMULATOR_HUB;
  
  if (!isEmulator) {
    console.log("⚠️  This script is designed to run with Firebase Emulator Suite");
    console.log("💡 Run with: firebase emulators:exec --project clinicalscribe-test 'node scripts/test-firestore-permissions.js'");
    return;
  }

  const rules = readFileSync("firestore.rules", "utf8");

  // Init emulated environment
  const testEnv = await initializeTestEnvironment({
    projectId: "clinicalscribe-test",
    firestore: { rules }
  });

  try {
    // Auth contexts
    const nurse1 = testEnv.authenticatedContext("nurse1").firestore();
    const nurse2 = testEnv.authenticatedContext("nurse2").firestore();
    const admin = testEnv.authenticatedContext("adminUser").firestore();

    // Create nurse1 profile with role nurse
    await setDoc(doc(nurse1, "profiles/nurse1"), { role: "nurse", uid: "nurse1" });

    // Create admin profile
    await setDoc(doc(admin, "profiles/adminUser"), { role: "admin", uid: "adminUser" });

    console.log("🧪 Running Firestore rules tests...");

    // Nurse1 can create their own SOAP note
    await assertSucceeds(
      setDoc(doc(nurse1, "soapNotes/note1"), {
        userId: "nurse1",
        createdAt: new Date().toISOString(),
        text: "SOAP for my patient"
      })
    );
    console.log("✅ Nurse1 can create their own SOAP note");

    // Nurse1 cannot create a SOAP note for nurse2
    await assertFails(
      setDoc(doc(nurse1, "soapNotes/note2"), {
        userId: "nurse2",
        createdAt: new Date().toISOString(),
        text: "Should not work"
      })
    );
    console.log("✅ Nurse1 cannot create a SOAP note for nurse2");

    // Nurse2 cannot read nurse1's note
    await assertFails(getDoc(doc(nurse2, "soapNotes/note1")));
    console.log("✅ Nurse2 cannot read nurse1's note");

    // Nurse1 can create their own patientSession
    await assertSucceeds(
      setDoc(doc(nurse1, "patientSessions/session1"), {
        patientId: "nurse1",
        createdAt: new Date().toISOString(),
        recordings: []
      })
    );
    console.log("✅ Nurse1 can create their own patientSession");

    // Nurse2 cannot read nurse1's patientSession
    await assertFails(getDoc(doc(nurse2, "patientSessions/session1")));
    console.log("✅ Nurse2 cannot read nurse1's patientSession");

    // Admin can read any profile
    await assertSucceeds(getDoc(doc(admin, "profiles/nurse1")));
    console.log("✅ Admin can read any profile");

    console.log("🎉 All Firestore rule tests passed!");
  } catch (error) {
    console.error("❌ Test failed:", error);
  } finally {
    await testEnv.cleanup();
  }
}

// Run the tests
runTests();