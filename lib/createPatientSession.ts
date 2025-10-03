import { db, auth } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Creates a new patient session document in Firestore
 * @param patientName - Optional name of the patient
 * @param encounterType - Optional type of encounter
 * @returns The ID of the newly created session
 */
export async function createPatientSession(
  patientName?: string,
  encounterType?: string
): Promise<string> {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Create a new patient session document
    const sessionData = {
      patientId: user.uid,
      patientName: patientName || 'Unknown Patient',
      encounterType: encounterType || 'General Consultation',
      recordings: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isActive: false, // Will be set to true when recording starts
      totalDuration: 0
    };

    const docRef = await addDoc(collection(db, 'patientSessions'), sessionData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating patient session:', error);
    throw new Error('Failed to create patient session');
  }
}