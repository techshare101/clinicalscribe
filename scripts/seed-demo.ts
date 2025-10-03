#!/usr/bin/env tsx
/**
 * Dummy Firestore seeding script for ClinicalScribe testing
 * 
 * This script generates fake transcripts, SOAP notes, and reports
 * to quickly test the dashboard and app features without recording.
 * 
 * Usage:
 *   npm run seed-demo
 * 
 * Or run directly:
 *   npx tsx scripts/seed-demo.ts
 */

import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, doc, setDoc, Timestamp } from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

// Firebase config (using environment variables)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Sample data templates
const sampleTranscripts = [
  "Patient presents with chest pain that started 2 hours ago. Pain is sharp, radiating to left arm. No shortness of breath. Vitals stable. EKG shows normal sinus rhythm.",
  "45-year-old female with headache for 3 days. Describes as throbbing, worse in morning. No fever or neck stiffness. Taking ibuprofen with minimal relief.",
  "Routine follow-up for diabetes. Patient reports good glucose control at home. HbA1c improved from last visit. No complications noted.",
  "Child presents with fever and sore throat. Temperature 101.2F. Throat red and swollen. Rapid strep test positive. Started on amoxicillin.",
  "Elderly patient with fall yesterday. No loss of consciousness. Bruising on right hip. X-ray negative for fracture. Recommending physical therapy."
];

const sampleSoapNotes = [
  `SUBJECTIVE: 67-year-old male presents with acute onset chest pain.
OBJECTIVE: BP 140/90, HR 78, RR 16, O2 98%. Heart sounds regular, no murmurs.
ASSESSMENT: Possible angina vs musculoskeletal pain.
PLAN: EKG, troponin levels, cardiology consult.`,
  
  `SUBJECTIVE: 45-year-old female with migraine headache x3 days.
OBJECTIVE: Alert, oriented, no focal neurological deficits. BP 120/80.
ASSESSMENT: Migraine headache.
PLAN: Sumatriptan 100mg, follow up if symptoms persist.`,
  
  `SUBJECTIVE: Diabetic patient here for routine follow-up.
OBJECTIVE: HbA1c 7.1%, down from 8.2%. Weight stable.
ASSESSMENT: Type 2 diabetes, well controlled.
PLAN: Continue metformin, recheck in 3 months.`,
  
  `SUBJECTIVE: 8-year-old with fever and sore throat.
OBJECTIVE: Temp 101.2F, throat erythematous, rapid strep positive.
ASSESSMENT: Streptococcal pharyngitis.
PLAN: Amoxicillin 500mg BID x10 days, return if worse.`,
  
  `SUBJECTIVE: 82-year-old with fall at home yesterday.
OBJECTIVE: Bruising on right hip, able to bear weight. X-ray negative.
ASSESSMENT: Mechanical fall, no fracture.
PLAN: Physical therapy evaluation, home safety assessment.`
];

const patientNames = [
  "John Smith", "Sarah Johnson", "Michael Brown", "Emily Davis", "Robert Wilson",
  "Jessica Miller", "David Garcia", "Ashley Rodriguez", "Christopher Martinez", "Amanda Taylor"
];

