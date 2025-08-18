# ClinicalScribe — Firebase Cutover Pilot Loop

Editor Handoff (One section = one commit)

Follow these steps exactly. After each section, commit/push so we can test in parallel.

---

0) Environment Variables

Paste into .env.local and fill in your values.

```bash
# Firebase (Web)
NEXT_PUBLIC_FIREBASE_API_KEY=YOUR_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=YOUR_DOMAIN.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=YOUR_PROJECT_ID.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=YOUR_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID=YOUR_APP_ID
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXX

# Firebase (Admin)
FIREBASE_SERVICE_ACCOUNT_BASE64=<<base64_of_serviceAccount.json>>

# OpenAI
OPENAI_API_KEY=sk-...

# SMART on FHIR (Epic Sandbox)
NEXT_PUBLIC_SMART_CLIENT_ID=YOUR_CLIENT_ID
SMART_CLIENT_SECRET=YOUR_CLIENT_SECRET
SMART_SCOPES="launch/patient patient/*.write openid fhirUser offline_access"
```

To base64 encode service account (mac/linux):
```bash
cat serviceAccount.json | base64 -w0
```

---

1) Security Rules (Firestore + Storage)

Update rules, then deploy.

firestore.rules
```text
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isSignedIn() { return request.auth != null; }
    function isAdmin() { return isSignedIn() && request.auth.token.role == "admin"; }
    function isOwner(uid) { return isSignedIn() && request.auth.uid == uid; }

    match /profiles/{uid} {
      allow read, write: if isOwner(uid) || isAdmin();
    }

    match /recordings/{docId} {
      allow create: if isSignedIn();
      allow read, write: if isOwner(resource.data.ownerId) || isAdmin();
    }

    match /reports/{docId} {
      allow create: if isSignedIn();
      allow read, write: if isOwner(resource.data.ownerId) || isAdmin();
    }

    match /patients/{pid} {
      allow create: if isSignedIn();
      allow read, write: if isOwner(resource.data.ownerId) || isAdmin();
    }

    match /sessions/{sid} {
      allow create: if isSignedIn();
      allow read, write: if isOwner(resource.data.ownerId) || isAdmin();
    }

    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

storage.rules
```text
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {

    function isSignedIn() { return request.auth != null; }
    function isAdmin() { return isSignedIn() && request.auth.token.role == "admin"; }

    match /recordings/{uid}/{allPaths=**} {
      allow read, write: if isSignedIn() && (request.auth.uid == uid || isAdmin());
    }

    match /images/{uid}/{allPaths=**} {
      allow read, write: if isSignedIn() && (request.auth.uid == uid || isAdmin());
    }

    match /pdfs/{uid}/{allPaths=**} {
      allow read, write: if isSignedIn() && (request.auth.uid == uid || isAdmin());
    }

    match /{allPaths=**} { allow read, write: if false; }
  }
}
```

Deploy:
```bash
firebase deploy --only firestore:rules,storage:rules
```

---

2) Firebase Admin Bootstrap

lib/firebaseAdmin.ts
```ts
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
  const ok = initFromBase64()
  if (!ok) {
    const projectId = process.env.FIREBASE_PROJECT_ID
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
    let privateKey = process.env.FIREBASE_PRIVATE_KEY
    if (privateKey && privateKey.includes('\\n')) privateKey = privateKey.replace(/\\n/g, '\n')

    if (projectId && clientEmail && privateKey) {
      app = initializeApp({
        credential: cert({ projectId, clientEmail, privateKey: privateKey as string }),
        ...(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
          ? { storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET }
          : {}),
      })
    } else {
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
```

---

3) Signed URL Endpoint

Primary (already wired by DownloadPdfButton): app/api/storage/signed-url/route.ts

Alternate (optional): app/api/storage/sign-url/route.ts
```ts
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { adminBucket, adminAuth } from '@/lib/firebaseAdmin'

function ok<T>(data: T, init?: number | ResponseInit) {
  return NextResponse.json(data as any, init)
}

export async function POST(req: NextRequest) {
  try {
    const authz = req.headers.get('authorization') || ''
    const m = authz.match(/^Bearer\s+(.+)$/i)
    if (!m) return ok({ error: 'Unauthorized' }, { status: 401 })

    let uid = ''
    let role: string | undefined
    try {
      const decoded = await adminAuth.verifyIdToken(m[1])
      uid = decoded.uid
      role = (decoded as any).role || decoded?.firebase?.sign_in_attributes?.role
    } catch {
      return ok({ error: 'Invalid token' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const path: string | undefined = body?.path
    const expiresInSec: number = Math.min(Math.max(Number(body?.expiresInSec) || 300, 60), 3600)

    if (!path || typeof path !== 'string') {
      return ok({ error: 'Missing path' }, { status: 400 })
    }

    const segs = path.split('/')
    const top = segs[0]
    const ownerFromPath = segs[1]
    const isAdmin = role === 'admin'
    const allowedTop = ['recordings', 'images', 'pdfs']
    if (!allowedTop.includes(top) || (!isAdmin && ownerFromPath !== uid)) {
      return ok({ error: 'Forbidden path' }, { status: 403 })
    }

    const file = adminBucket.file(path)
    const [exists] = await file.exists()
    if (!exists) return ok({ error: 'Not found' }, { status: 404 })

    const expires = Date.now() + expiresInSec * 1000
    const [url] = await file.getSignedUrl({ action: 'read', expires })

    return ok({ url, expiresAt: new Date(expires).toISOString() })
  } catch (e: any) {
    return ok({ error: e?.message || 'Server error' }, { status: 500 })
  }
}
```

---

4) PDF Render Endpoint

app/api/pdf/render/route.ts
```ts
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import puppeteer from 'puppeteer-core'
import chromium from '@sparticuz/chromium'
import { adminBucket } from '@/lib/firebaseAdmin'

function ok<T>(data: T, init?: number | ResponseInit) {
  return NextResponse.json(data as any, init)
}

export async function POST(req: NextRequest) {
  try {
    const { html, ownerId } = await req.json()
    if (!ownerId || typeof ownerId !== 'string') {
      return ok({ error: 'ownerId required' }, { status: 400 })
    }
    const content = String(html || '')

    const executablePath = await chromium.executablePath
    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath,
      headless: chromium.headless,
    })

    const page = await browser.newPage()
    await page.setContent(
      `<!doctype html><html><head><meta charset="utf-8"/><style>
        .wm{position:fixed;top:40%;left:50%;transform:translate(-50%,-50%) rotate(-25deg);opacity:.12;font-size:64px;font-weight:700}
        body{font-family:system-ui,Segoe UI,Arial;margin:24px}
      </style></head><body>
      <div class="wm">ClinicalScribe Beta</div>
      ${content}
      </body></html>`,
      { waitUntil: 'networkidle0' }
    )

    const pdf = await page.pdf({ format: 'A4', printBackground: true })
    await browser.close()

    const name = `pdfs/${ownerId}/${Date.now()}.pdf`
    const file = adminBucket.file(name)
    await file.save(Buffer.from(pdf), {
      contentType: 'application/pdf',
      resumable: false,
      metadata: { cacheControl: 'private, max-age=0, no-transform' },
    })

    return ok({ path: name })
  } catch (e: any) {
    return ok({ error: e?.message || 'Render failed' }, { status: 500 })
  }
}
```

---

5) Admin + Seed Scripts

Set admin custom claim (JS to avoid TS type issues):

scripts/set-admin.js
```js
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
```

Seed demo data (Somali, Hmong, Spanish):

scripts/seed-demo.ts
```ts
// /scripts/seed-demo.ts
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
  // ts-node scripts/seed-demo.ts <UID>
  run(process.argv[2]!).catch((e) => {
    console.error(e)
    process.exit(1)
  })
}

export {}
```

Run:
```bash
# Set admin claim for yourself (once)
node scripts/set-admin.js <YOUR_UID>

# Seed sample patients/sessions
npx ts-node scripts/seed-demo.ts <YOUR_UID>
```

---

6) Smoke Test Checklist

1. Auth
- Sign in and confirm you see your dashboard.

2. Demo Data
- Verify “patients” and “sessions” exist for your UID in Firestore.

3. SOAP → PDF
- Generate a SOAP note (or use any HTML snippet).
- POST /api/pdf/render with { html, ownerId } from the app.
- Receive { path: "pdfs/<uid>/<timestamp>.pdf" }.
- Download via /api/storage/signed-url with your Firebase ID token.

4. SMART on FHIR
- Click Connect in navbar → /smart/launch (Epic sandbox).
- Complete auth, indicator shows “EHR Connected”.
- Post a DocumentReference via existing export flow.

5. Permissions
- Confirm non-owners cannot access another user’s Storage paths or Firestore docs.
- Confirm admin (with custom claim) can access for support use-cases.

---

7) Commit Sequence (one PR each)
- PR1: Security rules
- PR2: Admin bootstrap
- PR3: Storage signed URL
- PR4: PDF render
- PR5: Admin + Seed scripts
- PR6: Smoke test fixes (if any)

Done. Push after each section so QA can verify in parallel.
