import { App, cert, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'

let app: App | undefined

function initFromBase64() {
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64
  if (!b64) return false
  try {
    const svc = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'))
    app = initializeApp({
      credential: cert(svc),
      ...(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
        ? { storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET }
        : {}),
    })
    return true
  } catch (e) {
    console.error('Failed to init admin from FIREBASE_SERVICE_ACCOUNT_BASE64', e)
    return false
  }
}

if (!getApps().length) {
  // Prefer base64 service account if provided
  const ok = initFromBase64()
  if (!ok) {
    const projectId = process.env.FIREBASE_PROJECT_ID
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
    let privateKey = process.env.FIREBASE_PRIVATE_KEY
    if (privateKey && privateKey.includes('\\n')) {
      privateKey = privateKey.replace(/\\n/g, '\n')
    }

    if (projectId && clientEmail && privateKey) {
      app = initializeApp({
        credential: cert({ projectId, clientEmail, privateKey: privateKey as string }),
        ...(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
          ? { storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET }
          : {}),
      })
    } else {
      // Fallback to application default credentials (e.g., GOOGLE_APPLICATION_CREDENTIALS)
      app = initializeApp()
    }
  }
}

export const adminAuth = getAuth()
export const adminDb = getFirestore()
export const adminStorage = getStorage()
export const adminBucket = adminStorage.bucket(
  process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || undefined
)
