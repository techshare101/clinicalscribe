#!/usr/bin/env tsx
/**
 * Dashboard Data Seeding Script for ClinicalScribe
 * 
 * This script seeds the Firestore database with data specifically for the dashboard:
 * - patients: For Patient Queue Overview
 * - transcriptions: For Summary Feed
 * - analytics: For Triage Analytics
 * - audit_logs: For Audit Trail
 * 
 * Usage:
 *   npx tsx scripts/seedDashboard.ts
 */

import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, doc, setDoc, Timestamp } from "firebase/firestore";

// Firebase config (using environment variables)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

console.log("Firebase config:", {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? "[REDACTED]" : "[MISSING]",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ? "[SET]" : "[MISSING]",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? "[SET]" : "[MISSING]",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ? "[SET]" : "[MISSING]",
});

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Sample data for the dashboard
const mockPatients = [
  { id: "p1", name: "John Doe", status: "Awaiting Summary", priority: "High", room: "Room 101", timestamp: new Date(Date.now() - 2 * 60 * 1000) },
  { id: "p2", name: "Jane Smith", status: "SOAP Ready", priority: "Medium", room: "Room 205", timestamp: new Date(Date.now() - 5 * 60 * 1000) },
  { id: "p3", name: "Robert Johnson", status: "Signed", priority: "Low", room: "Room 302", timestamp: new Date(Date.now() - 10 * 60 * 1000) },
  { id: "p4", name: "Emily Davis", status: "Awaiting Summary", priority: "High", room: "Room 105", timestamp: new Date(Date.now() - 15 * 60 * 1000) },
  { id: "p5", name: "Michael Wilson", status: "SOAP Ready", priority: "Medium", room: "Room 210", timestamp: new Date(Date.now() - 20 * 60 * 1000) },
];

const mockTranscriptions = [
  { id: "t1", patient: "John Doe", type: "Summary", content: "Patient presents with chest pain, diagnosed with mild hypertension.", timestamp: new Date(Date.now() - 2 * 60 * 1000) },
  { id: "t2", patient: "Jane Smith", type: "SOAP", content: "Subjective: Patient reports headache. Objective: BP 140/90. Assessment: Hypertension. Plan: Prescribe medication.", timestamp: new Date(Date.now() - 5 * 60 * 1000) },
  { id: "t3", patient: "Robert Johnson", type: "Summary", content: "Routine checkup, all vitals normal.", timestamp: new Date(Date.now() - 10 * 60 * 1000) },
  { id: "t4", patient: "Emily Davis", type: "SOAP", content: "Subjective: Patient complains of back pain. Objective: Pain scale 7/10. Assessment: Muscle strain. Plan: Physical therapy.", timestamp: new Date(Date.now() - 15 * 60 * 1000) },
  { id: "t5", patient: "Michael Wilson", type: "Summary", content: "Follow-up visit, medication adjusted.", timestamp: new Date(Date.now() - 20 * 60 * 1000) },
];

const mockAnalytics = [
  { id: "today", metric: "Daily Transcriptions", value: 24, target: 30, unit: "records" },
  { id: "completion", metric: "Completion Rate", value: 85, target: 95, unit: "%" },
  { id: "accuracy", metric: "Accuracy Rate", value: 92, target: 98, unit: "%" },
  { id: "active", metric: "Active Sessions", value: 3, target: 5, unit: "sessions" },
];

const mockAuditLogs = [
  { id: "a1", user: "Dr. Sarah Connor", action: "Approved Note", patient: "John Doe", timestamp: new Date(Date.now() - 2 * 60 * 1000) },
  { id: "a2", user: "Nurse Mike Johnson", action: "Exported PDF", patient: "Jane Smith", timestamp: new Date(Date.now() - 5 * 60 * 1000) },
  { id: "a3", user: "Admin Alex Thompson", action: "Reviewed Summary", patient: "Robert Johnson", timestamp: new Date(Date.now() - 10 * 60 * 1000) },
  { id: "a4", user: "Dr. Sarah Connor", action: "Flagged for Review", patient: "Emily Davis", timestamp: new Date(Date.now() - 15 * 60 * 1000) },
  { id: "a5", user: "Nurse Mike Johnson", action: "Created SOAP", patient: "Michael Wilson", timestamp: new Date(Date.now() - 20 * 60 * 1000) },
];

async function seedDashboardData() {
  try {
    console.log("🌱 Starting dashboard data seeding...");
    
    // Optional: Sign in as a test user
    // Uncomment and set credentials if needed
    /*
    const TEST_EMAIL = "test@example.com";
    const TEST_PASSWORD = "testpassword";
    
    console.log("🔐 Signing in as test user...");
    const userCredential = await signInWithEmailAndPassword(auth, TEST_EMAIL, TEST_PASSWORD);
    const userId = userCredential.user.uid;
    console.log(`✅ Signed in as: ${userId}`);
    */
    
    // 1. Seed patients collection for Patient Queue Overview
    console.log("👨‍⚕️ Creating patient queue data...");
    for (const patient of mockPatients) {
      await setDoc(doc(db, "patients", patient.id), {
        name: patient.name,
        status: patient.status,
        priority: patient.priority,
        room: patient.room,
        timestamp: Timestamp.fromDate(patient.timestamp),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      console.log(`  ✅ Created patient: ${patient.id} - ${patient.name}`);
    }
    
    // 2. Seed transcriptions collection for Summary Feed
    console.log("🎙️ Creating transcription feed data...");
    for (const transcription of mockTranscriptions) {
      await setDoc(doc(db, "transcriptions", transcription.id), {
        patient: transcription.patient,
        type: transcription.type,
        content: transcription.content,
        timestamp: Timestamp.fromDate(transcription.timestamp),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      console.log(`  ✅ Created transcription: ${transcription.id}`);
    }
    
    // 3. Seed analytics collection for Triage Analytics
    console.log("📊 Creating analytics data...");
    for (const metric of mockAnalytics) {
      await setDoc(doc(db, "analytics", metric.id), {
        metric: metric.metric,
        value: metric.value,
        target: metric.target,
        unit: metric.unit,
        date: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      console.log(`  ✅ Created analytics metric: ${metric.id}`);
    }
    
    // 4. Seed audit_logs collection for Audit Trail
    console.log("🔐 Creating audit logs data...");
    for (const log of mockAuditLogs) {
      await setDoc(doc(db, "audit_logs", log.id), {
        user: log.user,
        action: log.action,
        patient: log.patient,
        timestamp: Timestamp.fromDate(log.timestamp),
        createdAt: Timestamp.now()
      });
      console.log(`  ✅ Created audit log: ${log.id}`);
    }
    
    console.log("\n🎉 Dashboard data seeding completed successfully!");
    console.log("\n📊 Summary:");
    console.log(`  • ${mockPatients.length} patients in queue`);
    console.log(`  • ${mockTranscriptions.length} transcriptions in feed`);
    console.log(`  • ${mockAnalytics.length} analytics metrics`);
    console.log(`  • ${mockAuditLogs.length} audit logs`);
    console.log("\n✨ You can now view the dashboard with live data!");
    
  } catch (error) {
    console.error("❌ Error seeding dashboard data:", error);
    process.exit(1);
  }
}

// Helper function to clear existing dashboard data
async function clearDashboardData() {
  console.log("🧹 This would clear existing dashboard data...");
  console.log("⚠️  Implement this if you need to reset dashboard data");
  // Implementation would delete documents from dashboard collections
}

// Run the seeding
const command = process.argv[2];

if (command === "clear") {
  clearDashboardData();
} else {
  seedDashboardData();
}

export { seedDashboardData, clearDashboardData };