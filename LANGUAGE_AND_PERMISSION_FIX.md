# Language Detection & 403 Permission Fix

## Issues Found

### 1. **Patient Language Shows "EN" Instead of "ES" (Spanish)**
**Root Cause:** The transcribe API doesn't capture Whisper's auto-detected language.

### 2. **403 Permission Denied When Generating PDF**
**Root Cause:** Firestore rules don't allow writes to the `soapNotes` collection.

---

## ✅ **FIXES APPLIED**

### Fix #1: Updated Firestore Rules

**File:** `firestore.rules`

Added rules to allow authenticated users to write to the `soapNotes` collection:

```javascript
// SOAP Notes collection - allow users to read/write their own notes
match /soapNotes/{noteId} {
  allow read: if request.auth != null && request.auth.uid == resource.data.userId;
  allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
  allow update, delete: if request.auth != null && request.auth.uid == resource.data.userId;
}

// Transcriptions collection - allow users to read/write their own transcriptions
match /transcriptions/{userId}/chunks/{chunkId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}
```

**🚨 IMPORTANT:** You need to deploy these rules to Firebase:

```bash
firebase deploy --only firestore:rules
```

Or manually update them in Firebase Console:
1. Go to https://console.firebase.google.com/project/clinicalscribe-511e7/firestore/rules
2. Copy the rules from `firestore.rules`
3. Click "Publish"

---

### Fix #2: Capture Detected Language from Whisper

The OpenAI Whisper API returns a `language` field when it detects the language. We need to capture this.

**File to Update:** `app/api/transcribe/route.ts`

**Changes Needed:**

1. After the transcription completes (around line 119), add:
```typescript
console.log("Transcription completed:", transcription.text);

// Capture detected language from Whisper
const detectedLang = (transcription as any).language || patientLang || "en";
console.log("Detected language:", detectedLang);
```

2. Update the translation logic (around line 125):
```typescript
// Use detected language if patient language was "auto"
const effectivePatientLang = patientLang === "auto" ? detectedLang : patientLang;

// Translate to documentation language if needed  
if (effectivePatientLang !== "auto" && effectivePatientLang !== docLang) {
  console.log(`Translating from ${effectivePatientLang} to ${docLang}`);
  // ... rest of translation code
}
```

3. Update the Firestore save (around line 147):
```typescript
await sessionChunksRef.doc(`chunk-${index}`).set({
  index,
  rawTranscript: fullRawText.trim(),
  transcript: fullText.trim(),
  patientLang: effectivePatientLang,  // ← Use detected language
  docLang,
  createdAt: new Date(),
  status: 'completed'
});
```

4. Update the return statement (around line 164):
```typescript
return NextResponse.json({
  index,
  rawTranscript: fullRawText.trim(),
  transcript: fullText.trim(),
  patientLang: effectivePatientLang,  // ← Return detected language
  docLang: docLang
});
```

---

## Testing

### Test 403 Fix:
1. Deploy the Firestore rules
2. Sign in to your app
3. Generate a SOAP note
4. Click "Generate & Upload to Firestore"
5. Should see: ✅ "PDF generated and uploaded to Firestore successfully!"

### Test Language Detection:
1. Record audio in Spanish
2. Set "Patient Language" to "Auto Detect" 
3. Transcribe the audio
4. Check the logs - should see: "Detected language: es"
5. In the UI, should display: "🇪🇸 Spanish" instead of "EN"

---

## How It Works

### Before Fix:
```
Patient speaks Spanish → Whisper detects "es" but we ignore it
→ patientLang stays as "auto" → UI shows "EN" ❌
```

### After Fix:
```
Patient speaks Spanish → Whisper detects "es" → We capture it
→ patientLang becomes "es" → UI shows "🇪🇸 Spanish" ✅
```

---

## Language Code Mapping

The UI component `SOAPNotesList.tsx` already has the display mapping:

```typescript
const languageFlags: Record<string, string> = {
  auto: "🌐",
  so: "🇸🇴",  // Somali
  hmn: "🇱🇦", // Hmong
  sw: "🇰🇪",  // Swahili
  ar: "🇸🇦",  // Arabic
  en: "🇺🇸",  // English
  es: "🇪🇸",  // Spanish (add if not present)
};
```

So once we return `"es"` instead of `"auto"`, the UI will automatically show the Spanish flag and label.

---

## Additional Notes

**For Large Files:** The chunking logic also needs similar updates, but most recordings are under 25MB, so we're fixing the main path first.

**OpenAI API Types:** The official TypeScript types don't include `language` on the `Transcription` object, so we use `(transcription as any).language` to access it safely.

---

## Summary

| Fix | Status | Action Required |
|-----|--------|-----------------|
| Firestore Rules | ✅ Complete | Deploy rules to Firebase |
| Language Detection | ⏳ Pending | Update `transcribe/route.ts` |
| Testing | ⏳ Pending | Test both fixes |

Once you deploy the Firestore rules, the 403 error will be fixed immediately!
