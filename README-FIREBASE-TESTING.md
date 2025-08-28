# Firebase Admin Testing

This document explains how to test Firebase Admin services in both local and production environments.

## Updated Firebase Admin Initialization

The [lib/firebaseAdmin.ts](file:///c%3A/Users/Kodjo%20AdjeeLaa/clinicalscribe/lib/firebaseAdmin.ts) file has been updated with a production-ready version that:

1. Uses the singleton pattern to prevent re-initialization during Next.js hot reloads
2. Explicitly sets the projectId from the service account to avoid metadata server lookup issues on Vercel
3. Provides loud error reporting for immediate failure detection
4. Exports safe handles for Auth, Firestore, and Storage

## Smoke Testing

### Local Testing

To run the smoke test locally:

```bash
npm run test-firebase
```

This will test all three Firebase services:
- Auth: Lists users to verify authentication works
- Firestore: Creates and reads a test document
- Storage: Lists files in the bucket

### Production Testing

To test in production on Vercel:

1. Deploy your application
2. Visit https://your-app.vercel.app/api/test-firebase
3. You should see a JSON response with the test results
4. After verifying, you can remove the API route

## Temporary API Route

The [/pages/api/test-firebase.ts](file:///c%3A/Users/Kodjo%20AdjeeLaa/clinicalscribe/pages/api/test-firebase.ts) file provides a temporary API endpoint for production testing. This route:

1. Runs the same smoke tests as the local script
2. Returns results in JSON format
3. Can be safely removed after verification

## Next Steps

1. Run the local smoke test to verify your Firebase Admin setup
2. Deploy to Vercel
3. Visit the API route to verify production functionality
4. Remove the API route after successful verification