import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebaseAdmin'

export const runtime = 'nodejs'

export async function GET() {
  try {
    console.log('📊 SMART Status: Checking connection...');
    
    // Check if adminDb is available
    if (!adminDb) {
      console.error('❌ SMART Status: adminDb not available');
      return NextResponse.json({ 
        connected: false, 
        message: 'Firebase Admin not configured' 
      });
    }
    
    const snap = await adminDb.collection('smart').doc('config').get()
    console.log('📊 SMART Status: Config document exists:', snap.exists);
    
    if (!snap.exists) {
      return NextResponse.json({ connected: false, message: 'No SMART config' })
    }
    
    const data = snap.data() as any
    const token = data?.access_token || data?.token
    console.log('📊 SMART Status: Token present:', !!token);
    
    if (!token) {
      return NextResponse.json({ connected: false, message: 'No token' })
    }
    
    // Optionally, we could attempt a lightweight FHIR ping here with the token.
    return NextResponse.json({ connected: true })
  } catch (err: any) {
    console.error('❌ SMART status error:', {
      message: err?.message,
      code: err?.code,
      stack: err?.stack
    });
    
    // Return 200 with error info instead of 500 to prevent client-side errors
    return NextResponse.json({ 
      connected: false, 
      error: err?.message || 'Internal error',
      type: 'firebase_error'
    });
  }
}
