// Test script to verify Firestore permissions for patientSessions and soapNotes collections
import { adminDb } from '../lib/firebaseAdmin';

async function testPermissions() {
  try {
    console.log('🚀 Testing Firestore permissions...');
    
    // Test reading from patientSessions collection
    console.log('Checking patientSessions collection...');
    const sessionsSnapshot = await adminDb.collection('patientSessions').limit(1).get();
    console.log(`✅ Successfully accessed patientSessions collection. Found ${sessionsSnapshot.size} documents.`);
    
    // Test reading from soapNotes collection
    console.log('Checking soapNotes collection...');
    const soapNotesSnapshot = await adminDb.collection('soapNotes').limit(1).get();
    console.log(`✅ Successfully accessed soapNotes collection. Found ${soapNotesSnapshot.size} documents.`);
    
    console.log('🎉 All permissions tests passed!');
  } catch (error) {
    console.error('❌ Permission test failed:', error.message);
    console.error('This might indicate a Firestore rules configuration issue.');
  }
}

// Run the test
if (require.main === module) {
  testPermissions().then(() => {
    console.log('Test completed.');
  }).catch((error) => {
    console.error('Test failed with error:', error);
  });
}

export default testPermissions;