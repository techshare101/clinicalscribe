import { adminDb } from '../lib/firebaseAdmin';

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
  } catch (error: any) {
    console.error('❌ Firebase Admin test failed:', error.message);
    console.error('Error stack:', error.stack);
  }
}

testFirebaseAdmin();