# 🔧 Fix: Storage Access Error + Chromium Library Error

## 🐛 Two Separate Issues Detected

### Issue 1: "Access to storage is not allowed from this context"
**Location:** Browser console (client-side)  
**Cause:** Chrome extension or browser security context blocking Firebase Storage

### Issue 2: "libnss3.so: cannot open shared object file"
**Location:** Render service logs  
**Cause:** Render hasn't installed system dependencies yet

---

## ✅ Fix #1: Storage Access Error (Client-Side)

### Root Cause
This error appears when:
1. Browser extension interferes with Firebase Storage
2. Third-party cookies are blocked
3. Storage is accessed before auth is ready

### Solution A: Check Browser Extensions

**Disable extensions temporarily:**
1. Open Chrome DevTools (F12)
2. Go to **Application** tab → **Storage**
3. Check if "Block third-party cookies" is enabled
4. Try in **Incognito mode** (extensions disabled by default)

If it works in Incognito, a browser extension is interfering.

### Solution B: Ensure Auth is Ready Before Storage Access

Your Firebase init looks good, but let's add a guard to ensure auth is ready:

**Create a new hook: `hooks/useFirebaseReady.ts`**

```typescript
import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export function useFirebaseReady() {
  const [isReady, setIsReady] = useState(false);
  const [user, setUser] = useState(auth.currentUser);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsReady(true);
    });

    return () => unsubscribe();
  }, []);

  return { isReady, user };
}
```

**Use it in your component before accessing storage:**

```typescript
import { useFirebaseReady } from '@/hooks/useFirebaseReady';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes } from 'firebase/storage';

export function MyComponent() {
  const { isReady, user } = useFirebaseReady();

  const uploadPDF = async (blob: Blob) => {
    // ✅ Guard: Don't access storage until auth is ready
    if (!isReady || !user) {
      console.error('Cannot upload: User not authenticated');
      return;
    }

    const fileRef = ref(storage, `pdfs/${user.uid}/document.pdf`);
    await uploadBytes(fileRef, blob);
  };

  if (!isReady) {
    return <div>Loading...</div>;
  }

  return <button onClick={() => uploadPDF(myBlob)}>Upload PDF</button>;
}
```

### Solution C: Check Storage Rules

Your `storage.rules` looks correct:

```
match /pdfs/{uid}/{allPaths=**} {
  allow read, write: if isSignedIn() && (request.auth.uid == uid || isAdmin());
}
```

This requires:
- ✅ User must be signed in
- ✅ User can only access their own PDFs (or admin can access all)

**Verify rules are deployed:**
```bash
firebase deploy --only storage
```

---

## ✅ Fix #2: Chromium Library Error (Render Service)

### Root Cause
```
/tmp/chromium: error while loading shared libraries: libnss3.so: cannot open shared object file
```

This means Render's Puppeteer can't find required system libraries.

### Why This Happens

Your `apt.txt` is **correct** and in the right location:
```
render-pdf-service/apt.txt ✅
```

**BUT** Render may not have picked it up if:
1. The service was deployed before `apt.txt` was added
2. Render cached the old build
3. Root Directory wasn't set correctly

### Solution: Force Redeploy with Clear Cache

#### Step 1: Verify Root Directory Setting

**In Render Dashboard:**
1. Go to your service: `clinicalscribe-pdf-service`
2. Click **Settings**
3. Scroll to **Build & Deploy**
4. Verify **Root Directory** is set to: `render-pdf-service`

If it's blank or wrong, set it to `render-pdf-service` and save.

#### Step 2: Clear Build Cache and Redeploy

**Option A - Dashboard (Recommended):**
1. Go to **Manual Deploy** section
2. Click **Clear build cache & deploy**
3. Wait for deployment (~3 minutes)

**Option B - Git Push:**
```bash
# Make a trivial change to force rebuild
cd render-pdf-service
echo "# Force rebuild" >> README.md
git add .
git commit -m "fix: force render rebuild with apt packages"
git push
```

#### Step 3: Verify in Logs

After redeploying, check the Render logs. You should see:

```
==> Installing packages from apt.txt...
Reading package lists...
Building dependency tree...
The following NEW packages will be installed:
  chromium libnss3 libx11-xcb1 libxcomposite1 libxdamage1 
  libxrandr2 libgbm1 libasound2 libatk1.0-0 libatk-bridge2.0-0 
  libpangocairo-1.0-0 fonts-liberation
12 newly installed

==> Starting service with 'npm start'...
🚀 PDF service running on port 10000
```

