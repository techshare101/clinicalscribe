import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(req: Request) {
  try {
    const { soapNote } = await req.json()

    // Construct the prompt for GPT-4o
    const prompt = `
      You are a clinical decision support system. Analyze the following SOAP note for potential red flags that might require referral or special attention.
      
      SOAP Note:
      Subjective: ${soapNote.subjective}
      Objective: ${soapNote.objective}
      Assessment: ${soapNote.assessment}
      Plan: ${soapNote.plan}
      Pain Level: ${soapNote.painLevel}/10
      
      Please analyze this note and respond with:
      1. A "flagged" boolean indicating if there are any concerning findings
      2. A "feedback" string explaining your reasoning (max 100 words)
      3. A "recommendation" string with specific suggestions if flagged
      
      Respond in JSON format only with no additional text.
    `

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a clinical decision support system that identifies potential red flags in medical documentation."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.1,
      response_format: { type: "json_object" }
    })

    const result = JSON.parse(completion.choices[0].message.content || "{}")
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Red flag analysis error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze SOAP note' },
      { status: 500 }
    )
  }
}

export const runtime = 'edge'