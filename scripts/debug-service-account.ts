import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
if (serviceAccountBase64) {
  try {
    const serviceAccountJson = Buffer.from(serviceAccountBase64, 'base64').toString('utf8');
    console.log('Decoded service account JSON:');
    console.log('============================');
    
    // Show the area around position 578 where the error occurs
    const startPos = Math.max(0, 578 - 50);
    const endPos = Math.min(serviceAccountJson.length, 578 + 50);
    console.log(`Characters around position 578:`);
    console.log(`...${serviceAccountJson.substring(startPos, endPos)}...`);
    
    // Show character codes around the problematic position
    console.log('\nCharacter codes around position 578:');
    for (let i = 578 - 10; i <= 578 + 10; i++) {
      if (i >= 0 && i < serviceAccountJson.length) {
        const char = serviceAccountJson[i];
        console.log(`Position ${i}: '${char}' (code: ${char.charCodeAt(0)})`);
      }
    }
    
    // Try to identify problematic characters
    console.log('\nLooking for control characters:');
    for (let i = 0; i < Math.min(serviceAccountJson.length, 600); i++) {
      const charCode = serviceAccountJson.charCodeAt(i);
      if (charCode < 32 && charCode !== 9 && charCode !== 10 && charCode !== 13) {
        console.log(`Control character at position ${i}: code ${charCode}`);
      }
    }
    
  } catch (error: any) {
    console.error('Error:', error.message);
  }
}