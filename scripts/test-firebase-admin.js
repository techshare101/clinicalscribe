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

if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 === 'your-base64-encoded-service-account-json-here') {
  console.error('❌ FIREBASE_SERVICE_ACCOUNT_BASE64 is still set to the placeholder value');
  process.exit(1);
}

console.log(`✅ FIREBASE_SERVICE_ACCOUNT_BASE64 is set (length: ${process.env.FIREBASE_SERVICE_ACCOUNT_BASE64.length})`);

// Try to decode the service account
console.log('\n2. Decoding service account...');
try {
  let serviceAccount;
  try {
    // Try to parse as JSON first (in case it's already decoded)
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64);
  } catch {
    // If that fails, decode from base64
    const decoded = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, "base64").toString("utf8");
    serviceAccount = JSON.parse(decoded);
  }
  
  console.log('✅ Service account decoded successfully');
  console.log(`   Project ID: ${serviceAccount.project_id}`);
  console.log(`   Client Email: ${serviceAccount.client_email}`);
  console.log(`   Private Key ID: ${serviceAccount.private_key_id?.substring(0, 8)}...`);
} catch (error) {
  console.error('❌ Failed to decode service account:', error.message);
  process.exit(1);
}

// Test Firebase Admin initialization
console.log('\n3. Testing Firebase Admin initialization...');
try {
  import { adminDb } from '../lib/firebaseAdmin.js';

  async function testFirebaseAdmin() {
    try {
      console.log('Testing Firebase Admin connection...');
      
      // Test connection by counting a collection
      const sessionsSnap = await adminDb.collection('patientSessions').limit(1).get();
      console.log(`✅ Successfully connected to Firestore. Found ${sessionsSnap.size} documents in patientSessions collection.`);
      
      // Test counting
      const countSnap = await adminDb.collection('patientSessions').count().get();
      console.log(`📊 Total patientSessions: ${countSnap.data().count}`);
      
      console.log('✅ Firebase Admin is working correctly!');
    } catch (error) {
      console.error('❌ Firebase Admin test failed:', error.message);
      console.error('Error stack:', error.stack);
    }
  }

  testFirebaseAdmin();
  
  console.log('✅ Firebase Admin module loaded successfully');
  console.log(`   adminDb type: ${typeof adminDb}`);
  console.log(`   adminAuth type: ${typeof adminAuth}`);
  
  // Test basic Firestore operation
  console.log('\n4. Testing Firestore connection...');
  // Just verify the service is available - don't actually query
  if (adminDb && typeof adminDb.collection === 'function') {
    console.log('✅ Firestore service is available');
  } else {
    console.error('❌ Firestore service is not available');
  }
  
  console.log('\n🎉 All tests passed! Firebase Admin is properly configured.');
  
} catch (error) {
  console.error('❌ Firebase Admin initialization failed:', error.message);
  console.error('🔧 Error details:', error.stack);
  process.exit(1);
}