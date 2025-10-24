import { adminDb } from '@/lib/firebase-admin';

/**
 * Retrieves and combines transcript chunks from Firestore for a given session
 * 
 * @param uid - User ID
 * @param sessionId - Session ID
 * @returns Combined transcript with chunks ordered by index
 */
export async function getCombinedTranscript(uid: string, sessionId: string): Promise<{
  transcript: string;
  rawTranscript: string;
  chunks: Array<{
    index: number;
    transcript: string;
    rawTranscript: string;
    patientLang?: string;
    docLang?: string;
    createdAt: Date;
  }>;
}> {
  try {
    // Reference to the chunks subcollection
    const chunksRef = adminDb.collection('transcriptions').doc(uid).collection(sessionId);
    
    // Query for completed chunks ordered by index
    const query = chunksRef
      .where('status', '==', 'completed')
      .orderBy('index', 'asc');
    
    const querySnapshot = await query.get();
    
    const chunks: Array<{
      index: number;
      transcript: string;
      rawTranscript: string;
      patientLang?: string;
      docLang?: string;
      createdAt: Date;
    }> = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      chunks.push({
        index: data.index,
        transcript: data.transcript,
        rawTranscript: data.rawTranscript,
        patientLang: data.patientLang,
        docLang: data.docLang,
        createdAt: data.createdAt.toDate()
      });
    });
    
    // Combine transcripts in order
    const combinedTranscript = chunks.map(chunk => chunk.transcript).join(' ');
    const combinedRawTranscript = chunks.map(chunk => chunk.rawTranscript).join(' ');
    
    return {
      transcript: combinedTranscript,
      rawTranscript: combinedRawTranscript,
      chunks
    };
  } catch (error) {
    console.error('Error retrieving combined transcript:', error);
    throw error;
  }
}

/**
 * Retrieves individual transcript chunks from Firestore for a given session
 * 
 * @param uid - User ID
 * @param sessionId - Session ID
 * @returns Array of transcript chunks ordered by index
 */
export async function getTranscriptChunks(uid: string, sessionId: string): Promise<Array<{
  index: number;
  transcript: string;
  rawTranscript: string;
  patientLang?: string;
  docLang?: string;
  createdAt: Date;
  status: string;
}>> {
  try {
    // Reference to the chunks subcollection
    const chunksRef = adminDb.collection('transcriptions').doc(uid).collection(sessionId);
    
    // Query for all chunks ordered by index
    const query = chunksRef.orderBy('index', 'asc');
    
    const querySnapshot = await query.get();
    
    const chunks: Array<{
      index: number;
      transcript: string;
      rawTranscript: string;
      patientLang?: string;
      docLang?: string;
      createdAt: Date;
      status: string;
    }> = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      chunks.push({
        index: data.index,
        transcript: data.transcript || '',
        rawTranscript: data.rawTranscript || '',
        patientLang: data.patientLang,
        docLang: data.docLang,
        createdAt: data.createdAt.toDate(),
        status: data.status || 'unknown'
      });
    });
    
    return chunks;
  } catch (error) {
    console.error('Error retrieving transcript chunks:', error);
    throw error;
  }
}
