const fs = require('fs');
const path = require('path');

// Get the file path from command line arguments
const filePath = process.argv[2];

if (!filePath) {
  console.error('Please provide the path to your service account JSON file');
  console.log('Usage: node convert-service-account.cjs <path-to-service-account.json>');
  process.exit(1);
}

try {
  // Read the JSON file
  const serviceAccountJson = fs.readFileSync(filePath, 'utf8');
  
  // Convert to base64
  const base64 = Buffer.from(serviceAccountJson).toString('base64');
  
  console.log('Service Account JSON converted to base64:');
  console.log('========================================');
  console.log(base64);
  console.log('========================================');
  console.log(`Length: ${base64.length} characters`);
  
  // Also save to a file for easy copy
  const outputFilePath = path.join(path.dirname(filePath), 'service-account-base64.txt');
  fs.writeFileSync(outputFilePath, base64);
  console.log(`\nBase64 string also saved to: ${outputFilePath}`);
  
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}