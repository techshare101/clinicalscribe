import { NextResponse } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebase-admin'

export const runtime = 'nodejs'

export async function GET() {
  try {
    console.log('🏥 Health Check: Starting system health verification...');
    
    const health = {
      timestamp: new Date().toISOString(),
      firebase: {
        admin: false,
        auth: false,
        db: false
      },
      environment: {
        node_env: process.env.NODE_ENV,
        has_stripe_key: !!process.env.STRIPE_SECRET_KEY,
        has_firebase_service_account: !!process.env.FIREBASE_SERVICE_ACCOUNT_BASE64,
        has_app_url: !!process.env.NEXT_PUBLIC_APP_URL
      }
    };
    
    // Test Firebase Admin initialization
    try {
      if (adminAuth && adminDb) {
        health.firebase.admin = true;
        console.log('✅ Health Check: Firebase Admin SDK initialized');
        
        // Test auth service
        try {
          // Just test if the service is available (don't actually call it)
          if (typeof adminAuth.verifyIdToken === 'function') {
            health.firebase.auth = true;
            console.log('✅ Health Check: Firebase Auth service available');
          }
        } catch (authErr) {
          console.warn('⚠️ Health Check: Firebase Auth service issue:', authErr);
        }
        
        // Test Firestore service
        try {
          if (typeof adminDb.collection === 'function') {
            health.firebase.db = true;
            console.log('✅ Health Check: Firestore service available');
          }
        } catch (dbErr) {
          console.warn('⚠️ Health Check: Firestore service issue:', dbErr);
        }
      }
    } catch (firebaseErr) {
      console.error('❌ Health Check: Firebase Admin initialization failed:', firebaseErr);
    }
    
    const isHealthy = health.firebase.admin && health.firebase.auth && health.firebase.db;
    console.log(`🏥 Health Check: System ${isHealthy ? 'HEALTHY' : 'UNHEALTHY'}`);
    
    return NextResponse.json({
      status: isHealthy ? 'healthy' : 'unhealthy',
      ...health
    });
    
  } catch (error: any) {
    console.error('❌ Health Check: Unexpected error:', error);
    return NextResponse.json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
