const fs = require('fs');
const path = require('path');

console.log('🔐 Firebase Service Account Encoder');
console.log('=====================================');

// Get the service account file path from command line arguments
const serviceAccountPath = process.argv[2];

if (!serviceAccountPath) {
  console.error('❌ Please provide the path to your service account JSON file');
  console.log('\nUsage: node scripts/encode-firebase-key.js path/to/service-account.json');
  console.log('\nTo generate a service account key:');
  console.log('1. Go to Firebase Console → Project Settings → Service Accounts');
  console.log('2. Click "Generate new private key"');
  console.log('3. Save the JSON file to your computer');
  console.log('4. Run this script with the path to that file');
  process.exit(1);
}

// Check if file exists
if (!fs.existsSync(serviceAccountPath)) {
  console.error(`❌ File not found: ${serviceAccountPath}`);
  process.exit(1);
}

try {
  // Read the service account file
  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
  
  // Validate required fields
  const requiredFields = ['type', 'project_id', 'private_key_id', 'private_key', 'client_email', 'client_id'];
  const missingFields = requiredFields.filter(field => !serviceAccount[field]);
  
  if (missingFields.length > 0) {
    console.error(`❌ Invalid service account file. Missing fields: ${missingFields.join(', ')}`);
    process.exit(1);
  }
  
  // Encode as base64
  const jsonString = JSON.stringify(serviceAccount);
  const base64Encoded = Buffer.from(jsonString).toString('base64');
  
  console.log('✅ Service account validated and encoded successfully!');
  console.log(`\n📝 File: ${serviceAccountPath}`);
  console.log(`📦 Project ID: ${serviceAccount.project_id}`);
  console.log(`👤 Client Email: ${serviceAccount.client_email}`);
  console.log(`🔑 Key ID: ${serviceAccount.private_key_id.substring(0, 8)}...`);
  console.log(`📏 Encoded Length: ${base64Encoded.length} characters`);
  
  console.log('\n📋 Add this line to your .env.local file:\n');
  console.log(`FIREBASE_SERVICE_ACCOUNT_BASE64=${base64Encoded}`);
  
  console.log('\n💾 Or save it directly to .env.local:');
  console.log(`echo FIREBASE_SERVICE_ACCOUNT_BASE64=${base64Encoded} > .env.local`);
  
  console.log('\n⚠️  IMPORTANT: Never commit this key to version control!');
  console.log('   The .env.local file is already in .gitignore');
  
} catch (error) {
  console.error('❌ Error processing service account:', error.message);
  process.exit(1);
}