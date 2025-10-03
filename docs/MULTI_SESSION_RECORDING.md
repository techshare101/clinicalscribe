# Multi-Session Recording with Auto-Combine

This document describes the implementation of multi-session recording with auto-combine functionality in ClinicalScribe.

## Feature Overview

The multi-session recording feature enables:

1. Recording multiple audio segments in a single patient session
2. Viewing all recordings with timestamps and transcripts in the session detail page
3. Playing back audio recordings with secure signed URLs
4. Combining multiple recordings into a final SOAP note (manually or automatically)
5. Auto-combining recordings when the total session duration exceeds 120 minutes
6. Displaying clear UI indicators when auto-combine happens
7. Providing retry options if auto-combine fails

## Architecture

### Data Model

**PatientSession**
```typescript
interface PatientSession {
  id: string;
  patientName?: string;
  encounterType?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  totalDuration: number; // in seconds
  recordings: Recording[];
  finalSoap?: SOAPNote;
  transcript?: string; // Legacy field
  soapNote?: string; // Legacy field
  autoCombined?: boolean; // Whether this session was auto-combined
  autoCombinedAt?: string; // When auto-combine happened
}
```

**Recording**
```typescript
interface Recording {
  id: string;
  transcript: string;
  timestamp: Timestamp;
  audioUrl: string; // Storage path
  duration: number; // in seconds
}
```

### Components

1. **Recorder Component** - Records audio, uploads to Firebase Storage, and saves path + duration
2. **RecordingsList Component** - Displays recordings with playback options
3. **Patient Session Detail Page** - Comprehensive view of session data
4. **AutoCombineBanner Component** - Shows when a session has been auto-combined
5. **AutoCombineRetry Component** - Allows retrying failed auto-combines
6. **Storage API** - Provides signed URLs for secure audio playback
7. **SOAP Combine API** - Merges multiple recordings into a structured SOAP note

### Auto-Combine Logic

The system automatically combines recordings into a final SOAP note when:
- Total session duration exceeds 120 minutes (7200 seconds)
- No finalSoap has been generated yet

This happens in the session recording API when a new recording pushes the total duration over the threshold.

### User Feedback for Auto-Combine

To ensure nurses understand when auto-combine has occurred:

1. A banner appears on the session detail page
2. The dashboard shows an "Auto-Combined" tag on applicable sessions
3. The banner provides a link to jump directly to the SOAP note
4. If auto-combine fails, a retry button is provided

## Implementation Details

### Recorder Component
- Tracks recording duration with a timer
- Uploads audio files to Firebase Storage
- Stores path instead of direct download URLs

### RecordingsList Component
- Shows transcript snippets with timestamps
- Provides audio playback using signed URLs
- Includes combine button for manual merging

### Session Detail Page
- Fetches signed URLs for audio playback
- Displays all session recordings
- Shows combined SOAP note when available

### API Routes
- `/api/session/recording` - Saves recordings and triggers auto-combine
- `/api/soap/combine` - Merges recordings into a SOAP note
- `/api/storage/audio-url` - Generates signed URLs for audio playback

## Testing

Run the QA script to test the full workflow:
```
node scripts/qa-recording-workflow.js
```

To test auto-combine functionality:
1. Create multiple recordings
2. Verify session recordings appear in session detail page
3. Either:
   - Manually set totalDuration to just under 7200 seconds in Firestore
   - Create enough recordings to exceed 120 minutes
4. Verify auto-combine triggers and creates a final SOAP note