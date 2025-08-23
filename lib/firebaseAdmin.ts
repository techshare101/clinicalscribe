import * as admin from "firebase-admin";

if (!admin.apps.length) {
  // In local development, always use service account to avoid metadata server issues
  const isLocal = process.env.NODE_ENV === 'development' || !process.env.VERCEL;
  
  if (isLocal) {
    console.log('🏠 Local development detected, using service account credentials');
    
    try {
      if (!process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
        throw new Error('FIREBASE_SERVICE_ACCOUNT_BASE64 environment variable is required for local development');
      }
      
      const serviceAccount = JSON.parse(
        Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, "base64").toString()
      );
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      });
      
      console.log('✅ Firebase Admin initialized with service account credentials (local)');
    } catch (error: any) {
      console.error('❌ Failed to initialize Firebase Admin with service account:', error.message);
      throw new Error(`Firebase Admin initialization failed: ${error.message}`);
    }
  } else {
    console.log('☁️ Production environment detected, using application default credentials');
    
    try {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      });
      
      console.log('✅ Firebase Admin initialized with application default credentials (production)');
    } catch (error: any) {
      console.error('❌ Failed to initialize Firebase Admin with application default credentials:', error.message);
      
      // Fallback to service account even in production if available
      if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
        console.log('🔄 Falling back to service account credentials...');
        try {
          const serviceAccount = JSON.parse(
            Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, "base64").toString()
          );
          
          admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
          });
          
          console.log('✅ Firebase Admin initialized with service account credentials (fallback)');
        } catch (serviceAccountError: any) {
          console.error('❌ Service account fallback also failed:', serviceAccountError.message);
          throw new Error(`Firebase Admin initialization failed: ${serviceAccountError.message}`);
        }
      } else {
        throw new Error(`Firebase Admin initialization failed: ${error.message}`);
      }
    }
  }
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
export const adminBucket = admin.storage().bucket();

export default admin;
