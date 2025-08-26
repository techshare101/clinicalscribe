import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export const runtime = 'edge';

interface Recording {
  id: string;
  transcript: string;
  timestamp: any;
}

interface SOAPRequest {
  sessionId: string;
  isAutoCombine?: boolean; // Flag to indicate if this is an auto-combine request
}

interface SOAPResponse {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  patientName?: string;
  encounterType?: string;
  timestamp: string;
}

export async function POST(req: Request) {
  try {
    const body: SOAPRequest = await req.json();
    const { sessionId, isAutoCombine = false } = body;

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    // 1. Get recordings for this session from Firestore
    const sessionRef = adminDb.collection('patientSessions').doc(sessionId);
    const sessionDoc = await sessionRef.get();

    if (!sessionDoc.exists) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const sessionData = sessionDoc.data();
    const recordings: Recording[] = sessionData?.recordings || [];

    if (!recordings.length) {
      return NextResponse.json({ error: 'No recordings found in this session' }, { status: 400 });
    }

    // 2. Merge all transcripts into one text block
    const allNotes = recordings.map(r => r.transcript).join('\n\n--- NEW SEGMENT ---\n\n');

    // 3. Send to AI → structured SOAP
    const prompt = `You are a medical scribe assistant. 
Here are multiple transcripts from the same patient encounter, separated by "--- NEW SEGMENT ---":

${allNotes}

Please merge them into ONE structured SOAP note with clear sections:

Subjective:
Objective:
Assessment:
Plan:

Keep accuracy. Do not invent details. Maintain chronological order where relevant. If there are conflicting details, note them.`;

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Using gpt-4o-mini for cost efficiency
        messages: [
          {
            role: 'system',
            content: 'You are a clinical documentation specialist. Generate accurate, professional SOAP notes from medical transcripts. Always respond with valid JSON format.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3, // Lower temperature for more consistent clinical output
        max_tokens: 2000,
        response_format: { type: "json_object" }
      }),
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json();
      console.error('OpenAI API error:', errorData);
      return NextResponse.json({ error: 'Failed to generate combined SOAP note' }, { status: openaiResponse.status });
    }

    const openaiData = await openaiResponse.json();
    let soapContent;
    
    try {
      soapContent = JSON.parse(openaiData.choices[0].message.content);
    } catch (parseError) {
      // If JSON parsing fails, try to extract content directly
      soapContent = {
        subjective: '[Error parsing AI response]',
        objective: '[Error parsing AI response]',
        assessment: '[Error parsing AI response]',
        plan: '[Error parsing AI response]'
      };
      console.error('Error parsing AI response:', parseError);
    }

    // Validate the response structure
    const requiredFields = ['subjective', 'objective', 'assessment', 'plan'];
    for (const field of requiredFields) {
      if (!soapContent[field]) {
        soapContent[field] = `[${field.toUpperCase()}: Information not available in transcript]`;
      }
    }

    const response: SOAPResponse = {
      ...soapContent,
      patientName: sessionData?.patientName,
      encounterType: sessionData?.encounterType,
      timestamp: new Date().toISOString(),
    };

    // 4. Save final SOAP back to session (non-breaking: keep old fields too)
    await sessionRef.update({
      finalSoap: response,
      updatedAt: new Date(),
      ...(isAutoCombine ? {
        autoCombined: true,
        autoCombinedAt: new Date().toISOString()
      } : {})
    });

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Combine SOAP error:', error);
    return NextResponse.json({ 
      error: 'Failed to generate combined SOAP note',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}