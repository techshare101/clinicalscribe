export const runtime = 'nodejs'

import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  const cookieStore = await cookies()
  
  const smartCookies = [
    'smart_access_token',
    'smart_refresh_token', 
    'smart_fhir_base',
    'smart_patient',
    'smart_practitioner',
    'smart_encounter',
    'smart_fhir_user',
  ]

  const result: Record<string, string | null> = {}
  for (const name of smartCookies) {
    const val = cookieStore.get(name)?.value
    // Mask tokens for security, show first 12 chars only
    if (name.includes('token') && val) {
      result[name] = val.slice(0, 12) + '...[masked]'
    } else {
      result[name] = val || null
    }
  }

  return NextResponse.json({
    cookies: result,
    timestamp: new Date().toISOString(),
    hint: 'If smart_encounter is null, Epic did not return encounter context during login. Try: 1) Disconnect, 2) Reconnect, 3) During Epic login, select a patient WITH an active encounter.',
  })
}
