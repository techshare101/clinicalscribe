# 🔍 Verify Remote Rendering is Working

## ✅ Your Render Service is Live!

```
🎉 Service URL: https://clinicalscribe-pdf-service.onrender.com
🚀 Status: PDF service running on port 10000
✅ Health: Live and ready
```

---

## 🧪 Step-by-Step Verification

### 1️⃣ Test Render Service Directly

#### Health Check
Open in browser or run:
```bash
curl https://clinicalscribe-pdf-service.onrender.com
```

**Expected Response:**
```
✅ ClinicalScribe PDF Service Online
```

#### Test PDF Generation
```powershell
curl -X POST https://clinicalscribe-pdf-service.onrender.com/api/pdf/render `
  -H "Content-Type: application/json" `
  -d "{`"html`":`"<h1>Hello ClinicalScribe</h1><p>This is a remote test from Render.</p>`"}" `
  --output test-render.pdf
```

**Expected:**
- File `test-render.pdf` downloads
- Opens in PDF viewer
- Shows "Hello ClinicalScribe" heading

---

### 2️⃣ Add Render URL to Vercel

#### Go to Vercel Dashboard
🔗 https://vercel.com/dashboard

#### Navigate to Your Project
1. Click on `clinicalscribe` project
2. Go to **Settings** → **Environment Variables**

#### Add New Variable
```
┌──────────────────────────────────────────────────────────┐
│  Add New Environment Variable                            │
│                                                          │
│  Name                                                    │
│  ┌────────────────────────────────────────────────────┐ │
│  │ RENDER_PDF_URL                                     │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  Value                                                   │
│  ┌────────────────────────────────────────────────────┐ │
│  │ https://clinicalscribe-pdf-service.onrender.com/   │ │
│  │ api/pdf/render                                     │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  Environment                                             │
│  ☑ Production                                           │
│  ☑ Preview                                              │
│  ☑ Development                                          │
│                                                          │
│  [ Save ]                                                │
└──────────────────────────────────────────────────────────┘
```

Click **Save**

---

### 3️⃣ Redeploy Vercel

#### Option A: Trigger Redeploy from Dashboard
1. Go to **Deployments** tab
2. Click **⋯** (three dots) on the latest deployment
3. Click **Redeploy**
4. Select **Use existing Build Cache** (faster)
5. Click **Redeploy**

#### Option B: Push Empty Commit
```bash
git commit --allow-empty -m "chore: trigger redeploy with render pdf url"
git push
```

**Wait for deployment to complete** (~2-3 minutes)

---

### 4️⃣ Check Vercel Logs for Remote Rendering

#### Access Vercel Logs
1. Go to **Deployments** tab
2. Click on the latest deployment
3. Click **View Function Logs**
4. Filter for `/api/pdf/render`

#### What to Look For

**When local rendering works (development):**
```
[POST] /api/pdf/render
✅ Local PDF generation successful
renderMode: local
PDF uploaded to Firebase Storage
```

**When remote rendering is used (production):**
```
[POST] /api/pdf/render
⚠️ Local PDF generation failed, trying remote...
Calling remote PDF service: https://clinicalscribe-pdf-service.onrender.com/api/pdf/render
✅ Remote PDF generation successful
renderMode: remote
x-render-mode: remote
PDF uploaded to Firebase Storage
```

---

### 5️⃣ Verify Firestore Data

#### Open Firebase Console
🔗 https://console.firebase.google.com

#### Navigate to Firestore
1. Select your project: `clinicalscribe-511e7`
2. Click **Firestore Database**
3. Go to `soapNotes` collection

#### Check Document Fields

**Look for a recently created SOAP note document:**

```json
{
  "id": "abc123...",
  "patientName": "Test Patient",
  "createdAt": "2025-10-29T23:00:00.000Z",
  
  // ✅ PDF METADATA - Look for these fields:
  "renderMode": "remote",           ← Should say "remote" (not "local")
  "renderService": "render",        ← Confirms it used Render
  "renderedAt": "2025-10-29T23:00:05.000Z",
  
  "pdfUrl": "https://firebasestorage.googleapis.com/v0/b/clinicalscribe-511e7.firebasestorage.app/o/pdfs%2F...",
  "filePath": "pdfs/user123/abc123.pdf",
  
  "subjective": "...",
  "objective": "...",
  "assessment": "...",
  "plan": "..."
}
```

#### Key Fields to Verify

| Field | Expected Value | Meaning |
|-------|---------------|---------|
| `renderMode` | `"remote"` | PDF was generated on Render (not locally) |
| `renderService` | `"render"` | Confirms Render service was used |
| `renderedAt` | Recent timestamp | When PDF was generated |
| `pdfUrl` | Firebase Storage URL | Permanent public URL |
| `filePath` | `pdfs/userId/noteId.pdf` | Storage path |

---

### 6️⃣ End-to-End Test

#### Generate a New SOAP Note

1. Go to your ClinicalScribe app (Vercel production URL)
2. Create a new patient encounter
3. Generate a SOAP note with PDF
4. Wait for completion

#### Check the Response

**In browser DevTools (Network tab):**

Look for the `/api/pdf/render` request:

**Response Headers:**
```
HTTP/2 200 OK
content-type: application/json
x-render-mode: remote          ← Confirms remote rendering
```

