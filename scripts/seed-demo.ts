// /scripts/seed-demo.ts
// Extend demo seed to create sample patients and sessions using Admin SDK
import admin from 'firebase-admin'

const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64
if (!b64) {
  console.error('FIREBASE_SERVICE_ACCOUNT_BASE64 is required')
  process.exit(1)
}

const svc = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'))
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(svc) })
const db = admin.firestore()

const samples = [
  { lang: 'so', patient: { name: 'Ayaan Isse' }, specialty: 'ED', transcript: '... Somali text ...' },
  { lang: 'hmn', patient: { name: 'Toua Yang' }, specialty: 'ICU', transcript: '... Hmong text ...' },
  { lang: 'es', patient: { name: 'María López' }, specialty: 'Oncology', transcript: '... Spanish text ...' },
]

async function run(ownerId: string) {
  if (!ownerId) throw new Error('Pass ownerId (UID) as arg')
  const now = admin.firestore.FieldValue.serverTimestamp()

  // Ensure profile exists
  await db.collection('profiles').doc(ownerId).set(
    {
      email: 'demo@clinicalscribe.ai',
      fullName: 'Demo Nurse',
      betaActive: true,
      role: 'nurse',
      createdAt: now,
    },
    { merge: true }
  )

  for (const s of samples) {
    const patientRef = await db.collection('patients').add({
      ownerId,
      name: s.patient.name,
      name_lower: s.patient.name.toLowerCase(),
      lang: s.lang,
      createdAt: now,
    })

    await db.collection('sessions').add({
      ownerId,
      patientId: patientRef.id,
      specialty: s.specialty,
      lang: s.lang,
      transcript: s.transcript,
      offlineWhisper: false,
      createdAt: now,
    })
  }
  console.log('✅ seeded demo sessions')
}

if (require.main === module) {
  run(process.argv[2]!).catch((e) => {
    console.error(e)
    process.exit(1)
  })
}

export {}
