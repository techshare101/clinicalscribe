# Vercel PDF Generation Fix

## ✅ Changes Made

### 1. **vercel.json** - Updated Configuration
```json
{
  "functions": {
    "api/pdf/render.js": {
      "runtime": "nodejs20.x",    // ✅ Forces Node.js 20 runtime
      "maxDuration": 60,           // ✅ 60 second timeout
      "memory": 1024               // ✅ 1GB RAM for Chromium
    }
  },
  "build": {
    "env": {
      "CHROMIUM_PATH": "/var/task/node_modules/@sparticuz/chromium/bin"
    }
  },
  "regions": ["iad1"]
}
```

**Key Changes:**
- Changed path from `app/api/pdf/render/route.ts` → `api/pdf/render.js` (Vercel build output)
- Added explicit `runtime: "nodejs20.x"` to ensure Node.js runtime (not Edge)
- Added `CHROMIUM_PATH` environment variable for build

### 2. **package.json** - Added Node Engine
```json
{
  "engines": {
    "node": ">=20.x"
  }
}
```

**Why:** Ensures Vercel uses Node.js 20+ which is required for @sparticuz/chromium

### 3. **route.ts** - Added Dynamic Export
```typescript
export const runtime = "nodejs";
export const dynamic = "force-dynamic";  // ✅ NEW
```

**Why:** Forces server-side rendering for each PDF request (no caching)

---

## 📦 Dependencies Already Correct

✅ `@sparticuz/chromium@^126.0.0` - in dependencies (not devDependencies)
✅ `puppeteer-core@^22.6.0` - in dependencies
✅ Route already uses proper Chromium detection for Vercel

---

## 🚀 Deploy Instructions

```bash
# Install dependencies (if needed)
pnpm install

# Commit changes
git add vercel.json package.json app/api/pdf/render/route.ts
git commit -m "🐛 Fix: Configure Vercel for Chromium PDF generation"

# Deploy to Vercel
git push
```

---

## 🧪 Test After Deploy

### Test 1: Direct API Test
```bash
curl -X POST https://clinicalscribe.vercel.app/api/pdf/render \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -d '{
    "html": "<html><body><h1>Test PDF ✅</h1></body></html>",
    "noteId": "test_123",
    "signature": "Dr. Test",
    "patientName": "Test Patient"
  }' \
  --output test.pdf
```

**Expected:** Downloads a valid `test.pdf` file

### Test 2: Check Vercel Logs
1. Go to Vercel Dashboard → Your Project
2. Click on latest deployment
3. Go to "Functions" tab
4. Click on `api/pdf/render`
5. Check "Runtime Logs"

**Look for:**
```
[PDF Render] Using @sparticuz/chromium for serverless environment
[PDF Render] Browser launched successfully
[PDF Render] PDF generated successfully
```

### Test 3: App Test
1. Open your app at https://clinicalscribe.vercel.app
2. Create a SOAP note
3. Sign with signature pad
4. Click "Generate PDF"

**Expected:** PDF downloads successfully with signature embedded

---

## 🔍 What Was Wrong

| Issue | Root Cause | Fix |
|-------|-----------|-----|
| 500 Internal Server Error | Vercel couldn't find Chromium binary | Added explicit Node.js 20 runtime |
| "PDF generation service not available" | Edge runtime doesn't support Chromium | Forced `nodejs` runtime in route.ts |
| Missing Chromium executable | Build environment not configured | Added CHROMIUM_PATH to vercel.json |

---

## ✅ Verification Checklist

After deploy, verify:

- [ ] `curl` test returns valid PDF
- [ ] Vercel logs show "Browser launched successfully"
- [ ] App's "Generate PDF" button works
- [ ] Signature appears in generated PDF
- [ ] No 500 errors in browser console
- [ ] PDF includes SOAP note content

---

## 🆘 If Still Failing

Check Vercel logs for:

1. **"Cannot find module @sparticuz/chromium"**
   - Run `pnpm install` and redeploy
   - Verify it's in `dependencies` not `devDependencies`

2. **"Failed to launch browser"**
   - Check memory allocation (should be 1024 MB)
   - Verify `runtime: "nodejs20.x"` in vercel.json

3. **"Timeout"**
   - Increase `maxDuration` to 90 seconds
   - Check if HTML content is too large

4. **"Firebase Storage error"**
   - Verify Firebase Storage is enabled
   - Check Firebase Admin credentials are set in Vercel env vars

---

## 📝 Notes

- Local development uses system Chrome (works fine)
- Vercel production uses @sparticuz/chromium (serverless-compatible)
- The route automatically detects environment and uses correct binary
- Signatures are embedded as base64 images in the PDF
- PDFs are uploaded to Firebase Storage with signed URLs
