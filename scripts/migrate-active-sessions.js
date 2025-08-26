// Migration script to add isActive field to existing patient sessions
// Run with: node scripts/migrate-active-sessions.js

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where, writeBatch, doc } from 'firebase/firestore';
import { config } from 'dotenv';

// Load environment variables
config();

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function migrateSessions() {
  try {
    console.log('Starting migration to add isActive field to patient sessions...');
    
    // Query for all patient sessions that don't have isActive field
    const sessionsQuery = query(
      collection(db, 'patientSessions'),
      where('isActive', '==', null)
    );
    
    const snapshot = await getDocs(sessionsQuery);
    console.log(`Found ${snapshot.size} sessions to migrate`);
    
    if (snapshot.empty) {
      console.log('No sessions need migration');
      return;
    }
    
    // Process in batches of 500 to avoid Firestore limits
    const batchSize = 500;
    let batchCount = 0;
    
    for (let i = 0; i < snapshot.docs.length; i += batchSize) {
      const batch = writeBatch(db);
      const batchDocs = snapshot.docs.slice(i, i + batchSize);
      
      batchDocs.forEach((document) => {
        const sessionRef = doc(db, 'patientSessions', document.id);
        batch.update(sessionRef, { isActive: false });
      });
      
      await batch.commit();
      batchCount++;
      console.log(`Committed batch ${batchCount} (${batchDocs.length} sessions)`);
    }
    
    console.log(`Migration completed successfully! Updated ${snapshot.size} sessions in ${batchCount} batches.`);
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

// Run the migration
migrateSessions().then(() => {
  console.log('Migration script finished');
  process.exit(0);
}).catch((error) => {
  console.error('Migration script failed:', error);
  process.exit(1);
});