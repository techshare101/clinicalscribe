# 🚀 Render Deploy Logs - What Success Looks Like

## ✅ Healthy Deploy Log Output

When you deploy `render-pdf-service` on Render, here's **exactly** what you should see in the logs:

---

### 1️⃣ Build Phase (npm install)

```bash
==> Cloning from https://github.com/techshare101/clinicalscribe...
==> Checking out commit 5e850e5 in branch mvp-launch

==> Using Node version 20.x.x (from package.json)

==> Running build command 'npm install'...

npm WARN deprecated inflight@1.0.6: This module is not supported...
npm WARN deprecated glob@7.2.3: Glob versions prior to v9 are no longer supported

added 67 packages, and audited 68 packages in 8s

8 packages are looking for funding
  run `npm fund` for details

found 0 vulnerabilities

==> Build successful! ✅
```

**✅ What to look for:**
- `added 67 packages` (express + puppeteer dependencies)
- `found 0 vulnerabilities`
- `Build successful! ✅`

---

### 2️⃣ System Dependencies (apt.txt)

```bash
==> Installing system dependencies from apt.txt...

Reading package lists...
Building dependency tree...
Reading state information...

The following NEW packages will be installed:
  chromium libnss3 libx11-xcb1 libxcomposite1 libxdamage1 
  libxrandr2 libgbm1 libasound2 libatk1.0-0 libatk-bridge2.0-0 
  libpangocairo-1.0-0 fonts-liberation

12 newly installed packages

==> System dependencies installed successfully ✅
```

**✅ What to look for:**
- `chromium` in the installed packages list
- `fonts-liberation` installed (for PDF rendering)
- No errors about missing packages

---

### 3️⃣ Start Phase (npm start)

```bash
==> Starting service with 'npm start'...

> clinicalscribe-pdf-service@1.0.0 start
> node server.js

🚀 PDF service running on port 10000

==> Service is live at https://clinicalscribe-pdf-service.onrender.com
```

**✅ What to look for:**
- `🚀 PDF service running on port 10000`
- Service URL appears
- No crash or exit messages

---

### 4️⃣ Health Check (First Request)

When you visit `https://clinicalscribe-pdf-service.onrender.com`:

```bash
GET / 200 - - 12.345 ms
```

**Browser shows:**
```
✅ ClinicalScribe PDF Service Online
```

---

## ❌ Common Error Patterns (and what they mean)

### Error 1: Wrong Root Directory
```bash
==> Running build command 'npm run build'...
npm ERR! Missing script: "build"
```

**Fix:** You forgot to set **Root Directory** to `render-pdf-service`

---

### Error 2: Missing apt.txt
```bash
Error: Failed to launch the browser process!
/usr/bin/chromium: error while loading shared libraries: libnss3.so
```

**Fix:** `apt.txt` file is missing or not in the root directory

---

### Error 3: Wrong Start Command
```bash
==> Starting service with 'npm run start:prod'...
npm ERR! Missing script: "start:prod"
```

**Fix:** Start command should be `npm start` (not `npm run start:prod`)

---

### Error 4: Port Binding Issue
```bash
Error: listen EADDRINUSE: address already in use :::3000
```

**Fix:** Make sure `server.js` uses `process.env.PORT` (already correct in our code)

---

## 🧪 Test Your Deployed Service

### Test 1: Health Check
```bash
curl https://clinicalscribe-pdf-service.onrender.com
```

**Expected:**
```
✅ ClinicalScribe PDF Service Online
```

---

### Test 2: PDF Generation
```bash
curl -X POST https://clinicalscribe-pdf-service.onrender.com/api/pdf/render \
  -H "Content-Type: application/json" \
  -d "{\"html\":\"<h1>Test PDF</h1><p>Generated at $(date)</p>\"}" \
  --output test.pdf
```

**Expected:**
- File `test.pdf` downloads
- Size: ~5-10 KB
- Opens in PDF viewer showing "Test PDF"

---

