# 🔍 Firestore Verification - How to Confirm Remote Rendering

## ✅ Your Code is Already Set Up!

Good news! Your `/app/api/pdf/render/route.ts` **already has the remote fallback logic**:

```typescript
// Lines 278-309: Fallback logic
try {
  // Try local rendering first
  const localResult = await renderPdfWithLocalEngines(htmlWithChrome, isLocal);
  pdfBuffer = localResult.pdfBuffer;
  renderMode = localResult.renderMode; // "local-chrome" or "vercel-bundled"
} catch (localError) {
  console.warn("[PDF Render] Local rendering failed; attempting remote fallback.");
  
  // Fall back to Render service
  if (process.env.RENDER_PDF_URL) {
    pdfBuffer = await renderPdfViaRemote(htmlWithChrome);
    renderMode = "remote-render"; // ← This is what you'll see in Firestore!
  }
}
```

---

## 🎯 What Gets Stored in Firestore

When remote rendering is used, your code stores this in the `soapNotes` collection:

```typescript
// Lines 342-356: Firestore update
const firestoreUpdate = {
  userId: ownerId,
  noteId: safeNoteId,
  pdfUrl: signedUrl,
  storagePath: "pdfs/userId/noteId.pdf",
  renderMode: "remote-render",  // ← KEY FIELD!
  pdf: {
    status: "done",
    path: storagePath,
    url: signedUrl,
    renderMode: "remote-render"  // ← Also stored here
  },
  updatedAt: serverTimestamp,
  // ... other fields
};
```

---

## 📋 Step-by-Step: How to Verify

### 1️⃣ Add RENDER_PDF_URL to Vercel

**Go to Vercel Dashboard:**
1. Navigate to your project: `clinicalscribe`
2. Click **Settings** → **Environment Variables**
3. Click **Add New**
4. Enter:
   ```
   Name:  RENDER_PDF_URL
   Value: https://clinicalscribe-pdf-service.onrender.com/api/pdf/render
   ```
5. Select: **Production**, **Preview**, **Development**
6. Click **Save**

### 2️⃣ Redeploy Vercel

**Option A - Dashboard:**
- Go to **Deployments** tab
- Click **⋯** on latest deployment
- Click **Redeploy**

**Option B - Git Push:**
```bash
git commit --allow-empty -m "chore: trigger redeploy with render url"
git push
```

Wait for deployment to complete (~2-3 minutes)

### 3️⃣ Generate a Test SOAP Note

1. Go to your production app (Vercel URL)
2. Create a new patient encounter
3. Generate a SOAP note with PDF
4. Wait for completion

### 4️⃣ Check Vercel Logs

**In Vercel Dashboard:**
1. Go to **Deployments** tab
2. Click on the latest deployment
3. Click **View Function Logs**
4. Look for `/api/pdf/render` logs

**What to look for:**

#### If Local Rendering Works (Dev):
```
[PDF Render] Starting for ownerId: user123
[PDF Render] Running in: Local
[PDF Render] Browser launched successfully using mode: local-chrome
[PDF Render] Completed using mode: local-chrome
```

#### If Remote Rendering is Used (Production):
```
[PDF Render] Starting for ownerId: user123
[PDF Render] Running in: Vercel
[PDF Render] Executable path: /tmp/chromium
[PDF Render] Local rendering failed; attempting remote fallback.
[PDF Render] Using remote render fallback via RENDER_PDF_URL
[PDF Render] Remote render fallback succeeded
[PDF Render] Firestore updated successfully for noteId: note456
[PDF Render] Completed using mode: remote-render  ← KEY LOG!
```

### 5️⃣ Check Firestore Database

**Open Firebase Console:**
1. Go to https://console.firebase.google.com
2. Select project: `clinicalscribe-511e7`
3. Click **Firestore Database**
4. Navigate to `soapNotes` collection
5. Find your recently created note

**Look for these fields:**

