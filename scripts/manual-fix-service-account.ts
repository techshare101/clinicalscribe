import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
dotenv.config({ path: '.env.local' });

const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
if (serviceAccountBase64) {
  try {
    const serviceAccountJson = Buffer.from(serviceAccountBase64, 'base64').toString('utf8');
    console.log('Original service account JSON length:', serviceAccountJson.length);
    
    // Look for the problematic character at position 578
    const problemChar = serviceAccountJson.charAt(578);
    const charCode = problemChar.charCodeAt(0);
    console.log(`Problematic character at position 578: '${problemChar}' (code: ${charCode})`);
    
    // Show more context around the problem
    const contextStart = Math.max(0, 578 - 20);
    const contextEnd = Math.min(serviceAccountJson.length, 578 + 20);
    console.log('Context around problem:');
    console.log(JSON.stringify(serviceAccountJson.substring(contextStart, contextEnd)));
    
    // Since we can't parse the JSON due to the invalid character, let's try a different approach
    // We'll look for the private_key field and try to fix it directly in the string
    
    // Find the private_key field
    const privateKeyMatch = serviceAccountJson.match(/"private_key"\s*:\s*"([^"]*)"/);
    if (privateKeyMatch) {
      const privateKey = privateKeyMatch[1];
      console.log('Found private key, length:', privateKey.length);
      
      // Check if there are control characters in the private key
      const controlCharMatch = privateKey.match(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/);
      if (controlCharMatch) {
        console.log('Found control character in private key at position:', privateKey.indexOf(controlCharMatch[0]));
        console.log('Character code:', controlCharMatch[0].charCodeAt(0));
      }
      
      // Try to clean the private key by removing control characters
      const cleanedPrivateKey = privateKey.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
      console.log('Cleaned private key length:', cleanedPrivateKey.length);
      
      // Replace the private key in the original JSON string
      const cleanedJson = serviceAccountJson.replace(
        /"private_key"\s*:\s*"([^"]*)"/,
        `"private_key": "${cleanedPrivateKey}"`
      );
      
      // Try to parse the cleaned JSON
      try {
        const parsed = JSON.parse(cleanedJson);
        console.log('✅ Successfully parsed cleaned JSON');
        
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
      } catch (parseError: any) {
        console.error('Error parsing cleaned JSON:', parseError.message);
      }
    } else {
      console.log('Could not find private_key in JSON');
    }
    
  } catch (error: any) {
    console.error('Error processing service account:', error.message);
  }
} else {
  console.log('No service account found in environment variables');
}