**Response Body:**
```json
{
  "success": true,
  "pdfUrl": "https://firebasestorage.googleapis.com/...",
  "filePath": "pdfs/user123/note456.pdf",
  "renderMode": "remote",       ← Confirms remote
  "noteId": "note456"
}
```

#### Download and Verify PDF

1. Click **Download PDF** button in your app
2. PDF should download successfully
3. Open the PDF
4. Verify:
   - ✅ Correct patient name
   - ✅ Correct SOAP sections (S, O, A, P)
   - ✅ Proper formatting
   - ✅ No rendering errors

---

## 🔍 Debugging: If renderMode is NOT "remote"

### Check 1: Is RENDER_PDF_URL Set?

**In Vercel Dashboard:**
- Settings → Environment Variables
- Look for `RENDER_PDF_URL`
- Value should be: `https://clinicalscribe-pdf-service.onrender.com/api/pdf/render`

**If missing:** Add it and redeploy

### Check 2: Is the Code Using the Env Var?

**Check your `/app/api/pdf/render/route.ts`:**

Look for this logic:
```typescript
const renderPdfUrl = process.env.RENDER_PDF_URL;

if (renderPdfUrl) {
  // Try remote rendering
  const response = await fetch(renderPdfUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ html: htmlContent })
  });
  
  if (response.ok) {
    renderMode = 'remote';
    // ... use remote PDF
  }
}
```

### Check 3: Vercel Logs Show Errors?

**Common errors:**

#### Error: "fetch failed"
```
Error calling remote PDF service: fetch failed
```
**Fix:** Check Render service is still running (visit health check URL)

#### Error: "RENDER_PDF_URL is not defined"
```
renderPdfUrl is undefined
```
**Fix:** Environment variable not set or deployment didn't pick it up. Redeploy.

#### Error: "Remote PDF generation returned 500"
```
Remote PDF service returned status 500
```
**Fix:** Check Render logs for Puppeteer errors

---

## 📊 Expected Architecture Flow

```
┌─────────────────────────────────────────────────────────┐
│ User generates SOAP note in ClinicalScribe (Vercel)    │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ /app/api/pdf/render/route.ts                           │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 1. Try local PDF generation (chrome-aws-lambda)    │ │
│ │    - Works in dev (local machine)                  │ │
│ │    - May fail in prod (Vercel serverless)          │ │
│ └─────────────────┬───────────────────────────────────┘ │
│                   │                                      │
│                   ├─ Success? → renderMode = "local"    │
│                   │                                      │
│                   └─ Failed? → Try remote fallback      │
│                       │                                  │
│ ┌─────────────────────▼─────────────────────────────┐   │
│ │ 2. Call RENDER_PDF_URL                           │   │
│ │    POST https://clinicalscribe-pdf-service       │   │
│ │         .onrender.com/api/pdf/render             │   │
│ │    Body: { html: "..." }                         │   │
│ └─────────────────┬───────────────────────────────┘   │
│                   │                                      │
│                   ▼                                      │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 3. Receive PDF buffer                              │ │
│ │    renderMode = "remote"                           │ │
│ │    x-render-mode: remote (header)                  │ │
│ └─────────────────┬───────────────────────────────┘   │
└───────────────────┼──────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────┐
│ Upload to Firebase Storage                             │
│ - Path: pdfs/{userId}/{noteId}.pdf                     │
│ - Get permanent URL                                     │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ Save to Firestore (soapNotes collection)               │
│ {                                                       │
│   renderMode: "remote",      ← Stored here             │
│   renderService: "render",                              │
│   pdfUrl: "https://...",                                │
│   filePath: "pdfs/..."                                  │
│ }                                                       │
└─────────────────────────────────────────────────────────┘
```

---

## ✅ Success Checklist

After following all steps, verify:

- [ ] Render service health check returns "✅ ClinicalScribe PDF Service Online"
- [ ] Test PDF generates successfully from Render endpoint
- [ ] `RENDER_PDF_URL` added to Vercel environment variables
- [ ] Vercel redeployed with new env var
- [ ] Vercel logs show "Remote PDF generation successful"
- [ ] Firestore document has `renderMode: "remote"`
- [ ] Firestore document has `renderService: "render"`
- [ ] PDF downloads successfully from app
- [ ] PDF content is correct and formatted properly

---

## 🎯 Quick Verification Commands

### Test Render Service
```powershell
# Health check
curl https://clinicalscribe-pdf-service.onrender.com

# Generate test PDF
curl -X POST https://clinicalscribe-pdf-service.onrender.com/api/pdf/render `
  -H "Content-Type: application/json" `
  -d "{`"html`":`"<h1>Test</h1>`"}" `
  --output test.pdf
```

### Check Vercel Env Vars
```bash
# If you have Vercel CLI installed
vercel env ls
```

### Monitor Vercel Logs (Real-time)
```bash
# If you have Vercel CLI installed
vercel logs --follow
```

---

## 📝 What to Share for Verification

Once you've completed the steps, share:

1. **Screenshot of Firestore document** showing:
   - `renderMode: "remote"`
   - `renderService: "render"`
   - Recent `renderedAt` timestamp

2. **Vercel logs snippet** showing:
   - "Remote PDF generation successful"
   - `x-render-mode: remote`

3. **Test result:**
   - "I generated a SOAP note and the PDF downloaded successfully"

---

**Ready to verify?** Generate a new SOAP note in your production app and let me know what you see in Firestore! 🚀
