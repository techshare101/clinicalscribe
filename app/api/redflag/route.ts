import { NextResponse } from 'next/server'
import { requireApiUser } from '@/lib/apiAuth'
import OpenAI from 'openai'

const RPM = Number(process.env.REDFLAG_RPM || 5)
const WINDOW_SEC = Number(process.env.REDFLAG_WINDOW_SEC || 60)
type Bucket = { ts: number[] }
const buckets = new Map<string, Bucket>()

function getKey(req: Request) {
  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0]?.trim() || 'unknown'
  const hint = req.headers.get('x-user-id') || ''
  return hint ? `${ip}:${hint}` : ip
}

function isRateLimited(req: Request) {
  const key = getKey(req)
  const now = Date.now()
  const windowMs = WINDOW_SEC * 1000
  let b = buckets.get(key)
  if (!b) {
    b = { ts: [] }
    buckets.set(key, b)
  }
  b.ts = b.ts.filter(t => now - t < windowMs)
  if (b.ts.length >= RPM) return true
  b.ts.push(now)
  return false
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(req: Request) {
  const auth = await requireApiUser(req)
  if (auth.response) return auth.response
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key is missing or not configured on the server. Please check your environment variables.' },
        { status: 503 }
      )
    }

    if (isRateLimited(req)) {
      return NextResponse.json(
        { error: 'Rate limit reached (5 requests/minute). Please wait a moment and try again.' },
        { status: 429 }
      )
    }

    const { soapNote } = await req.json()
    if (!soapNote || (!soapNote.subjective && !soapNote.objective && !soapNote.assessment && !soapNote.plan)) {
      return NextResponse.json(
        { error: 'Please enter at least one SOAP section before running analysis.' },
        { status: 400 }
      )
    }

    const prompt = `
      You are a clinical decision support system. Analyze the following SOAP note for potential red flags that might require referral or special attention.
      
      SOAP Note:
      Subjective: ${soapNote.subjective || 'N/A'}
      Objective: ${soapNote.objective || 'N/A'}
      Assessment: ${soapNote.assessment || 'N/A'}
      Plan: ${soapNote.plan || 'N/A'}
      Pain Level: ${soapNote.painLevel ? `${soapNote.painLevel}/10` : 'Not recorded'}
      
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
  } catch (error: any) {
    console.error('Red flag analysis error:', error)
    const message = error?.message || 'Failed to analyze SOAP note'
    return NextResponse.json(
      { error: message },
      { status: error?.status || 500 }
    )
  }
}

export const runtime = 'nodejs'
