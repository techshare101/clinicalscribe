const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

console.log('🔍 Firebase Admin Test');
console.log('======================');

// Check environment variable
console.log('1. Checking environment variables...');
if (!process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
  console.error('❌ FIREBASE_SERVICE_ACCOUNT_BASE64 is not set');
  process.exit(1);
}

console.log(`✅ FIREBASE_SERVICE_ACCOUNT_BASE64 is set (length: ${process.env.FIREBASE_SERVICE_ACCOUNT_BASE64.length})`);

// Try to decode the service account
console.log('\n2. Decoding service account...');
let serviceAccount;
try {
  // Try to parse as JSON first (in case it's already decoded)
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64);
} catch {
  // If that fails, decode from base64
  try {
    const decoded = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, "base64").toString("utf8");
    serviceAccount = JSON.parse(decoded);
  } catch (decodeError) {
    console.error('❌ Failed to decode service account from base64:', decodeError.message);
    process.exit(1);
  }
}

console.log('✅ Service account decoded successfully');
console.log(`   Project ID: ${serviceAccount.project_id}`);
console.log(`   Client Email: ${serviceAccount.client_email}`);
console.log(`   Private Key ID: ${serviceAccount.private_key_id?.substring(0, 8)}...`);

// Test Firebase Admin initialization
console.log('\n3. Testing Firebase Admin initialization...');
try {
  // Import the Firebase Admin module
  const admin = require('firebase-admin');
  
  // Initialize app with service account
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      projectId: serviceAccount.project_id,
    });
    console.log('✅ Firebase Admin initialized successfully');
  } else {
    console.log('🔧 Using existing Firebase Admin instance');
  }
  
  // Test creating a custom token (this requires valid credentials)
  console.log('\n4. Testing custom token creation...');
  const auth = admin.auth();
  
  // Try to create a custom token for a test UID
  auth.createCustomToken('test-user-id')
    .then((customToken) => {
      console.log('✅ Custom token created successfully');
      console.log(`   Token length: ${customToken.length}`);
      console.log('✅ All Firebase Admin tests passed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Failed to create custom token:', error.message);
      console.error('   Error code:', error.code);
      process.exit(1);
    });
} catch (error) {
  console.error('❌ Firebase Admin initialization failed:', error.message);
  console.error('Error stack:', error.stack);
  process.exit(1);
}