async function seedDemoData() {
  try {
    console.log("🌱 Starting demo data seeding...");
    
    // You'll need to sign in as a test user
    // Replace with your test user credentials
    const TEST_EMAIL = "test@example.com";
    const TEST_PASSWORD = "testpassword";
    
    console.log("🔐 Signing in as test user...");
    const userCredential = await signInWithEmailAndPassword(auth, TEST_EMAIL, TEST_PASSWORD);
    const userId = userCredential.user.uid;
    
    console.log(`✅ Signed in as: ${userId}`);
    
    // 1. Ensure user has beta access
    console.log("🚀 Setting beta access for user...");
    await setDoc(doc(db, "profiles", userId), {
      betaActive: true,
      role: "doctor",
      displayName: "Dr. Test User",
      email: TEST_EMAIL,
      updatedAt: Timestamp.now()
    }, { merge: true });
    
    // 2. Create sample reports
    console.log("📋 Creating sample reports...");
    for (let i = 0; i < 5; i++) {
      const reportData = {
        userId, // ✅ Using userId field to match Firestore rules
        uid: userId, // Also include uid for backward compatibility
        transcript: sampleTranscripts[i],
        soapNote: sampleSoapNotes[i],
        pdfUrl: `https://example.com/sample-report-${i + 1}.pdf`, // Fake PDF URL
        patientName: patientNames[i],
        status: "completed",
        createdAt: Timestamp.fromDate(new Date(Date.now() - (i * 24 * 60 * 60 * 1000))), // Spread over last 5 days
        updatedAt: Timestamp.now()
      };
      
      const docRef = await addDoc(collection(db, "reports"), reportData);
      console.log(`  ✅ Created report: ${docRef.id}`);
    }
    
    // 3. Create sample SOAP notes with correct userId field
    console.log("🏥 Creating sample SOAP notes...");
    for (let i = 0; i < 5; i++) {
      // Parse the sample SOAP note content to extract S, O, A, P sections
      const content = sampleSoapNotes[i];
      const sections = content.split("\n\n");
      
      const soapData = {
        userId, // ✅ Using userId field to match Firestore rules
        uid: userId, // Also include uid for backward compatibility
        patientId: `patient_${i + 1}`,
        patientName: patientNames[i],
        subjective: sections[0]?.replace("SUBJECTIVE: ", "") || "",
        objective: sections[1]?.replace("OBJECTIVE: ", "") || "",
        assessment: sections[2]?.replace("ASSESSMENT: ", "") || "",
        plan: sections[3]?.replace("PLAN: ", "") || "",
        redFlag: i === 0, // Flag first note
        status: "completed",
        pdf: {
          status: "generated",
          url: `https://example.com/soap-${i + 1}.pdf`
        },
        createdAt: Timestamp.fromDate(new Date(Date.now() - (i * 12 * 60 * 60 * 1000))), // Last 5 days
        updatedAt: Timestamp.now()
      };
      
      const docRef = await addDoc(collection(db, "soapNotes"), soapData);
      console.log(`  ✅ Created SOAP note: ${docRef.id}`);
    }
    
    // 4. Create sample patients
    console.log("👤 Creating sample patients...");
    for (let i = 0; i < 5; i++) {
      const patientData = {
        userId, // ✅ Using userId field to match Firestore rules
        ownerId: userId, // Also include ownerId for backward compatibility
        name: patientNames[i],
        status: i % 3 === 0 ? "Awaiting Summary" : i % 3 === 1 ? "SOAP Ready" : "Signed",
        priority: i % 3 === 0 ? "High" : i % 3 === 1 ? "Medium" : "Low",
        room: `Room ${100 + i}`,
        timestamp: Timestamp.fromDate(new Date(Date.now() - (i * 30 * 60 * 1000))), // Last 2.5 hours
        createdAt: Timestamp.now()
      };
      
      const docRef = await addDoc(collection(db, "patients"), patientData);
      console.log(`  ✅ Created patient: ${docRef.id}`);
    }
    
    // 5. Create sample audit logs
    console.log("📝 Creating sample audit logs...");
    const actions = ["Approved Note", "Exported PDF", "Reviewed Summary", "Flagged for Review", "Created SOAP"];
    for (let i = 0; i < 5; i++) {
      const auditData = {
        userId, // ✅ Using userId field to match Firestore rules
        user: `Dr. Test User`,
        action: actions[i],
        patient: patientNames[i],
        timestamp: Timestamp.fromDate(new Date(Date.now() - (i * 15 * 60 * 1000))), // Last 75 minutes
        createdAt: Timestamp.now()
      };
      
      const docRef = await addDoc(collection(db, "audit_logs"), auditData);
      console.log(`  ✅ Created audit log: ${docRef.id}`);
    }
    
    // 6. Create sample analytics data
    console.log("📊 Creating sample analytics...");
    const metrics = [
      { metric: "Daily Transcriptions", value: 24, target: 30, unit: "records" },
      { metric: "Completion Rate", value: 85, target: 95, unit: "%" },
      { metric: "Accuracy Rate", value: 92, target: 98, unit: "%" },
      { metric: "Active Sessions", value: 3, target: 5, unit: "sessions" }
    ];
    
    for (let i = 0; i < metrics.length; i++) {
      const analyticData = {
        ...metrics[i],
        userId, // ✅ Using userId field for consistency
        createdAt: Timestamp.now()
      };
      
      const docRef = await addDoc(collection(db, "analytics"), analyticData);
      console.log(`  ✅ Created analytic: ${docRef.id}`);
    }
    
    // 7. Create additional transcripts without SOAP notes
    console.log("🎤 Creating additional transcripts...");
    for (let i = 0; i < 3; i++) {
      const transcriptData = {
        userId, // ✅ Using userId field to match Firestore rules
        uid: userId, // Also include uid for backward compatibility
        transcript: `Additional transcript ${i + 1}: ${sampleTranscripts[i]}`,
        audioUrl: `https://example.com/audio-${i + 1}.mp3`, // Fake audio URL
        duration: Math.floor(Math.random() * 300) + 60, // 1-5 minutes
        status: "transcribed",
        createdAt: Timestamp.fromDate(new Date(Date.now() - (i * 6 * 60 * 60 * 1000))), // Last 18 hours
        updatedAt: Timestamp.now()
      };
      
      const docRef = await addDoc(collection(db, "transcripts"), transcriptData);
      console.log(`  ✅ Created transcript: ${docRef.id}`);
    }
    
    console.log("\n🎉 Demo data seeding completed successfully!");
    console.log("\n📊 Summary:");
    console.log("  • 5 complete reports (transcript + SOAP + PDF)");
    console.log("  • 5 standalone SOAP notes with correct userId field");
    console.log("  • 5 patient records");
    console.log("  • 5 audit logs");
    console.log("  • 4 analytics metrics");
    console.log("  • 3 standalone transcripts");
    console.log("  • User profile with beta access enabled");
    console.log("\n✨ You can now test the dashboard with realistic data!");
    
  } catch (error) {
    console.error("❌ Error seeding demo data:", error);
    process.exit(1);
  }
}

