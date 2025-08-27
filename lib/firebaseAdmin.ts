import * as admin from "firebase-admin";

console.log('🔧 Firebase Admin: Module loaded');

if (!admin.apps.length) {
  // In local development, always use service account to avoid metadata server issues
  const isLocal = process.env.NODE_ENV === 'development' || !process.env.VERCEL;
  
  console.log('🔧 Firebase Admin: Initializing app, isLocal:', isLocal);
  
  if (isLocal) {
    console.log('🏠 Local development detected, using service account credentials');
    
    try {
      if (!process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
        throw new Error("❌ Missing FIREBASE_SERVICE_ACCOUNT_BASE64");
      }
      
      const serviceAccount = JSON.parse(
        Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, "base64").toString("utf8")
      );
      
      console.log('🔧 Firebase Admin: Service account keys:', Object.keys(serviceAccount));
      
      // Fix for private key newlines
      if (serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");
      }
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      });
      
      console.log('✅ Firebase Admin initialized with service account credentials (local)');
    } catch (error: any) {
      console.error('❌ Failed to initialize Firebase Admin with service account:', error.message);
      console.error('🔧 Error details:', error);
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
          if (!process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
            throw new Error("❌ Missing FIREBASE_SERVICE_ACCOUNT_BASE64");
          }
          
          const serviceAccount = JSON.parse(
            Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, "base64").toString("utf8")
          );
          
          // Fix for private key newlines
          if (serviceAccount.private_key) {
            serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");
          }
          
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
} else {
  console.log('🔧 Firebase Admin: Using existing app instance');
}

console.log('🔧 Firebase Admin: Creating service instances');
export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
export const adminBucket = admin.storage().bucket();

console.log('✅ Firebase Admin services initialized');
console.log('🔧 adminAuth type:', typeof adminAuth);
console.log('🔧 adminDb type:', typeof adminDb);
console.log('🔧 adminBucket type:', typeof adminBucket);

export default admin;