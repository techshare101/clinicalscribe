// Import the functions you need from the SDKs you need
import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getStorage, FirebaseStorage } from "firebase/storage";
import { getFirestore, Firestore } from "firebase/firestore";

// Read env vars using direct references so Next.js can inline them in client bundles
const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const AUTH_DOMAIN = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const STORAGE_BUCKET = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
const MESSAGING_SENDER_ID = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
const APP_ID = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;
const MEASUREMENT_ID = process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID;

// Validate required Firebase env vars early to avoid opaque runtime errors (dev-friendly)
const missing: string[] = [];
if (!API_KEY || API_KEY.trim() === "") missing.push("NEXT_PUBLIC_FIREBASE_API_KEY");
if (!AUTH_DOMAIN || AUTH_DOMAIN.trim() === "") missing.push("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN");
if (!PROJECT_ID || PROJECT_ID.trim() === "") missing.push("NEXT_PUBLIC_FIREBASE_PROJECT_ID");
if (!STORAGE_BUCKET || STORAGE_BUCKET.trim() === "") missing.push("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET");
if (!MESSAGING_SENDER_ID || MESSAGING_SENDER_ID.trim() === "") missing.push("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID");
if (!APP_ID || APP_ID.trim() === "") missing.push("NEXT_PUBLIC_FIREBASE_APP_ID");

if (missing.length) {
  throw new Error(
    `Missing Firebase env vars: ${missing.join(
      ", "
    )}.\nAdd your Firebase Web App config to .env.local and restart the dev server. ` +
      `You can find these in Firebase Console > Project Settings > General > Your apps (Web).`
  );
}

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: API_KEY!,
  authDomain: AUTH_DOMAIN!,
  projectId: PROJECT_ID!,
  storageBucket: STORAGE_BUCKET!,
  messagingSenderId: MESSAGING_SENDER_ID!,
  appId: APP_ID!,
  // measurementId is optional for core auth/db/storage usage
  ...(MEASUREMENT_ID ? { measurementId: MEASUREMENT_ID } : {}),
};

// Debug: Log Firebase config
console.log('Firebase Config:', {
  apiKey: API_KEY?.slice(0, 5) + '...',  // Only log first 5 chars for security
  authDomain: AUTH_DOMAIN,
  projectId: PROJECT_ID,
  storageBucket: STORAGE_BUCKET,
  messagingSenderId: MESSAGING_SENDER_ID,
  appId: APP_ID?.split(':')[0] + '...',  // Only log first part for security
});

// Initialize Firebase (avoid re-initializing in Fast Refresh/dev)
let app: FirebaseApp;
if (typeof window !== 'undefined' && getApps().length === 0) {
  // Client-side initialization only
  console.log("Initializing new Firebase app");
  app = initializeApp(firebaseConfig);
} else if (typeof window !== 'undefined') {
  // Use existing app in browser
  console.log("Using existing Firebase app");
  app = getApps()[0]!;
} else {
  // Server-side: Don't initialize client SDK on server
  console.log("Skipping Firebase client initialization on server-side");
  // We'll return null here and handle it in the exports
  app = null as any;
}

// Initialize Firebase services only on client-side
export const auth: Auth = typeof window !== 'undefined' ? getAuth(app) : null as any;
console.log("Firebase auth initialized");

export const storage: FirebaseStorage = typeof window !== 'undefined' ? getStorage(app) : null as any;
console.log("Firebase storage initialized");

export const db: Firestore = typeof window !== 'undefined' ? getFirestore(app) : null as any;
console.log("Firebase firestore initialized");

// Add debugging to verify db is properly initialized
if (typeof window !== 'undefined') {
  // Only log in browser environment
  console.log("Firebase app initialized:", !!app);
  console.log("Firestore instance type:", typeof db);
  console.log("Is Firestore instance:", db instanceof Object && db.constructor?.name === 'Firestore');
  console.log("Firestore instance:", db);
}

// Add a function to verify Firestore is working
export const verifyFirestore = () => {
  if (typeof window === 'undefined') {
    // On server-side, we don't have client SDK
    return true;
  }
  if (!db) {
    throw new Error("Firestore is not initialized");
  }
  if (!(db instanceof Object) || db.constructor?.name !== 'Firestore') {
    throw new Error("Firestore is not a valid instance. Type: " + typeof db + ", Constructor: " + (db.constructor?.name || 'undefined'));
  }
  return true;
};
