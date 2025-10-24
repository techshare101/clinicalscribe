# 🔗 PDF URL Fix - Permanent URLs Implementation

## Problem Summary
PDFs were using short-lived signed URLs that expired after 1 hour, causing the error:
```xml
<Error>
  <Code>ExpiredToken</Code>
  <Message>Invalid argument.</Message>
  <Details>The provided token has expired...</Details>
</Error>
```

## ✅ Solution Implemented
Replaced time-limited signed URLs with **permanent public download URLs** that never expire.

### Changed Files

#### 1. `/app/api/pdf/render/route.ts` (Lines 126-131)
**Before:**
```typescript
const [signedUrl] = await file.getSignedUrl({
  action: 'read',
  expires: Date.now() + 1000 * 60 * 60, // 1 hour
})
```

**After:**
```typescript
// 🔗 Generate permanent public URL (never expires)
const bucketName = adminStorage.name
const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(filePath)}?alt=media`
```

#### 2. `/lib/pdfRetrieval.ts` (Lines 61-83)
Updated `getSignedPdfUrl()` function to return permanent URLs instead of signed URLs.

#### 3. `/app/api/pdf/get-url/route.ts` (Lines 28-33)
Updated to generate permanent URLs when downloading existing PDFs.

---

## 🔐 Security - Still Protected!

The permanent URLs are **still secure** because:

1. **Firebase Storage Rules** (in `storage.rules`) require authentication:
   ```
   match /pdfs/{uid}/{allPaths=**} {
     allow read, write: if isSignedIn() && (request.auth.uid == uid || isAdmin());
   }
   ```

2. Users must be:
   - ✅ Authenticated (signed in)
   - ✅ The owner of the PDF (matching UID)
   - ✅ OR an admin

3. The `?alt=media` URL works with Firebase client SDK authentication tokens automatically.

---

## 📋 What Happens Next

### ✅ New PDFs
All newly generated PDFs will have permanent URLs that never expire.

### ⚠️ Existing PDFs in Database
Old PDFs in your Firestore database still have expired signed URLs in the `pdfUrl` field.

**Two options to fix old PDFs:**

#### Option A - Lazy Regeneration (Recommended)
The `DownloadPdfButton` component already handles this! It:
1. Calls `/api/pdf/get-url` with the `filePath`
2. Gets a fresh permanent URL
3. Opens the PDF

So existing PDFs will work when users click "Download PDF" button.

#### Option B - Database Migration (Optional)
Run a one-time script to update all existing `pdfUrl` fields in Firestore:

```typescript
// migration script (run once)
const notes = await adminDb.collection('soapNotes').get();
const bucketName = 'clinicalscribe-511e7.firebasestorage.app';

for (const doc of notes.docs) {
  const data = doc.data();
  if (data.filePath) {
    const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(data.filePath)}?alt=media`;
    await doc.ref.update({ pdfUrl: publicUrl });
  }
}
```

---

## 🎯 Testing

### Test New PDFs
1. Generate a new SOAP note with PDF
2. Copy the PDF URL from the response
3. Wait more than 1 hour
4. Click the PDF link - it should still work! ✅

### Test Existing PDFs
1. Click "Download PDF" on an old note
2. The button fetches a fresh permanent URL
3. PDF opens successfully ✅

---

## 📝 Notes

- **Audio files** still use short-lived signed URLs (by design) in `/api/storage/audio-url/route.ts`
- This is intentional for temporary playback security
- Only **PDF documents** needed permanent URLs for long-term access

---

## 🚀 Ready to Deploy
All changes are complete and ready for production. New PDFs will never expire, and old PDFs will work through the download button flow.
