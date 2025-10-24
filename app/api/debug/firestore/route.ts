import { NextRequest, NextResponse } from "next/server";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, collection, getDocs, query, where, limit } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export async function GET(req: NextRequest) {
  try {
    console.log("🔍 Debug: Starting Firestore permissions test");
    
    // Check authentication state
    const user = auth.currentUser;
    console.log("👤 Current user:", user?.uid, user?.email);
    
    if (!user) {
      return NextResponse.json({
        error: "No authenticated user",
        suggestion: "Please sign in first"
      }, { status: 401 });
    }

    const uid = user.uid;
    const results: any = {
      uid,
      email: user.email,
      tests: {}
    };

    // Test 1: Read own profile
    try {
      console.log(`📖 Test 1: Reading profile for uid: ${uid}`);
      const profileRef = doc(db, "profiles", uid);
      const profileSnap = await getDoc(profileRef);
      
      results.tests.readOwnProfile = {
        success: true,
        exists: profileSnap.exists(),
        data: profileSnap.exists() ? profileSnap.data() : null
      };
      console.log("✅ Profile read successful");
    } catch (error: any) {
      console.error("❌ Profile read failed:", error.message);
      results.tests.readOwnProfile = {
        success: false,
        error: error.message,
        code: error.code
      };
    }

    // Test 2: Read SOAP notes
    try {
      console.log(`📝 Test 2: Reading SOAP notes for uid: ${uid}`);
      const notesQuery = query(
        collection(db, "soapNotes"),
        where("userId", "==", uid),
        limit(1)
      );
      const notesSnap = await getDocs(notesQuery);
      
      results.tests.readSoapNotes = {
        success: true,
        count: notesSnap.size,
        hasData: !notesSnap.empty
      };
      console.log("✅ SOAP notes read successful");
    } catch (error: any) {
      console.error("❌ SOAP notes read failed:", error.message);
      results.tests.readSoapNotes = {
        success: false,
        error: error.message,
        code: error.code
      };
    }

    // Test 3: Read reports
    try {
      console.log(`📊 Test 3: Reading reports for uid: ${uid}`);
      const reportsQuery = query(
        collection(db, "reports"),
        where("userId", "==", uid),
        limit(1)
      );
      const reportsSnap = await getDocs(reportsQuery);
      
      results.tests.readReports = {
        success: true,
        count: reportsSnap.size,
        hasData: !reportsSnap.empty
      };
      console.log("✅ Reports read successful");
    } catch (error: any) {
      console.error("❌ Reports read failed:", error.message);
      results.tests.readReports = {
        success: false,
        error: error.message,
        code: error.code
      };
    }

    return NextResponse.json(results);
    
  } catch (error: any) {
    console.error("🚨 Debug endpoint error:", error);
    return NextResponse.json({
      error: "Debug test failed",
      message: error.message,
      code: error.code
    }, { status: 500 });
  }
}
