import { NextResponse } from 'next/server';

export const runtime = 'edge';

interface SOAPRequest {
  transcript: string;
  patientName?: string;
  encounterType?: string;
  language?: string;
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
    const { transcript, patientName, encounterType } = body;

    if (!transcript || transcript.trim().length === 0) {
      return NextResponse.json({ error: 'Transcript is required' }, { status: 400 });
    }

    console.log('[SOAP API] Received transcript length:', transcript.trim().length, 'chars');

    // Construct the clinical prompt for GPT-4
    const clinicalPrompt = `You are an experienced clinical documentation specialist. Convert the following medical transcript into a structured SOAP note format. Be precise, professional, and clinically accurate.

INSTRUCTIONS:
- Extract ALL available clinical information from the transcript
- Use proper medical terminology
- Be concise but comprehensive
- If the transcript discusses a patient case (even as a teaching example or presentation), treat it as the patient encounter and extract all relevant details
- For any section where information is limited, summarize what IS available rather than saying "not provided"
- Only write "Information not provided in the transcript" if there is truly zero relevant content for that section
- Maintain patient confidentiality standards

TRANSCRIPT:
"${transcript}"

${patientName ? `PATIENT: ${patientName}` : ''}
${encounterType ? `ENCOUNTER TYPE: ${encounterType}` : ''}

Please structure your response as a JSON object with the following format:
{
  "subjective": "What the patient reports (symptoms, concerns, history)",
  "objective": "Observable findings (vitals, physical exam, test results)",
  "assessment": "Clinical interpretation and diagnosis",
  "plan": "Treatment plan, medications, follow-up instructions"
}

Focus on clinical accuracy and professional medical documentation standards.`;

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a clinical documentation specialist. Generate accurate, professional SOAP notes from medical transcripts. Extract all available clinical information. Always respond with valid JSON format.'
          },
          {
            role: 'user',
            content: clinicalPrompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000,
        response_format: { type: "json_object" }
      }),
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json();
      console.error('OpenAI API error:', errorData);
      return NextResponse.json({ error: 'Failed to generate SOAP note' }, { status: openaiResponse.status });
    }

    const openaiData = await openaiResponse.json();
    const soapContent = JSON.parse(openaiData.choices[0].message.content);

    // Validate the response structure
    const requiredFields = ['subjective', 'objective', 'assessment', 'plan'];
    for (const field of requiredFields) {
      if (!soapContent[field]) {
        soapContent[field] = `[${field.toUpperCase()}: Information not available in transcript]`;
      }
    }

    const response: SOAPResponse = {
      ...soapContent,
      patientName,
      encounterType,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('SOAP generation error:', error);
    return NextResponse.json({ 
      error: 'Failed to generate SOAP note',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
