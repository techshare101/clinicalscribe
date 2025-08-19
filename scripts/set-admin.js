// scripts/set-admin.js
const admin = require('firebase-admin')

const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64
if (!b64) {
  console.error('FIREBASE_SERVICE_ACCOUNT_BASE64 is required')
  process.exit(1)
}

const svc = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'))
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(svc) })

async function resolveUser(arg) {
  const auth = admin.auth()
  try {
    // Try as UID
    return await auth.getUser(arg)
  } catch (_) {
    // Try as email
    return await auth.getUserByEmail(arg)
  }
}

async function main() {
  const arg = process.argv[2]
  if (!arg) throw new Error('Usage: node scripts/set-admin.js <UID_OR_EMAIL>')

  let user
  try {
    user = await resolveUser(arg)
  } catch (e) {
    console.error('❌ No user found for:', arg)
    throw e
  }

  const uid = user.uid

  // 1) Set custom claims (optional but useful for client-side)
  await admin.auth().setCustomUserClaims(uid, { role: 'admin' })

  // 2) Persist role in Firestore profile since rules read profiles/{uid}.role
  await admin.firestore().collection('profiles').doc(uid).set({ role: 'admin', uid }, { merge: true })

  console.log(`✅ set admin for ${uid}${user.email ? ` (${user.email})` : ''}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
