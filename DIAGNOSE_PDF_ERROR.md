# 🔍 Diagnose: "All PDF render strategies failed"

## 🐛 Error Analysis

**Vercel Log:**
```
[PDF Render] Error generating PDF
Error: All PDF render strategies failed.
```

This means **BOTH** strategies failed:
1. ❌ Local Puppeteer (Vercel serverless)
2. ❌ Remote fallback (Render service)

---

## 🎯 Root Cause: Most Likely Missing RENDER_PDF_URL

The error "All PDF render strategies failed" happens when:
1. Local Puppeteer fails (expected on Vercel)
2. Code tries remote fallback
3. `RENDER_PDF_URL` is **not set** or **incorrect**
4. Throws error: "RENDER_PDF_URL is not configured"

---

## ✅ Fix #1: Verify RENDER_PDF_URL in Vercel

### Step 1: Check Environment Variable

**Go to Vercel Dashboard:**
1. https://vercel.com/dashboard
2. Click on `clinicalscribe` project
3. Go to **Settings** → **Environment Variables**

**Look for:**
```
Name:  RENDER_PDF_URL
Value: https://clinicalscribe-pdf-service.onrender.com/api/pdf/render
```

### Step 2: Verify Settings

**CRITICAL CHECKS:**

- [ ] Variable name is **exactly** `RENDER_PDF_URL` (case-sensitive)
- [ ] Value is **exactly** `https://clinicalscribe-pdf-service.onrender.com/api/pdf/render`
- [ ] No trailing slash: ❌ `.../render/` ✅ `.../render`
- [ ] No extra spaces before/after the URL
- [ ] Enabled for: ☑ Production, ☑ Preview, ☑ Development

### Step 3: If Missing or Wrong

**Add/Fix it:**
1. Click **Add New** (or **Edit** if exists)
2. Copy-paste this **exactly**:
   ```
   Name:  RENDER_PDF_URL
   Value: https://clinicalscribe-pdf-service.onrender.com/api/pdf/render
   ```
3. Select all environments
4. Click **Save**

### Step 4: Redeploy

**IMPORTANT:** Environment variables only take effect after redeployment!

```bash
git commit --allow-empty -m "chore: trigger redeploy for render url"
git push
```

Or in Vercel Dashboard:
- **Deployments** → **⋯** → **Redeploy**

---

## ✅ Fix #2: Test Render Service Directly

Before testing through Vercel, verify Render service is working.

### Test 1: Health Check

```powershell
curl https://clinicalscribe-pdf-service.onrender.com
```

**Expected:**
```
✅ ClinicalScribe PDF Service Online
```

**If you get an error:**
- Service may be sleeping (free tier)
- Wait 30 seconds and try again
- Check Render dashboard for service status

### Test 2: Generate Test PDF

```powershell
Invoke-WebRequest `
  -Uri "https://clinicalscribe-pdf-service.onrender.com/api/pdf/render" `
  -Method POST `
  -Headers @{ "Content-Type" = "application/json" } `
  -Body '{"html":"<h1>Test PDF</h1><p>Generated from PowerShell</p>"}' `
  -OutFile "render-test.pdf"
```

**Expected:**
- File `render-test.pdf` downloads
- Size: ~5-10 KB
- Opens in PDF viewer

**If you get 500 error:**
- Render service has an issue
- Check Render logs for errors
- May need to redeploy Render service

### Test 3: Check Render Logs

**In Render Dashboard:**
1. Click on `clinicalscribe-pdf-service`
2. Click **Logs** tab
3. Look for recent errors

**Healthy logs should show:**
```
🚀 PDF service running on port 10000
POST /api/pdf/render 200 - 1234ms
```

**If you see errors:**
```
Error: Failed to launch the browser process!
libnss3.so: cannot open shared object file
```

**Fix:** Redeploy Render with clear cache:
- Render Dashboard → Manual Deploy → Clear build cache & deploy

---

## 🧪 Test from Vercel (Diagnostic Endpoint)

Create a test endpoint to verify Vercel can reach Render.

### Create: `app/api/test-render/route.ts`

```typescript
import { NextResponse } from 'next/server';

