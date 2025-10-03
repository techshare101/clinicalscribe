import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebaseAdmin';
import { getCombinedTranscript } from '@/lib/transcriptChunks';

function getBearerToken(req: Request) {
  const authHeader = req.headers.get('authorization') || '';
  const m = authHeader.match(/^Bearer\s+(.+)$/i);
  return m?.[1];
}

export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    // Get the Bearer token from the Authorization header
    const token = getBearerToken(req);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify the token and get the user ID
    const decodedToken = await adminAuth.verifyIdToken(token);
    const uid = decodedToken.uid;

    // Get the session ID from the query parameters
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    // Get the combined transcript
    const result = await getCombinedTranscript(uid, sessionId);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error retrieving transcript chunks:', error);
    return NextResponse.json({ error: error.message || 'Failed to retrieve transcript chunks' }, { status: 500 });
  }
}