// Helper function to clear existing demo data (optional)
async function clearDemoData() {
  try {
    console.log("🧹 Clearing existing demo data...");
    
    // You'll need to sign in as a test user
    // Replace with your test user credentials
    const TEST_EMAIL = "test@example.com";
    const TEST_PASSWORD = "testpassword";
    
    console.log("🔐 Signing in as test user...");
    const userCredential = await signInWithEmailAndPassword(auth, TEST_EMAIL, TEST_PASSWORD);
    const userId = userCredential.user.uid;
    
    console.log(`✅ Signed in as: ${userId}`);
    
    // Clear SOAP notes
    console.log("🗑️  Clearing SOAP notes...");
    const soapNotesRef = collection(db, "soapNotes");
    const q = query(soapNotesRef, where("uid", "==", userId));
    const querySnapshot = await getDocs(q);
    
    console.log(`Found ${querySnapshot.size} SOAP notes to delete`);
    
    const batch = db.batch();
    querySnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    if (!querySnapshot.empty) {
      await batch.commit();
      console.log("✅ SOAP notes cleared");
    } else {
      console.log("✅ No SOAP notes to clear");
    }
    
    console.log("🎉 Demo data clearing completed!");
  } catch (error) {
    console.error("❌ Error clearing demo data:", error);
    process.exit(1);
  }
}

// Seed specific demo SOAP notes for SOAP History page
async function seedSOAPHistoryDemo(userId: string) {
  const demoNotes = [
    {
      patientName: "John Doe",
      subjective: "Patient reports chest pain, mild shortness of breath.",
      objective: "BP 140/90, HR 96, O2 95%",
      assessment: "Hypertension, possible angina",
      plan: "Start medication, schedule stress test",
      redFlag: true, // 👈 will appear under "Flagged"
      createdAt: Timestamp.now(),
      uid: userId,
      userId,
    },
    {
      patientName: "Jane Smith",
      subjective: "Complains of headache.",
      objective: "BP 120/80, HR 72",
      assessment: "Migraine likely",
      plan: "Prescribe triptan, hydration, follow-up in 1 week",
      redFlag: false, // 👈 will appear under "Standard"
      createdAt: Timestamp.now(),
      uid: userId,
      userId,
    },
    {
      patientName: "Robert Johnson",
      subjective: "Routine checkup, no complaints.",
      objective: "Vitals normal",
      assessment: "Healthy adult",
      plan: "Continue current lifestyle",
      redFlag: false, // 👈 will appear under "Standard"
      pdf: { status: "generated" }, // 👈 will appear under "PDF Ready"
      createdAt: Timestamp.now(),
      uid: userId,
      userId,
    },
  ];

  console.log("📝 Creating specific SOAP notes for SOAP History page...");
  for (const note of demoNotes) {
    const docRef = await addDoc(collection(db, "soapNotes"), note);
    console.log(`  ✅ Seeded note for ${note.patientName}: ${docRef.id}`);
  }
}

// Run the seeding
if (require.main === module) {
  const command = process.argv[2];
  
  if (command === "clear") {
    clearDemoData();
  } else if (command === "soap-history") {
    // Special command to seed only SOAP history demo data
    seedSOAPHistoryDemo(process.env.DEMO_USER_ID || "demo-user-123");
  } else {
    seedDemoData();
  }
}

export { seedDemoData, seedSOAPHistoryDemo, clearDemoData };