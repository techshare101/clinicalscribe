import { adminStorage, adminBucket } from './lib/firebase-admin.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

console.log('Testing Firebase Admin configuration...');

console.log('Environment variables:');
console.log('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:', process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);
console.log('FIREBASE_SERVICE_ACCOUNT_BASE64 length:', process.env.FIREBASE_SERVICE_ACCOUNT_BASE64?.length || 0);

console.log('\nFirebase Admin Status:');
console.log('adminStorage:', !!adminStorage ? 'Initialized' : 'Not initialized');
console.log('adminBucket:', !!adminBucket ? 'Initialized' : 'Not initialized');

if (adminBucket) {
  console.log('Bucket name:', adminBucket.name);
  
  // Test bucket existence
  try {
    const [exists] = await adminBucket.exists();
    console.log('Bucket exists:', exists);
    if (exists) {
      console.log('✅ Firebase Storage is properly configured!');
    } else {
      console.log('❌ Bucket does not exist. Enable Cloud Storage in Firebase Console.');
    }
  } catch (error) {
    console.error('❌ Error checking bucket:', error.message);
  }
} else {
  console.log('❌ adminBucket not initialized. Check environment variables.');
}
