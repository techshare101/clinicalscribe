const fs = require('fs');
const path = require('path');

// Get the service account file path from command line arguments
const serviceAccountPath = process.argv[2];

if (!serviceAccountPath) {
  console.error('Please provide the path to your service account JSON file');
  console.log('Usage: node encode-service-account.js path/to/service-account.json');
  process.exit(1);
}

// Check if file exists
if (!fs.existsSync(serviceAccountPath)) {
  console.error(`File not found: ${serviceAccountPath}`);
  process.exit(1);
}

try {
  // Read the service account file
  const serviceAccount = fs.readFileSync(serviceAccountPath, 'utf8');
  
  // Encode as base64
  const base64Encoded = Buffer.from(serviceAccount).toString('base64');
  
  console.log('✅ Service account encoded successfully!');
  console.log('\nAdd this line to your .env.local file:\n');
  console.log(`FIREBASE_SERVICE_ACCOUNT_BASE64=${base64Encoded}`);
  console.log('\nOr save it to a file:');
  console.log('echo "FIREBASE_SERVICE_ACCOUNT_BASE64=' + base64Encoded + '" > .env.local');
} catch (error) {
  console.error('Error encoding service account:', error.message);
  process.exit(1);
}