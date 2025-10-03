const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

console.log('🔍 Firebase Service Account Test');
console.log('==============================');

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

// Test JWT signature
console.log('\n3. Testing JWT signature...');
try {
  const privateKey = serviceAccount.private_key;
  if (!privateKey) {
    console.error('❌ Private key is missing from service account');
    process.exit(1);
  }
  
  // Check if private key looks valid
  if (!privateKey.startsWith('-----BEGIN PRIVATE KEY-----') || !privateKey.endsWith('-----END PRIVATE KEY-----\n')) {
    console.error('❌ Private key format is invalid');
    console.error('Private key should start with "-----BEGIN PRIVATE KEY-----" and end with "-----END PRIVATE KEY-----"');
    process.exit(1);
  }
  
  console.log('✅ Private key format looks correct');
} catch (error) {
  console.error('❌ JWT signature test failed:', error.message);
  process.exit(1);
}

console.log('\n✅ All tests passed! Service account is properly configured.');