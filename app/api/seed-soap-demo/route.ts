import { NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    // Get the user from the Authorization header
    const authHeader = req.headers.get("Authorization");
    console.log("🔍 SOAP Demo Seeding API: Auth header received:", authHeader ? "Present" : "Missing");
    
    if (!authHeader?.startsWith("Bearer ")) {
      console.log("❌ SOAP Demo Seeding API: Invalid auth header format");
      return NextResponse.json({ error: "Missing or invalid Authorization header" }, { status: 401 });
    }
    
    const token = authHeader.split(" ")[1];
    console.log("🔍 SOAP Demo Seeding API: Token length:", token?.length || 0);
    
    // Verify the token using Firebase Admin
    console.log("🔍 SOAP Demo Seeding API: Verifying token...");
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;
    console.log("✅ SOAP Demo Seeding API: Token verified for user:", userId);
    
    console.log('Seeding SOAP notes for user:', userId); // Debug log
    
    // Create demo SOAP notes for the SOAP History page
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

    // Add the demo notes to Firestore
    const batch = adminDb.batch();
    const soapNotesRef = adminDb.collection("soapNotes");
    
    for (const note of demoNotes) {
      const newDocRef = soapNotesRef.doc();
      batch.set(newDocRef, note);
      console.log('Seeding note:', note); // Debug log
    }
    
    await batch.commit();
    
    console.log('Seeded', demoNotes.length, 'SOAP notes for user:', userId); // Debug log
    
    return NextResponse.json({ 
      success: true, 
      message: "SOAP History demo data seeded successfully!",
      count: demoNotes.length
    });
  } catch (err: any) {
    console.error("❌ SOAP Demo Seeding API error:", err.message);
    console.error("❌ SOAP Demo Seeding API error code:", err.code);
    console.error("❌ SOAP Demo Seeding API error stack:", err.stack);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
