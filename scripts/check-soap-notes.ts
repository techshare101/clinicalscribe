#!/usr/bin/env tsx
/**
 * Script to check what's in the soapNotes collection
 */

import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, where } from "firebase/firestore";
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

async function checkSOAPNotes() {
  try {
    console.log("🔍 Checking SOAP notes in Firestore...");
    
    // You'll need to sign in as a test user
    // Replace with your test user credentials
    const TEST_EMAIL = "test@example.com";
    const TEST_PASSWORD = "testpassword";
    
    console.log("🔐 Signing in as test user...");
    const userCredential = await signInWithEmailAndPassword(auth, TEST_EMAIL, TEST_PASSWORD);
    const userId = userCredential.user.uid;
    
    console.log(`✅ Signed in as: ${userId}`);
    
    // Query the soapNotes collection for this user
    console.log("📄 Fetching SOAP notes...");
    const q = query(collection(db, "soapNotes"), where("uid", "==", userId));
    const querySnapshot = await getDocs(q);
    
    console.log(`Found ${querySnapshot.size} SOAP notes for user ${userId}`);
    
    querySnapshot.forEach((doc) => {
      console.log(`\n📝 SOAP Note ID: ${doc.id}`);
      console.log("Data:", doc.data());
    });
    
    if (querySnapshot.empty) {
      console.log("No SOAP notes found for this user.");
    }
    
  } catch (error) {
    console.error("❌ Error checking SOAP notes:", error);
    process.exit(1);
  }
}

// Run the check
checkSOAPNotes();