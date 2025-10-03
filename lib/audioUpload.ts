import { ref, uploadBytes } from 'firebase/storage';
import { storage, auth } from './firebase';

export async function uploadAudioFile(audioBlob: Blob, sessionId: string): Promise<string> {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Create a reference to the audio file in Firebase Storage
    const fileName = `audio/${user.uid}/${sessionId}/${Date.now()}.webm`;
    const audioRef = ref(storage, fileName);

    // Upload the audio blob
    await uploadBytes(audioRef, audioBlob);

    // Return the storage path instead of the download URL
    return fileName;
  } catch (error) {
    console.error('Error uploading audio file:', error);
    throw error;
  }
}