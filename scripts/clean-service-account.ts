import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
dotenv.config({ path: '.env.local' });

const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
if (serviceAccountBase64) {
  try {
    const serviceAccountJson = Buffer.from(serviceAccountBase64, 'base64').toString('utf8');
    console.log('Original service account JSON length:', serviceAccountJson.length);
    
    // Parse the JSON
    const serviceAccount = JSON.parse(serviceAccountJson);
    
    // Clean the private key by escaping any control characters
    if (serviceAccount.private_key) {
      // Replace any control characters (except for allowed ones like \n, \r, \t)
      serviceAccount.private_key = serviceAccount.private_key.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
      console.log('Cleaned private key');
    }
    
    // Stringify the cleaned JSON
    const cleanedJson = JSON.stringify(serviceAccount, null, 2);
    console.log('Cleaned JSON length:', cleanedJson.length);
    
    // Encode back to base64
    const cleanedBase64 = Buffer.from(cleanedJson, 'utf8').toString('base64');
    
    // Read the .env.local file
    const envPath = path.join(process.cwd(), '.env.local');
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Replace the old service account with the cleaned one
    const oldLine = `FIREBASE_SERVICE_ACCOUNT_BASE64=${serviceAccountBase64}`;
    const newLine = `FIREBASE_SERVICE_ACCOUNT_BASE64=${cleanedBase64}`;
    envContent = envContent.replace(oldLine, newLine);
    
    // Write back to the file
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Successfully cleaned and updated the service account in .env.local');
    console.log('New base64 length:', cleanedBase64.length);
    
  } catch (error: any) {
    console.error('Error cleaning service account:', error.message);
  }
} else {
  console.log('No service account found in environment variables');
}