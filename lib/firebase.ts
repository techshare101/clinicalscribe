// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore";

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

// Initialize Firebase (avoid re-initializing in Fast Refresh/dev)
const app = getApps().length ? getApps()[0]! : initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const storage = getStorage(app);
export const db = getFirestore(app);