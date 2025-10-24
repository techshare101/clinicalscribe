import admin from "firebase-admin";

if (!admin.apps.length) {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  
  // Support both methods: base64 service account OR individual credentials
  let credential;
  const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  
  if (serviceAccountBase64) {
    // Method 1: Base64-encoded service account JSON
    const serviceAccount = JSON.parse(
      Buffer.from(serviceAccountBase64, "base64").toString()
    );
    credential = admin.credential.cert(serviceAccount);
    console.log("[Firebase Admin] Using base64 service account");
  } else {
    // Method 2: Individual credential fields
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
    
    if (!clientEmail || !privateKey) {
      throw new Error(
        "Missing Firebase credentials. Set either FIREBASE_SERVICE_ACCOUNT_BASE64 or both FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY"
      );
    }
    
    credential = admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    });
    console.log("[Firebase Admin] Using individual credential fields");
  }

  const bucket =
    process.env.FIREBASE_STORAGE_BUCKET ||
    `${projectId}.appspot.com`; // fallback for safety

  if (!bucket) {
    throw new Error(
      "❌ FIREBASE_STORAGE_BUCKET is missing. Please set it in your .env.local"
    );
  }

  console.log("[Firebase Admin] Initializing with project:", projectId);
  console.log("[Firebase Admin] Using storage bucket:", bucket);

  admin.initializeApp({
    credential,
    storageBucket: bucket,
  });
}

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();

// Lazy initialization to avoid build-time errors
let _adminBucket: admin.storage.Bucket | null = null;
export function getAdminBucket(): admin.storage.Bucket {
  if (!_adminBucket) {
    _adminBucket = admin.storage().bucket();
  }
  return _adminBucket;
}

// Deprecated: Use getAdminBucket() instead
export const adminBucket = new Proxy({} as admin.storage.Bucket, {
  get(_target, prop) {
    return (getAdminBucket() as any)[prop];
  },
});
