# 🎯 Render Deployment - Visual Step-by-Step Guide

## ✅ Your Files Are Ready!

All files are committed and pushed to GitHub:
```
✅ render-pdf-service/.gitignore
✅ render-pdf-service/README.md
✅ render-pdf-service/apt.txt
✅ render-pdf-service/package.json
✅ render-pdf-service/server.js
```

**Commit:** `5e850e5` - "feat: add dedicated render pdf service"  
**Branch:** `mvp-launch`  
**Status:** Pushed to `origin/mvp-launch` ✅

---

## 🚀 Deploy to Render (Click-by-Click)

### Step 1: Go to Render Dashboard
🔗 **URL:** https://render.com/dashboard

---

### Step 2: Create New Web Service
Click the big blue button:
```
┌─────────────────────────────────────┐
│         + New                       │
│    ┌─────────────────────────┐     │
│    │  📦 Web Service          │ ← Click this
│    ├─────────────────────────┤     │
│    │  🗄️  Static Site         │     │
│    │  🔧 Background Worker    │     │
│    └─────────────────────────┘     │
└─────────────────────────────────────┘
```

---

### Step 3: Connect Repository
You'll see a screen like this:

```
┌──────────────────────────────────────────────────────────┐
│  Connect a repository                                    │
│                                                          │
│  🔍 Search repositories...                              │
│  ┌────────────────────────────────────────────────────┐ │
│  │ techshare101/clinicalscribe                    ✅  │ │ ← Select this
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  [ Connect ]                                             │
└──────────────────────────────────────────────────────────┘
```

Click **Connect**

---

### Step 4: Configure Service (CRITICAL SETTINGS)

You'll see a form. Fill it out **EXACTLY** like this:

```
┌──────────────────────────────────────────────────────────────┐
│  Configure your Web Service                                 │
│                                                              │
│  Name                                                        │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ clinicalscribe-pdf-service                             │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  Region                                                      │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Oregon (US West) ▼                                     │ │ (or closest to you)
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  Branch                                                      │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ mvp-launch ▼                                           │ │ ← IMPORTANT
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  Root Directory                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ render-pdf-service                                     │ │ ← CRITICAL! Don't forget this!
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  Runtime                                                     │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Node ▼                                                 │ │ (auto-detected)
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  Build Command                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ npm install                                            │ │ ← IMPORTANT
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  Start Command                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ npm start                                              │ │ ← IMPORTANT
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  Instance Type                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ ○ Free                                                 │ │ ← Select this (or Starter)
│  │ ○ Starter ($7/month)                                   │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  [ Create Web Service ]                                      │ ← Click when ready
└──────────────────────────────────────────────────────────────┘
```

---

### Step 5: Watch the Deploy Logs

After clicking "Create Web Service", you'll see logs streaming:

#### ✅ Phase 1: Clone & Checkout (10-20 seconds)
```
==> Cloning from https://github.com/techshare101/clinicalscribe...
==> Checking out commit 5e850e5 in branch mvp-launch
==> Using Node version 20.x.x
```

#### ✅ Phase 2: Build (30-60 seconds)
```
==> Running build command 'npm install'...

added 67 packages, and audited 68 packages in 8s
found 0 vulnerabilities

==> Build successful! ✅
```

#### ✅ Phase 3: System Dependencies (60-90 seconds)
```
==> Installing system dependencies from apt.txt...

The following NEW packages will be installed:
  chromium libnss3 libx11-xcb1 libxcomposite1 libxdamage1 
  libxrandr2 libgbm1 libasound2 libatk1.0-0 libatk-bridge2.0-0 
  libpangocairo-1.0-0 fonts-liberation

==> System dependencies installed successfully ✅
```

#### ✅ Phase 4: Start Service (5-10 seconds)
```
==> Starting service with 'npm start'...

> clinicalscribe-pdf-service@1.0.0 start
> node server.js

🚀 PDF service running on port 10000

==> Your service is live at https://clinicalscribe-pdf-service.onrender.com
```

---

### Step 6: Verify Deployment

#### Test 1: Health Check
Click on your service URL or run:
```bash
curl https://clinicalscribe-pdf-service.onrender.com
```

**Expected Response:**
```
✅ ClinicalScribe PDF Service Online
```

#### Test 2: Generate Test PDF
```bash
curl -X POST https://clinicalscribe-pdf-service.onrender.com/api/pdf/render \
  -H "Content-Type: application/json" \
  -d '{"html":"<h1>Test PDF</h1><p>This is a test from Render!</p>"}' \
  --output test.pdf
```