**Key indicators:**
- ✅ "Installing packages from apt.txt"
- ✅ "chromium" and "libnss3" in installed packages
- ✅ "PDF service running on port 10000"

---

## 🧪 Test After Fixes

### Test 1: Render Service Health

```powershell
# Health check
curl https://clinicalscribe-pdf-service.onrender.com

# Expected: ✅ ClinicalScribe PDF Service Online
```

### Test 2: Generate Test PDF via Render

```powershell
curl -X POST https://clinicalscribe-pdf-service.onrender.com/api/pdf/render `
  -H "Content-Type: application/json" `
  -d "{`"html`":`"<h1>Test PDF</h1><p>Generated at $(Get-Date)</p>`"}" `
  --output test-render.pdf
```

**Expected:**
- File `test-render.pdf` downloads
- Size: ~5-10 KB
- Opens in PDF viewer

### Test 3: Full End-to-End in Your App

1. Open your app in **Incognito mode** (to rule out extensions)
2. Sign in as a nurse
3. Generate a SOAP note with PDF
4. Check browser console for errors
5. Verify PDF downloads successfully

---

## 🔍 Debugging Commands

### Check if Storage is Accessible

Add this to your component:

```typescript
import { storage, auth } from '@/lib/firebase';
import { ref, listAll } from 'firebase/storage';

const testStorage = async () => {
  try {
    console.log('Auth user:', auth.currentUser?.uid);
    const storageRef = ref(storage, `pdfs/${auth.currentUser?.uid}`);
    const result = await listAll(storageRef);
    console.log('✅ Storage accessible, files:', result.items.length);
  } catch (error) {
    console.error('❌ Storage error:', error);
  }
};
```

### Check Render Service Logs

**In Render Dashboard:**
1. Click on your service
2. Click **Logs** tab
3. Look for:
   - ✅ "Installing packages from apt.txt"
   - ✅ "PDF service running on port 10000"
   - ❌ Any "error while loading shared libraries" errors

---

## 📊 Expected Results After Fixes

### Browser Console (No Errors)
```
Firebase Config: Object
Firebase auth initialized
Firebase storage initialized
Firebase firestore initialized
✅ Redirecting authenticated user to dashboard
```

### Render Logs (Successful Deploy)
```
==> Installing packages from apt.txt...
chromium libnss3 libx11-xcb1 ... installed
==> Build successful 🎉
🚀 PDF service running on port 10000
==> Your service is live 🎉
```

### PDF Generation (Success)
```
[POST] /api/pdf/render
✅ Remote PDF generation successful
renderMode: remote-render
PDF uploaded to Firebase Storage
```

---

## 🚨 If Issues Persist

### Storage Error Still Happening?

1. **Check browser:**
   - Try Incognito mode
   - Disable all extensions
   - Clear browser cache

2. **Check auth state:**
   ```typescript
   console.log('Auth ready:', !!auth.currentUser);
   console.log('User UID:', auth.currentUser?.uid);
   ```

3. **Check storage rules:**
   ```bash
   firebase deploy --only storage
   ```

### Chromium Error Still Happening?

1. **Verify apt.txt location:**
   ```bash
   git ls-files render-pdf-service/apt.txt
   # Should show: render-pdf-service/apt.txt
   ```

2. **Check Render settings:**
   - Root Directory: `render-pdf-service` ✅
   - Build Command: `npm install` ✅
   - Start Command: `npm start` ✅

3. **Force clean rebuild:**
   - Render Dashboard → Manual Deploy → Clear build cache & deploy

---

## ✅ Success Checklist

After applying fixes:

- [ ] Browser console shows no "Access to storage" errors
- [ ] Render logs show "Installing packages from apt.txt"
- [ ] Render logs show "PDF service running on port 10000"
- [ ] Test PDF generates successfully via Render endpoint
- [ ] Full end-to-end test passes in your app
- [ ] PDF downloads and opens correctly

---

## 🎯 Quick Fix Summary

| Issue | Fix | How to Verify |
|-------|-----|---------------|
| Storage access error | Use auth guard before storage calls | No console errors |
| Chromium library error | Clear Render cache & redeploy | Logs show apt.txt install |
| Both issues | Apply both fixes above | End-to-end test passes |

---

**Ready to fix?** Start with the Render redeploy (easier), then test storage access in Incognito mode! 🚀
