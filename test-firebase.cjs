require('dotenv').config({ path: '.env.local' });

console.log('Testing Firebase Admin configuration...');

console.log('Environment variables:');
console.log('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:', process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);
console.log('FIREBASE_SERVICE_ACCOUNT_BASE64 length:', process.env.FIREBASE_SERVICE_ACCOUNT_BASE64?.length || 0);

// Test the Firebase Admin initialization
try {
  const { adminStorage, adminBucket } = require('./lib/firebase-admin.ts');
  
  console.log('\nFirebase Admin Status:');
  console.log('adminStorage:', !!adminStorage ? 'Initialized' : 'Not initialized');
  console.log('adminBucket:', !!adminBucket ? 'Initialized' : 'Not initialized');

  if (adminBucket) {
    console.log('Bucket name:', adminBucket.name);
    
    // Test bucket existence
    adminBucket.exists()
      .then(([exists]) => {
        console.log('Bucket exists:', exists);
        if (exists) {
          console.log('✅ Firebase Storage is properly configured!');
        } else {
          console.log('❌ Bucket does not exist. Enable Cloud Storage in Firebase Console.');
          console.log('Visit: https://console.firebase.google.com/project/clinicalscribe-511e7/storage');
        }
      })
      .catch((error) => {
        console.error('❌ Error checking bucket:', error.message);
        console.log('This might indicate that Cloud Storage is not enabled in Firebase Console.');
      });
  } else {
    console.log('❌ adminBucket not initialized. Check environment variables.');
  }
} catch (error) {
  console.error('❌ Error importing Firebase Admin:', error.message);
}