export async function GET() {
  const renderUrl = process.env.RENDER_PDF_URL;
  
  console.log('[Test] RENDER_PDF_URL:', renderUrl ? 'SET ✅' : 'NOT SET ❌');
  
  if (!renderUrl) {
    return NextResponse.json({
      error: 'RENDER_PDF_URL not configured',
      envVars: Object.keys(process.env).filter(k => k.includes('RENDER'))
    }, { status: 500 });
  }
  
  try {
    console.log('[Test] Calling Render service...');
    const response = await fetch(renderUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ html: '<h1>Test from Vercel</h1>' })
    });
    
    console.log('[Test] Render response status:', response.status);
    
    if (!response.ok) {
      const text = await response.text();
      return NextResponse.json({
        error: 'Render service error',
        status: response.status,
        body: text
      }, { status: 500 });
    }
    
    const buffer = await response.arrayBuffer();
    console.log('[Test] PDF size:', buffer.byteLength, 'bytes');
    
    return NextResponse.json({
      success: true,
      renderUrl,
      pdfSize: buffer.byteLength,
      message: 'Render service is reachable from Vercel ✅'
    });
  } catch (error: any) {
    console.error('[Test] Error:', error);
    return NextResponse.json({
      error: error.message,
      renderUrl
    }, { status: 500 });
  }
}
```

### Test the Endpoint

After deploying, visit:
```
https://clinicalscribe.vercel.app/api/test-render
```

**Expected Success Response:**
```json
{
  "success": true,
  "renderUrl": "https://clinicalscribe-pdf-service.onrender.com/api/pdf/render",
  "pdfSize": 8234,
  "message": "Render service is reachable from Vercel ✅"
}
```

**If you get error:**
```json
{
  "error": "RENDER_PDF_URL not configured"
}
```
→ Environment variable not set or not deployed yet

---

## 🔍 Check Vercel Function Logs

### Where to Look

1. Vercel Dashboard → Your Project
2. **Deployments** tab
3. Click on latest deployment
4. Click **View Function Logs**
5. Filter for `/api/pdf/render`

### What to Look For

#### ✅ Success Pattern:
```
[PDF Render] Starting for ownerId: user123
[PDF Render] Running in: Vercel
[PDF Render] Local rendering failed; attempting remote fallback.
[PDF Render] Using remote render fallback via RENDER_PDF_URL
[PDF Render] Remote render fallback succeeded
[PDF Render] Completed using mode: remote-render
```

#### ❌ Missing Env Var:
```
[PDF Render] Local rendering failed; attempting remote fallback.
Error: RENDER_PDF_URL is not configured; remote PDF rendering is unavailable.
Error: All PDF render strategies failed.
```

#### ❌ Render Service Error:
```
[PDF Render] Using remote render fallback via RENDER_PDF_URL
Error: Remote render service responded with 500 Internal Server Error
Error: All PDF render strategies failed.
```

---

## 📊 Troubleshooting Decision Tree

```
Is RENDER_PDF_URL set in Vercel?
│
├─ NO → Add it and redeploy
│
└─ YES
   │
   Does Render health check work?
   │
   ├─ NO → Redeploy Render service
   │
   └─ YES
      │
      Does test PDF generate from Render?
      │
      ├─ NO → Check Render logs for errors
      │
      └─ YES
         │
         Does /api/test-render work?
         │
         ├─ NO → Network issue between Vercel and Render
         │
         └─ YES → Check main PDF route logs
```

---

## ✅ Step-by-Step Fix Plan

### 1. Verify RENDER_PDF_URL (2 min)
- [ ] Go to Vercel → Settings → Environment Variables
- [ ] Confirm `RENDER_PDF_URL` exists and is correct
- [ ] If missing/wrong, add/fix it
- [ ] Click Save

### 2. Redeploy Vercel (2 min)
- [ ] Deployments → Redeploy
- [ ] Wait for completion
- [ ] Check deployment succeeded

### 3. Test Render Service (1 min)
```powershell
curl https://clinicalscribe-pdf-service.onrender.com
```
- [ ] Returns "✅ ClinicalScribe PDF Service Online"

### 4. Test PDF Generation (1 min)
```powershell
curl -X POST https://clinicalscribe-pdf-service.onrender.com/api/pdf/render `
  -H "Content-Type: application/json" `
  -d '{"html":"<h1>Test</h1>"}' `
  --output test.pdf
```
- [ ] File `test.pdf` downloads
- [ ] Opens successfully

### 5. Create Test Endpoint (5 min)
- [ ] Create `app/api/test-render/route.ts` (see above)
- [ ] Commit and push
- [ ] Visit `/api/test-render` in browser
- [ ] Check response

### 6. Generate SOAP Note (2 min)
- [ ] Open production app
- [ ] Generate SOAP note with PDF
- [ ] Check Vercel logs
- [ ] Verify Firestore has `renderMode: "remote-render"`

---

## 🚨 Common Issues

### Issue: "RENDER_PDF_URL not configured"

**Cause:** Environment variable not set or not deployed

**Fix:**
1. Add to Vercel environment variables
2. Redeploy
3. Wait for deployment to complete
4. Try again

### Issue: "Remote render service responded with 500"

**Cause:** Render service has an error

**Fix:**
1. Check Render logs
2. Look for Chromium/Puppeteer errors
3. Redeploy Render with clear cache
4. Verify apt.txt packages installed

### Issue: "fetch failed" or "ECONNREFUSED"

**Cause:** Network issue or Render service down

**Fix:**
1. Check Render service status
2. Verify URL is correct (no typos)
3. Test health check endpoint
4. Check Render status page: https://status.render.com

---

## 📝 Quick Checklist

Before testing again:

- [ ] `RENDER_PDF_URL` set in Vercel
- [ ] Vercel redeployed after adding env var
- [ ] Render service health check passes
- [ ] Render can generate test PDF
- [ ] `/api/test-render` endpoint works (optional but helpful)

---

## 🎯 Most Likely Fix

**90% of the time, this error means:**

The `RENDER_PDF_URL` environment variable is **not set in Vercel** or **not deployed yet**.

**Quick fix:**
1. Add `RENDER_PDF_URL` to Vercel
2. Redeploy
3. Try again

**That's it!** 🚀

---

**Start with verifying the environment variable in Vercel - that's almost always the issue!**