```json
{
  "noteId": "user123_1730246400000",
  "userId": "user123",
  "patientName": "Test Patient",
  "createdAt": { "_seconds": 1730246400 },
  "updatedAt": { "_seconds": 1730246405 },
  
  // ✅ PDF METADATA - This is what you're looking for:
  "renderMode": "remote-render",  // ← Should say "remote-render"
  "pdfUrl": "https://storage.googleapis.com/clinicalscribe-511e7.firebasestorage.app/pdfs/user123/note456.pdf?...",
  "storagePath": "pdfs/user123/note456.pdf",
  
  "pdf": {
    "status": "done",
    "path": "pdfs/user123/note456.pdf",
    "url": "https://storage.googleapis.com/...",
    "renderMode": "remote-render"  // ← Also here
  },
  
  // SOAP content
  "subjective": "...",
  "objective": "...",
  "assessment": "...",
  "plan": "..."
}
```

---

## 🔍 What Each renderMode Means

| Value | Meaning | Where it Runs |
|-------|---------|---------------|
| `"local-chrome"` | Local development | Your machine (Chrome installed) |
| `"vercel-bundled"` | Vercel serverless | Vercel (chrome-aws-lambda) |
| `"remote-render"` | **Render fallback** | **Render.com (Puppeteer)** |

---

## 🎯 Expected Behavior by Environment

### Development (Local Machine)
```
Environment: isLocal = true
Render Mode: "local-chrome"
Browser: Your local Chrome installation
Firestore: renderMode = "local-chrome"
```

### Production (Vercel - First Attempt)
```
Environment: isLocal = false
Render Mode: "vercel-bundled" (tries first)
Browser: chrome-aws-lambda
Result: May fail due to serverless limitations
```

### Production (Vercel - Fallback)
```
Environment: isLocal = false
Render Mode: "remote-render" (fallback)
Service: Render.com PDF service
Firestore: renderMode = "remote-render"  ← This is what you want!
```

---

## 📸 Visual Guide: Finding renderMode in Firestore

### Step 1: Open Firestore Console
```
Firebase Console → Firestore Database
```

### Step 2: Navigate to soapNotes
```
┌──────────────────────────────────────────────────────────┐
│ Firestore Database                                       │
│                                                          │
│ Collections:                                             │
│ ├─ patients                                              │
│ ├─ soapNotes  ← Click here                              │
│ ├─ users                                                 │
│ └─ ...                                                   │
└──────────────────────────────────────────────────────────┘
```

### Step 3: Select Recent Document
```
┌──────────────────────────────────────────────────────────┐
│ soapNotes Collection                                     │
│                                                          │
│ Documents:                                               │
│ ├─ user123_1730246400000  ← Click on recent one         │
│ ├─ user123_1730246350000                                │
│ └─ ...                                                   │
└──────────────────────────────────────────────────────────┘
```

### Step 4: Check renderMode Field
```
┌──────────────────────────────────────────────────────────┐
│ Document: user123_1730246400000                          │
│                                                          │
│ Field                    Type        Value               │
│ ───────────────────────────────────────────────────────  │
│ noteId                   string      user123_1730...     │
│ patientName              string      Test Patient        │
│ renderMode               string      remote-render  ✅   │ ← Look here!
│ pdfUrl                   string      https://storage...  │
│ storagePath              string      pdfs/user123/...    │
│ pdf                      map         ▼                   │
│   ├─ status              string      done                │
│   ├─ path                string      pdfs/user123/...    │
│   ├─ url                 string      https://storage...  │
│   └─ renderMode          string      remote-render  ✅   │ ← Also here!
│ subjective               string      Patient reports...  │
│ objective                string      Vital signs...      │
│ assessment               string      Diagnosis...        │
│ plan                     string      Treatment plan...   │
└──────────────────────────────────────────────────────────┘
```

---

## ✅ Success Indicators

You'll know remote rendering is working when you see **ALL** of these:

### In Vercel Logs:
- ✅ `[PDF Render] Local rendering failed; attempting remote fallback.`
- ✅ `[PDF Render] Using remote render fallback via RENDER_PDF_URL`
- ✅ `[PDF Render] Remote render fallback succeeded`
- ✅ `[PDF Render] Completed using mode: remote-render`

### In Firestore:
- ✅ `renderMode: "remote-render"` (top level)
- ✅ `pdf.renderMode: "remote-render"` (nested)
- ✅ `pdfUrl` contains valid Firebase Storage URL
- ✅ `storagePath` is `pdfs/{userId}/{noteId}.pdf`

