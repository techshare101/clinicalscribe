// scripts/set-admin.js
const admin = require('firebase-admin')

const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64
if (!b64) {
  console.error('FIREBASE_SERVICE_ACCOUNT_BASE64 is required')
  process.exit(1)
}

const svc = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'))
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(svc) })

async function main() {
  const uid = process.argv[2]
  if (!uid) throw new Error('Pass UID: node scripts/set-admin.js <UID>')
  await admin.auth().setCustomUserClaims(uid, { role: 'admin' })
  console.log('✅ set admin for', uid)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
