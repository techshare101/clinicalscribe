import * as admin from 'firebase-admin';

let app: admin.app.App;

export function initFirebaseAdmin() {
  if (!admin.apps.length) {
    const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;

    if (!serviceAccountBase64) {
      throw new Error('Missing FIREBASE_SERVICE_ACCOUNT_BASE64 env');
    }

    try {
      const serviceAccount = JSON.parse(
        Buffer.from(serviceAccountBase64, 'base64').toString('utf-8')
      );

      app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        projectId: serviceAccount.project_id,
      });
    } catch (error) {
      // Fallback initialization if service account parsing fails
      app = admin.initializeApp({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });
    }
  } else {
    app = admin.app();
  }

  return app;
}

// Export helpers (server-only)
export const adminApp = initFirebaseAdmin();
export const adminAuth = adminApp.auth();
export const adminDb = adminApp.firestore();

// Only initialize storage if bucket is configured
let adminStorage: admin.storage.Bucket | undefined;
if (process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET) {
  try {
    adminStorage = adminApp.storage().bucket(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);
    console.log('[Firebase Admin] Storage bucket initialized:', process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);
  } catch (error) {
    // Storage initialization failed, but we can continue without it
    console.error('[Firebase Admin] Failed to initialize Firebase storage bucket:', error);
    adminStorage = undefined;
  }
} else {
  console.warn('[Firebase Admin] NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET not configured - storage disabled');
}

export { adminStorage };
export const adminBucket = adminStorage; // Alias for backward compatibility

// Default export for backwards compatibility
export default admin;