**Expected:**
- File `test.pdf` downloads
- Opens in PDF viewer
- Shows "Test PDF" heading

---

## 🎯 What Success Looks Like

### In Render Dashboard:
```
┌──────────────────────────────────────────────────────────┐
│  clinicalscribe-pdf-service                              │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Status: ● Live                                    │  │ ← Green dot
│  │  URL: https://clinicalscribe-pdf-service.onrender  │  │
│  │       .com                                         │  │
│  │  Last Deploy: Just now                             │  │
│  │  Health: ✅ Healthy                                │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

### In Browser:
Visit: `https://clinicalscribe-pdf-service.onrender.com`

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│         ✅ ClinicalScribe PDF Service Online            │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## 🔗 Connect to Vercel (Final Step)

### 1. Copy Your Render URL
```
https://clinicalscribe-pdf-service.onrender.com
```

### 2. Go to Vercel Dashboard
🔗 https://vercel.com/dashboard

### 3. Select Your Project
Click on `clinicalscribe`

### 4. Add Environment Variable
1. Go to **Settings** → **Environment Variables**
2. Click **Add New**
3. Fill in:
   ```
   Name:  RENDER_PDF_URL
   Value: https://clinicalscribe-pdf-service.onrender.com/api/pdf/render
   ```
4. Select: **Production, Preview, Development**
5. Click **Save**

### 5. Redeploy Vercel
Go to **Deployments** → Click **⋯** on latest → **Redeploy**

Or push a new commit:
```bash
git commit --allow-empty -m "chore: trigger redeploy with render url"
git push
```

---

## 🧪 End-to-End Test

### 1. Generate SOAP Note
Use your ClinicalScribe app to generate a new SOAP note with PDF

### 2. Check Firestore
Look for the document in `soapNotes` collection:
```json
{
  "renderMode": "remote",  ← Should say "remote" (not "local")
  "pdfUrl": "https://firebasestorage.googleapis.com/...",
  "renderService": "render"
}
```

### 3. Download PDF
Click "Download PDF" button in your app

**Expected:**
- PDF downloads successfully
- Opens without errors
- Shows correct SOAP note content

---

## 📊 Deployment Checklist

Before clicking "Create Web Service":

- [ ] Repository: `techshare101/clinicalscribe`
- [ ] Branch: `mvp-launch`
- [ ] Root Directory: `render-pdf-service` ← **CRITICAL**
- [ ] Build Command: `npm install`
- [ ] Start Command: `npm start`
- [ ] Instance Type: Free (or Starter)

After deployment:

- [ ] Service shows "● Live" status
- [ ] Health check returns "✅ ClinicalScribe PDF Service Online"
- [ ] Test PDF generates successfully
- [ ] Added `RENDER_PDF_URL` to Vercel
- [ ] Redeployed main app on Vercel
- [ ] End-to-end test passes

---

## 🚨 Troubleshooting

### Issue: "Build failed"
**Check:** Did you set **Root Directory** to `render-pdf-service`?

### Issue: "chromium: not found"
**Check:** Is `apt.txt` in the `render-pdf-service/` folder?

### Issue: Service crashes on start
**Check logs for:**
- Port binding errors (should use `process.env.PORT`)
- Missing dependencies (run `npm install` locally to verify)

### Issue: PDF generation fails
**Test locally first:**
```bash
cd render-pdf-service
npm install
npm start
```

Then test:
```bash
curl -X POST http://localhost:10000/api/pdf/render \
  -H "Content-Type: application/json" \
  -d '{"html":"<h1>Test</h1>"}' \
  --output test.pdf
```

---

## 💡 Pro Tips

### Free Tier Cold Starts
- Service sleeps after 15 min of inactivity
- First request takes ~30 seconds to wake up
- Keep warm with cron job (optional):
  ```bash
  # Ping every 10 minutes
  */10 * * * * curl https://clinicalscribe-pdf-service.onrender.com
  ```

### Upgrade to Starter ($7/mo)
- Always on (no cold starts)
- Faster response times
- Better for production

### Monitor Service Health
Add to your monitoring:
```bash
# Health check endpoint
GET https://clinicalscribe-pdf-service.onrender.com

# Expected: 200 OK
# Response: "✅ ClinicalScribe PDF Service Online"
```

---

## ✅ You're Ready!

Everything is set up correctly. Just follow the steps above and you'll have a working PDF service in ~3 minutes! 🚀

**Next:** Click "Create Web Service" on Render and watch the logs! 👀
