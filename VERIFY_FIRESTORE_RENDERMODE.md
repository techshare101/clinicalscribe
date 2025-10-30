# 🔍 How to Verify renderMode: "remote-render" in Firestore

## ✅ What Just Happened

1. ✅ **Pushed to GitHub** - Auth guard hook + documentation
2. ✅ **Vercel Auto-Deploy** - Triggered automatically from push
3. ⏳ **Waiting** - Vercel deployment in progress (~2-3 minutes)

---

## 🎯 Next: Add RENDER_PDF_URL to Vercel (CRITICAL)

### Why This Matters

Your code already has the fallback logic, but it needs the `RENDER_PDF_URL` environment variable to know where to send requests when local Puppeteer fails.

### Steps

1. **Go to Vercel Dashboard**
   - https://vercel.com/dashboard
   - Click on your `clinicalscribe` project

2. **Add Environment Variable**
   - Click **Settings** → **Environment Variables**
   - Click **Add New**
   - Fill in:
     ```
     Name:  RENDER_PDF_URL
     Value: https://clinicalscribe-pdf-service.onrender.com/api/pdf/render
     ```
   - Select: ☑ Production, ☑ Preview, ☑ Development
   - Click **Save**

3. **Trigger Redeploy**
   - Go to **Deployments** tab
   - Click **⋯** on the latest deployment
   - Click **Redeploy**
   - Wait ~2-3 minutes

---

## 🧪 Test: Generate a SOAP Note

### Step 1: Open Your Production App

Visit your Vercel URL (e.g., `https://clinicalscribe.vercel.app`)

### Step 2: Generate a SOAP Note with PDF

1. Sign in as a nurse
2. Create a new patient encounter
3. Generate a SOAP note
4. Wait for PDF generation to complete

### Step 3: Check Vercel Logs

**In Vercel Dashboard:**
1. Go to **Deployments** tab
2. Click on the latest deployment
3. Click **View Function Logs**
4. Filter for `/api/pdf/render`

**Look for these log messages:**

#### ✅ Success Pattern (Remote Rendering):
```
[PDF Render] Starting for ownerId: user123
[PDF Render] Running in: Vercel
[PDF Render] Executable path: /tmp/chromium
[PDF Render] Local rendering failed; attempting remote fallback.
[PDF Render] Using remote render fallback via RENDER_PDF_URL
[PDF Render] Remote render fallback succeeded
[PDF Render] Firestore updated successfully for noteId: note456
[PDF Render] PDF URL: https://storage.googleapis.com/...
[PDF Render] Completed using mode: remote-render  ← KEY!
```

#### ❌ If You See This (Missing Env Var):
```
[PDF Render] Local rendering failed; attempting remote fallback.
Error: RENDER_PDF_URL is not configured; remote PDF rendering is unavailable.
```

**Fix:** Add `RENDER_PDF_URL` to Vercel environment variables (see above)

---

## 🔍 Verify in Firestore

### Step 1: Open Firebase Console

1. Go to https://console.firebase.google.com
2. Select project: `clinicalscribe-511e7`
3. Click **Firestore Database**

### Step 2: Navigate to soapNotes Collection

```
Firestore Database
├─ patients
├─ soapNotes  ← Click here
├─ users
└─ ...
```

### Step 3: Find Your Recent Document

Click on the most recently created document (sorted by timestamp)

### Step 4: Check renderMode Field

**Look for these fields:**

```json
{
  "noteId": "user123_1730246400000",
  "userId": "user123",
  "patientName": "Test Patient",
  "createdAt": { "_seconds": 1730246400 },
  "updatedAt": { "_seconds": 1730246405 },
  
  // ✅ THIS IS WHAT YOU'RE LOOKING FOR:
  "renderMode": "remote-render",  // ← Should say "remote-render"
  
  "pdfUrl": "https://storage.googleapis.com/clinicalscribe-511e7.firebasestorage.app/pdfs/user123/note456.pdf?...",
  "storagePath": "pdfs/user123/note456.pdf",
  
  "pdf": {
    "status": "done",
    "path": "pdfs/user123/note456.pdf",
    "url": "https://storage.googleapis.com/...",
    "renderMode": "remote-render"  // ← Also here
  },
  
  "subjective": "Patient reports...",
  "objective": "Vital signs...",
  "assessment": "Diagnosis...",
  "plan": "Treatment plan..."
}
```

