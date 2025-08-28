import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

console.log('Environment Variables Check:');
console.log('==========================');

// Check Firebase service account
const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
console.log('FIREBASE_SERVICE_ACCOUNT_BASE64:', serviceAccountBase64 ? 'SET' : 'NOT SET');
if (serviceAccountBase64) {
  console.log('Length:', serviceAccountBase64.length);
  try {
    // Try to decode and parse the JSON
    const serviceAccountJson = Buffer.from(serviceAccountBase64, 'base64').toString('utf8');
    console.log('Decoded successfully');
    
    // Try to parse as JSON
    const serviceAccount = JSON.parse(serviceAccountJson);
    console.log('Parsed successfully');
    console.log('Project ID:', serviceAccount.project_id);
    console.log('Client Email:', serviceAccount.client_email);
  } catch (error: any) {
    console.error('Error decoding/parsing service account:', error.message);
    console.error('Error at position:', error.message.match(/position (\d+)/)?.[1]);
  }
}

console.log('\nOther Firebase vars:');
console.log('FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID || 'NOT SET');
console.log('FIREBASE_CLIENT_EMAIL:', process.env.FIREBASE_CLIENT_EMAIL || 'NOT SET');
console.log('FIREBASE_PRIVATE_KEY exists:', !!process.env.FIREBASE_PRIVATE_KEY);