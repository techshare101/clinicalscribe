import { initializeApp, getApps, cert, type App } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

function getServiceAccountFromEnv() {
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64
  if (!b64) throw new Error('FIREBASE_SERVICE_ACCOUNT_BASE64 is not set')
  const json = Buffer.from(b64, 'base64').toString('utf8')
  const creds = JSON.parse(json)
  return creds
}

let adminApp: App
if (!getApps().length) {
  const serviceAccount = getServiceAccountFromEnv()
  adminApp = initializeApp({
    credential: cert(serviceAccount as any),
  })
} else {
  adminApp = getApps()[0]!
}

const adminAuth = getAuth(adminApp)
const adminDb = getFirestore(adminApp)

export { adminApp, adminAuth, adminDb }