### Test 3: Check Response Headers
```bash
curl -I -X POST https://clinicalscribe-pdf-service.onrender.com/api/pdf/render \
  -H "Content-Type: application/json" \
  -d '{"html":"<h1>Test</h1>"}'
```

**Expected headers:**
```
HTTP/2 200
content-type: application/pdf
x-render-mode: remote
content-length: 8234
```

---

## 🎯 Deploy Checklist

Before clicking "Create Web Service" on Render, verify:

- [ ] **Repository**: `techshare101/clinicalscribe`
- [ ] **Branch**: `mvp-launch`
- [ ] **Root Directory**: `render-pdf-service` ← **CRITICAL**
- [ ] **Build Command**: `npm install`
- [ ] **Start Command**: `npm start`
- [ ] **Instance Type**: Free (or Starter)

---

## 📊 Timeline Expectations

| Phase | Duration | What's Happening |
|-------|----------|------------------|
| Clone repo | 10-20s | Downloading code from GitHub |
| Install Node packages | 30-60s | `npm install` (express + puppeteer) |
| Install system packages | 60-90s | Installing Chromium + dependencies |
| Start service | 5-10s | Running `node server.js` |
| **Total** | **~2-3 min** | First deploy (subsequent deploys faster) |

---

## 🔍 Monitoring After Deploy

### Check Logs in Real-Time
1. Go to Render Dashboard
2. Click on your service
3. Click **Logs** tab
4. You'll see live output

### Verify Service Health
```bash
# Should return 200 OK
curl -I https://clinicalscribe-pdf-service.onrender.com
```

### Test PDF Endpoint
```bash
# Should generate a PDF
curl -X POST https://clinicalscribe-pdf-service.onrender.com/api/pdf/render \
  -H "Content-Type: application/json" \
  -d '{"html":"<h1>Health Check</h1>"}' \
  --output health-check.pdf
```

---

## 🚨 If Something Goes Wrong

### 1. Check Build Logs
Look for the **exact error message** in the build phase.

### 2. Common Fixes

| Error | Solution |
|-------|----------|
| "Missing script: build" | Set Root Directory to `render-pdf-service` |
| "chromium: not found" | Verify `apt.txt` exists and has correct packages |
| "Port already in use" | Use `process.env.PORT` in server.js (already done) |
| "Module not found" | Check `package.json` dependencies |

### 3. Redeploy
After fixing:
1. Push changes to GitHub
2. Render auto-deploys on new commits
3. Or click **Manual Deploy** → **Deploy latest commit**

---

## ✅ Success Indicators

You'll know it's working when you see ALL of these:

1. ✅ Build logs show `Build successful!`
2. ✅ Chromium installed without errors
3. ✅ Service starts with `🚀 PDF service running on port 10000`
4. ✅ Health check returns `✅ ClinicalScribe PDF Service Online`
5. ✅ Test PDF generates successfully
6. ✅ No crash loops in logs

---

## 🔗 Next Step: Connect to Vercel

Once you see the success indicators above:

1. Copy your Render URL:
   ```
   https://clinicalscribe-pdf-service.onrender.com
   ```

2. Add to Vercel environment variables:
   ```
   RENDER_PDF_URL=https://clinicalscribe-pdf-service.onrender.com/api/pdf/render
   ```

3. Redeploy your main ClinicalScribe app on Vercel

4. Test end-to-end:
   - Generate a SOAP note
   - Check Firestore for `renderMode: "remote"`
   - Verify PDF downloads correctly

---

## 💡 Pro Tips

### Free Tier Behavior
- Service **sleeps after 15 min** of inactivity
- First request after sleep takes **~30 seconds** (cold start)
- Subsequent requests are fast (~1-2 seconds)

### Upgrade to Starter ($7/mo)
- **Always on** (no cold starts)
- Faster response times
- Better for production use

### Keep Service Warm (Free Tier)
You can ping the health endpoint every 10 minutes:
```bash
# Add to cron job or monitoring service
curl https://clinicalscribe-pdf-service.onrender.com
```

---

**Ready to deploy?** Follow the checklist above and watch for the success indicators! 🚀