### In Response Headers:
- ✅ `X-Render-Mode: remote-render`
- ✅ `Content-Type: application/pdf`
- ✅ `X-PDF-URL` contains storage URL

### PDF Download:
- ✅ PDF downloads successfully
- ✅ Opens without errors
- ✅ Shows correct SOAP content
- ✅ Watermark appears ("ClinicalScribe Beta")

---

## 🐛 Troubleshooting

### Issue: renderMode is "vercel-bundled" (not "remote-render")

**Meaning:** Local Vercel rendering succeeded (didn't need fallback)

**This is fine!** It means:
- chrome-aws-lambda worked on Vercel
- No need for remote fallback
- PDF generated successfully

**Note:** You may see `"remote-render"` more often if:
- Vercel serverless has resource constraints
- PDF is complex/large
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

### Issue: No renderMode field in Firestore

**Possible causes:**
1. Old document (created before this code was deployed)
2. PDF generation failed
3. Firestore update didn't complete

**Fix:**
- Generate a new SOAP note
- Check Vercel logs for errors
- Verify RENDER_PDF_URL is set

---

### Issue: Error "RENDER_PDF_URL is not configured"

**In Vercel Logs:**
```
[PDF Render] Local rendering failed; attempting remote fallback.
Error: RENDER_PDF_URL is not configured; remote PDF rendering is unavailable.
```

**Fix:**
1. Add `RENDER_PDF_URL` to Vercel environment variables
2. Redeploy Vercel
3. Try again

---

## 🧪 Quick Test Script

Want to test the Render endpoint directly? Use this:

```powershell
# Test Render service health
curl https://clinicalscribe-pdf-service.onrender.com

# Generate test PDF via Render
curl -X POST https://clinicalscribe-pdf-service.onrender.com/api/pdf/render `
  -H "Content-Type: application/json" `
  -d "{`"html`":`"<h1>Remote Test</h1><p>Generated: $(Get-Date)</p>`"}" `
  --output test-remote.pdf

# Check if PDF was created
if (Test-Path test-remote.pdf) {
  Write-Host "✅ PDF generated successfully!" -ForegroundColor Green
  Write-Host "Size: $((Get-Item test-remote.pdf).Length) bytes"
} else {
  Write-Host "❌ PDF generation failed" -ForegroundColor Red
}
```

---

## 📊 Monitoring Dashboard (Optional)

Create a simple monitoring script to check both services:

```powershell
# check-services.ps1

Write-Host "🔍 Checking ClinicalScribe Services..." -ForegroundColor Cyan

# Check Render service
try {
  $renderResponse = Invoke-WebRequest -Uri "https://clinicalscribe-pdf-service.onrender.com" -Method GET
  if ($renderResponse.StatusCode -eq 200) {
    Write-Host "✅ Render PDF Service: Online" -ForegroundColor Green
  }
} catch {
  Write-Host "❌ Render PDF Service: Offline" -ForegroundColor Red
}

# Check Vercel app
try {
  $vercelResponse = Invoke-WebRequest -Uri "https://your-app.vercel.app" -Method GET
  if ($vercelResponse.StatusCode -eq 200) {
    Write-Host "✅ Vercel App: Online" -ForegroundColor Green
  }
} catch {
  Write-Host "❌ Vercel App: Offline" -ForegroundColor Red
}
```

---

## 🎯 Next Steps

1. **Add RENDER_PDF_URL to Vercel** ✅
2. **Redeploy Vercel** ✅
3. **Generate test SOAP note** ✅
4. **Check Vercel logs** for "remote-render"
5. **Check Firestore** for `renderMode: "remote-render"`
6. **Download PDF** and verify content

---

## 📝 What to Share for Verification

Once you've tested, share:

1. **Screenshot of Firestore document** showing:
   ```
   renderMode: "remote-render"
   ```

2. **Vercel log snippet** showing:
   ```
   [PDF Render] Completed using mode: remote-render
   ```

3. **Confirmation:**
   - "PDF downloaded successfully"
   - "Content is correct"

---

**Ready to test?** Add the environment variable to Vercel and generate a SOAP note! 🚀
