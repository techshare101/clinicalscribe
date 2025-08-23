export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebaseAdmin'

export async function POST(req: Request) {
  try {
    console.log('🔄 Session API: Request received');
    
    const { idToken } = await req.json()
    if (!idToken) {
      console.error('❌ Session API: Missing idToken in request');
      return NextResponse.json({ error: 'Missing idToken' }, { status: 400 })
    }
    
    console.log('🔐 Session API: Verifying ID token...');
    console.log('Token length:', idToken?.length || 0);
    
    // Verify the token first to ensure it's valid
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken);
      console.log('✅ Session API: Token verified for user:', decodedToken.uid);
    } catch (verifyError: any) {
      console.error('❌ Session API: Token verification failed:', {
        error: verifyError.message,
        code: verifyError.code,
        tokenLength: idToken?.length || 0
      });
      return NextResponse.json({ 
        error: `Token verification failed: ${verifyError.message}` 
      }, { status: 401 });
    }
    
    // Create a Firebase session cookie (up to 14 days). We'll use 7 days.
    console.log('🍪 Session API: Creating session cookie...');
    const expiresIn = 7 * 24 * 60 * 60 * 1000 // 7 days in ms
    
    let sessionCookie;
    try {
      sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });
      console.log('✅ Session API: Session cookie created successfully');
      console.log('Cookie length:', sessionCookie?.length || 0);
    } catch (cookieError: any) {
      console.error('❌ Session API: Session cookie creation failed:', {
        error: cookieError.message,
        code: cookieError.code,
        userId: decodedToken?.uid
      });
      return NextResponse.json({ 
        error: `Session cookie creation failed: ${cookieError.message}` 
      }, { status: 500 });
    }

    const res = NextResponse.json({ ok: true, userId: decodedToken.uid })
    res.cookies.set('__session', sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: Math.floor(expiresIn / 1000),
    })
    
    console.log('🎉 Session API: Session created successfully for user:', decodedToken.uid);
    return res
  } catch (e: any) {
    console.error('❌ Session API: Unexpected error:', {
      message: e?.message,
      stack: e?.stack,
      name: e?.name
    });
    return NextResponse.json({ 
      error: e?.message || 'Failed to create session' 
    }, { status: 500 })
  }
}
export async function GET() {
  return NextResponse.json({ ok: true })
}


export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set('__session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
  return res
}
