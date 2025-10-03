// Migration script to add totalDuration field to existing patient sessions
// Run this script to update all existing sessions with a calculated total duration
// based on their recordings

import { adminDb } from '../lib/firebaseAdmin';

async function migrateTotalDuration() {
  try {
    console.log('🚀 Starting migration of totalDuration field for patient sessions...');
    
    // Get all patient sessions
    const sessionsSnapshot = await adminDb.collection('patientSessions').get();
    
    if (sessionsSnapshot.empty) {
      console.log('No patient sessions found.');
      return;
    }
    
    let updatedCount = 0;
    let errorCount = 0;
    
    // Process each session
    for (const doc of sessionsSnapshot.docs) {
      try {
        const sessionData = doc.data();
        const recordings = sessionData.recordings || [];
        
        // Skip if totalDuration is already set
        if (sessionData.totalDuration !== undefined) {
          console.log(`Session ${doc.id} already has totalDuration field. Skipping.`);
          continue;
        }
        
        // Calculate total duration from recordings
        let totalDuration = 0;
        for (const recording of recordings) {
          // Use recording.duration if available, otherwise estimate 0
          totalDuration += recording.duration || 0;
        }
        
        // Update the session
        await doc.ref.update({ totalDuration });
        updatedCount++;
        
        console.log(`Updated session ${doc.id} with totalDuration ${totalDuration}s`);
      } catch (error) {
        console.error(`Error updating session ${doc.id}:`, error);
        errorCount++;
      }
    }
    
    console.log(`🎉 Migration completed. Updated ${updatedCount} sessions. Errors: ${errorCount}`);
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateTotalDuration()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Migration script error:', error);
      process.exit(1);
    });
}

export default migrateTotalDuration;