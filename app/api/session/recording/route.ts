import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { adminAuth } from '@/lib/firebaseAdmin';

export const runtime = "nodejs"; // ✅ force Node.js runtime

interface Recording {
  id: string;
  transcript: string;
  timestamp: any;
  audioUrl?: string; // This will now be the storage path
  duration?: number; // Recording duration in seconds
}

interface SessionRecordingRequest {
  sessionId: string;
  recording: Recording;
  isActive?: boolean; // Add isActive flag
}

export async function POST(req: Request) {
  try {
    // In a real implementation, you would verify the user's authentication token here
    // For now, we'll proceed with the session recording logic
    
    const body: SessionRecordingRequest = await req.json();
    const { sessionId, recording, isActive } = body;

    if (!sessionId || !recording) {
      return NextResponse.json({ error: 'Session ID and recording data are required' }, { status: 400 });
    }
    
    // Set default duration if not provided
    if (!recording.duration) {
      recording.duration = 0;
    }

    // 1. Get the session document
    const sessionRef = adminDb.collection('patientSessions').doc(sessionId);
    const sessionDoc = await sessionRef.get();

    if (!sessionDoc.exists) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // 2. Add the new recording to the recordings array
    const sessionData = sessionDoc.data();
    const recordings: Recording[] = sessionData?.recordings || [];
    
    // Calculate current total duration
    const currentTotalDuration = sessionData?.totalDuration || 0;
    const newTotalDuration = currentTotalDuration + (recording.duration || 0);
    
    // Add the new recording
    recordings.push(recording);
    
    // 3. Prepare update data
    const updateData: any = {
      recordings: recordings,
      totalDuration: newTotalDuration,
      updatedAt: new Date()
    };
    
    // Update isActive if provided
    if (typeof isActive === 'boolean') {
      updateData.isActive = isActive;
    }
    
    // 4. Update the session document with the new recordings array and other data
    await sessionRef.update(updateData);
    
    // 5. Check if session crossed 120 min threshold (7200 seconds) and doesn't have a final SOAP note
    const AUTO_COMBINE_THRESHOLD = 7200; // 120 minutes in seconds
    let autoCombineTriggered = false;
    let autoCombineResult = null;
    
    if (newTotalDuration >= AUTO_COMBINE_THRESHOLD && !sessionData?.finalSoap) {
      try {
        // Auto-trigger SOAP combine
        console.log(`Session ${sessionId} exceeded 120 minutes, auto-triggering SOAP combine`);
        autoCombineTriggered = true;
        
        // Call the combine API
        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/soap/combine`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            sessionId,
            isAutoCombine: true // Flag to indicate this is an auto-combine request
          }),
        });
        
        if (!response.ok) {
          console.error('Auto-combine failed:', await response.text());
        } else {
          autoCombineResult = await response.json();
          
          // Mark the session as auto-combined
          await sessionRef.update({
            autoCombined: true,
            autoCombinedAt: new Date().toISOString()
          });
        }
      } catch (combineError) {
        console.error('Error during auto-combine:', combineError);
        // Don't fail the main request if combine fails
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Recording saved successfully',
      autoCombineTriggered,
      autoCombineResult,
      totalDuration: newTotalDuration
    });
  } catch (error: any) {
    console.error('Session recording save error:', error);
    return NextResponse.json({ 
      error: 'Failed to save recording to session',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}