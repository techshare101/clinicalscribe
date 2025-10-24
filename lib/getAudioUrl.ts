import { auth } from './firebase';

/**
 * Generates a signed URL for audio playback from a storage path
 * 
 * @param storagePath - Firebase Storage path to the audio file (e.g., 'audio/user123/session456/123456789.webm')
 * @returns Promise resolving to a signed URL with temporary access
 * 
 * This function is used in the session recordings flow to convert storage paths
 * to playable audio URLs. It's part of the multi-session recording feature that
 * includes auto-combine when sessions exceed 120 minutes.
 */

export async function getAudioUrl(storagePath: string): Promise<string> {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Get the user's ID token
    const idToken = await user.getIdToken();

    // Call the API route to get a signed URL
    const response = await fetch('/api/storage/audio-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
      body: JSON.stringify({
        path: storagePath
      })
    });

    if (!response.ok) {
      throw new Error('Failed to get signed URL');
    }

    const { url } = await response.json();
    return url;
  } catch (error) {
    console.error('Error getting audio URL:', error);
    throw error;
  }
}
