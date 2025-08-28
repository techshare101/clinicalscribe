const admin = require('firebase-admin');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

console.log('🔍 Firebase Token Test');
console.log('====================');

// Check environment variable
if (!process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
  console.error('❌ FIREBASE_SERVICE_ACCOUNT_BASE64 is not set');
  process.exit(1);
}

console.log(`✅ FIREBASE_SERVICE_ACCOUNT_BASE64 is set`);

// Decode the service account
let serviceAccount;
try {
  const decoded = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, "base64").toString("utf8");
  serviceAccount = JSON.parse(decoded);
  console.log('✅ Service account decoded successfully');
} catch (decodeError) {
  console.error('❌ Failed to decode service account from base64:', decodeError.message);
  process.exit(1);
}

// Initialize Firebase Admin
try {
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
  
  // Test creating a custom token
  const auth = admin.auth();
  
  console.log('\n🔧 Creating custom token for test user...');
  auth.createCustomToken('test-user-id')
    .then((customToken) => {
      console.log('✅ Custom token created successfully');
      console.log(`   Token length: ${customToken.length}`);
      
      // Now test verifying the token
      console.log('\n🔧 Verifying custom token...');
      return auth.verifyIdToken(customToken);
    })
    .then((decodedToken) => {
      console.log('✅ Custom token verified successfully');
      console.log('   Decoded token UID:', decodedToken.uid);
      console.log('✅ All tests passed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Token verification failed:', error.message);
      console.error('   Error code:', error.code);
      process.exit(1);
    });
} catch (error) {
  console.error('❌ Firebase Admin initialization failed:', error.message);
  process.exit(1);
}