---

## 📊 What Each renderMode Means

| Value | Meaning | Where PDF Was Generated |
|-------|---------|------------------------|
| `"local-chrome"` | Local development | Your machine (Chrome) |
| `"vercel-bundled"` | Vercel serverless | Vercel (chrome-aws-lambda) |
| `"remote-render"` | **Render fallback** | **Render.com (Puppeteer)** ✅ |

---

## 🎯 Success Checklist

After adding `RENDER_PDF_URL` and redeploying:

- [ ] Vercel logs show "Using remote render fallback via RENDER_PDF_URL"
- [ ] Vercel logs show "Remote render fallback succeeded"
- [ ] Vercel logs show "Completed using mode: remote-render"
- [ ] Firestore document has `renderMode: "remote-render"`
- [ ] Firestore document has `pdf.renderMode: "remote-render"`
- [ ] PDF downloads successfully
- [ ] PDF opens and displays correct content

---

## 📸 Visual Guide: Finding renderMode in Firestore

### Firestore Console View:

```
┌──────────────────────────────────────────────────────────────┐
│ Document: user123_1730246400000                              │
│                                                              │
│ Field                    Type        Value                   │
│ ──────────────────────────────────────────────────────────── │
│ noteId                   string      user123_1730...         │
│ patientName              string      Test Patient            │
│ renderMode               string      remote-render  ✅       │ ← HERE!
│ pdfUrl                   string      https://storage...      │
│ storagePath              string      pdfs/user123/...        │
│ pdf                      map         ▼                       │
│   ├─ status              string      done                    │
│   ├─ path                string      pdfs/user123/...        │
│   ├─ url                 string      https://storage...      │
│   └─ renderMode          string      remote-render  ✅       │ ← AND HERE!
│ subjective               string      Patient reports...      │
│ objective                string      Vital signs...          │
│ assessment               string      Diagnosis...            │
│ plan                     string      Treatment plan...       │
└──────────────────────────────────────────────────────────────┘
```

---

## 🐛 Troubleshooting

### Issue: renderMode is "vercel-bundled" (not "remote-render")

**Meaning:** Vercel's local Puppeteer succeeded (didn't need fallback)

**This is OK!** It means:
- chrome-aws-lambda worked on Vercel
- PDF generated successfully
- No errors occurred

**Note:** You may see `"remote-render"` more often when:
- PDF is complex/large
- Vercel has resource constraints
- Multiple concurrent requests

---

### Issue: renderMode is "local-chrome"

**Meaning:** Running in development mode

**Expected behavior:**
- Local development uses your Chrome
- Production will use Vercel or Render

**To test remote rendering:**
- Deploy to Vercel (production)
- Generate SOAP note in production app

---

### Issue: No renderMode field

**Possible causes:**
1. Old document (created before this code was deployed)
2. PDF generation failed
3. Firestore update didn't complete

**Fix:**
- Generate a new SOAP note
- Check Vercel logs for errors
- Verify `RENDER_PDF_URL` is set

---

### Issue: Error "RENDER_PDF_URL is not configured"

**In Vercel Logs:**
```
Error: RENDER_PDF_URL is not configured; remote PDF rendering is unavailable.
```

**Fix:**
1. Add `RENDER_PDF_URL` to Vercel environment variables
2. Value: `https://clinicalscribe-pdf-service.onrender.com/api/pdf/render`
3. Redeploy Vercel
4. Try again

---

## 🧪 Quick Test Commands

### Test Render Service Directly

