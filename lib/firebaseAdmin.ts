import * as admin from "firebase-admin";

if (!admin.apps.length) {
  try {
    // Try application default credentials first (works in production/Vercel)
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    });
    console.log('✅ Firebase Admin initialized with application default credentials');
  } catch (error) {
    console.log('⚠️  Application default credentials not available, falling back to service account');
    
    // Fallback to service account for local development
    try {
      const serviceAccount = JSON.parse(
        Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64!, "base64").toString()
      );
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      });
      console.log('✅ Firebase Admin initialized with service account credentials');
    } catch (serviceAccountError) {
      console.error('❌ Failed to initialize Firebase Admin with either method:', serviceAccountError);
      throw serviceAccountError;
    }
  }
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
export const adminBucket = admin.storage().bucket();

export default admin;
