# Active Sessions Counter Feature

This document explains the implementation and usage of the Active Sessions Counter feature in ClinicalScribe.

## Overview

The Active Sessions Counter displays the number of currently active recording sessions in real-time on the dashboard. This provides administrators and users with a live view of ongoing clinical documentation activities.

## Implementation Details

### 1. Firestore Rules Update

The Firestore rules have been updated to support the `isActive` field in the `patientSessions` collection:

```javascript
// ✅ Patient Sessions: only owner can access
match /patientSessions/{sessionId} {
  // Nurse can create a new session for themselves
  allow create: if request.auth != null
                && request.resource.data.patientId == request.auth.uid
                && request.resource.data.createdAt != null;

  // Nurse can read their own sessions
  allow read: if request.auth != null
              && resource.data.patientId == request.auth.uid;

  // Nurse can update their own sessions (toggle isActive, add recordings, etc.)
  allow update: if request.auth != null
                && resource.data.patientId == request.auth.uid;

  // Nurse can delete their own session (if you want to allow cleanup)
  allow delete: if request.auth != null
                && resource.data.patientId == request.auth.uid;
}
```

### 2. Session Creation

When a user navigates to the transcription page, a new patient session is automatically created with the `isActive` field set to `false`.

### 3. Recording Start/Stop

When a user starts recording:
- The `isActive` field is set to `true`
- The session appears in the active sessions count

When a user stops recording:
- The `isActive` field is set to `false`
- The session is removed from the active sessions count

### 4. Components

#### ActiveSessionsCounter Component

Located at `components/ActiveSessionsCounter.tsx`, this component:
- Queries Firestore for sessions where `isActive == true`
- Uses `onSnapshot` to listen for real-time updates
- Displays the count with a live indicator

#### Recorder Component

The Recorder component in `components/Recorder.tsx` has been updated to:
- Accept a `sessionId` prop
- Toggle the `isActive` field when recording starts/stops
- Pass the `isActive` flag when saving recordings to the backend

#### Transcription Page

The transcription page in `app/transcription/page.tsx`:
- Automatically creates a new patient session when loaded
- Passes the session ID to the Recorder component

### 5. API Routes

#### Session Recording Route

The session recording API route at `app/api/session/recording/route.ts`:
- Accepts an optional `isActive` flag in the request body
- Updates the session document with the `isActive` status

## Migration

A migration script is provided to add the `isActive` field to existing patient sessions:

```bash
npm run migrate:active-sessions
```

This script sets `isActive` to `false` for all existing sessions.

## Testing

A test script is provided to verify the active sessions functionality:

```bash
npm run test:active-sessions
```

## Deployment

### Manual Deployment

To deploy the updated Firestore rules:

```bash
npm run deploy:rules
```

### GitHub Actions Deployment

The project includes a GitHub Actions workflow that automatically deploys Firestore rules on every push to the `mvp-launch` branch.

#### Setup

1. Create a Firebase service account and download the JSON key
2. Encode the service account JSON to base64:
   ```bash
   cat service-account.json | base64
   ```
3. Add the following secrets to your GitHub repository:
   - `FIREBASE_SERVICE_ACCOUNT_BASE64`: Base64 encoded service account JSON
   - `NEXT_PUBLIC_FIREBASE_API_KEY`: Firebase API key
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`: Firebase auth domain
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`: Firebase project ID
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`: Firebase storage bucket
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`: Firebase messaging sender ID
   - `NEXT_PUBLIC_FIREBASE_APP_ID`: Firebase app ID

The workflow will automatically run tests and deploy the rules when changes are pushed to the `mvp-launch` branch.

## Usage

1. Navigate to the transcription page
2. A new patient session is automatically created
3. Start recording - the session becomes active
4. View the dashboard to see the active sessions count increase
5. Stop recording - the session becomes inactive
6. View the dashboard to see the active sessions count decrease

## Troubleshooting

If the active sessions counter is not working:

1. Verify that the Firestore rules have been deployed
2. Check that the migration script has been run
3. Ensure that the `isActive` field exists in patient session documents
4. Verify that the Recorder component is receiving a valid session ID
5. Check the browser console for any JavaScript errors
6. Verify that the Firebase configuration is correct in your environment variables