```powershell
# Health check
curl https://clinicalscribe-pdf-service.onrender.com

# Expected: ✅ ClinicalScribe PDF Service Online

# Generate test PDF
curl -X POST https://clinicalscribe-pdf-service.onrender.com/api/pdf/render `
  -H "Content-Type: application/json" `
  -d "{`"html`":`"<h1>Test PDF</h1><p>Generated: $(Get-Date)</p>`"}" `
  --output test-render.pdf

# Verify file created
if (Test-Path test-render.pdf) {
  Write-Host "✅ PDF generated successfully!" -ForegroundColor Green
  Write-Host "Size: $((Get-Item test-render.pdf).Length) bytes"
} else {
  Write-Host "❌ PDF generation failed" -ForegroundColor Red
}
```

---

## 📝 What to Share for Verification

Once you've tested, share:

1. **Screenshot of Firestore document** showing:
   ```
   renderMode: "remote-render"
   pdf.renderMode: "remote-render"
   ```

2. **Vercel log snippet** showing:
   ```
   [PDF Render] Remote render fallback succeeded
   [PDF Render] Completed using mode: remote-render
   ```

3. **Confirmation:**
   - "PDF downloaded successfully"
   - "Content is correct"
   - "No browser console errors"

---

## 🎯 Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ User generates SOAP note in ClinicalScribe                  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Vercel: /app/api/pdf/render/route.ts                       │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 1. Try local Puppeteer (chrome-aws-lambda)             │ │
│ │    - Works in dev (local Chrome)                       │ │
│ │    - May fail in prod (serverless limits)             │ │
│ └─────────────────┬───────────────────────────────────────┘ │
│                   │                                          │
│                   ├─ Success? → renderMode = "vercel-bundled"│
│                   │                                          │
│                   └─ Failed? → Try remote fallback          │
│                       │                                      │
│ ┌─────────────────────▼─────────────────────────────────┐   │
│ │ 2. Check RENDER_PDF_URL env var                      │   │
│ │    If set → Call Render service                      │   │
│ │    POST https://clinicalscribe-pdf-service           │   │
│ │         .onrender.com/api/pdf/render                 │   │
│ └─────────────────┬───────────────────────────────────┘   │
│                   │                                          │
│                   ▼                                          │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 3. Receive PDF buffer from Render                      │ │
│ │    renderMode = "remote-render"  ← STORED IN FIRESTORE │ │
│ └─────────────────┬───────────────────────────────────┘   │
└───────────────────┼──────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│ Upload to Firebase Storage                                  │
│ - Path: pdfs/{userId}/{noteId}.pdf                          │
│ - Get permanent URL                                          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ Save to Firestore (soapNotes collection)                    │
│ {                                                            │
│   renderMode: "remote-render",  ← YOU'LL SEE THIS!          │
│   pdf: {                                                     │
│     renderMode: "remote-render"  ← AND THIS!                │
│   }                                                          │
│ }                                                            │
└─────────────────────────────────────────────────────────────┘
```

---

## ⏱️ Timeline

| Time | Action | Status |
|------|--------|--------|
| Now | Code pushed to GitHub | ✅ Done |
| +2 min | Vercel auto-deploys | ⏳ In progress |
| +3 min | Add RENDER_PDF_URL to Vercel | ⏳ Waiting |
| +5 min | Redeploy Vercel | ⏳ Waiting |
| +8 min | Generate test SOAP note | ⏳ Waiting |
| +10 min | Check Firestore for renderMode | ⏳ Waiting |

---

## 🚀 Action Items (In Order)

1. ✅ **Wait for Vercel deployment** (~2 min)
   - Check https://vercel.com/dashboard
   - Look for "Building" → "Ready"

2. ⏳ **Add RENDER_PDF_URL** (1 min)
   - Settings → Environment Variables
   - Add the Render URL
   - Save

3. ⏳ **Redeploy Vercel** (2 min)
   - Deployments → Redeploy
   - Wait for completion

4. ⏳ **Generate SOAP Note** (2 min)
   - Open production app
   - Create test note with PDF

5. ⏳ **Verify Firestore** (1 min)
   - Firebase Console → Firestore
   - Check renderMode field

6. ⏳ **Share Results** 🎉
   - Screenshot of Firestore
   - Vercel logs snippet

---

**Start by adding RENDER_PDF_URL to Vercel, then we'll verify the renderMode together!** 🚀
