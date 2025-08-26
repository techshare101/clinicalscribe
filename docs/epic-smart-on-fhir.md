# Epic SMART on FHIR Integration

This document explains the implementation of Epic SMART on FHIR integration in the Clinical Scribe application.

## Components

### 1. ConnectToEHRButton Component

A React component that initiates the SMART on FHIR authorization flow with Epic.

Location: `components/ConnectToEHRButton.tsx`

Features:
- Builds the correct authorize URL from environment variables
- Uses PKCE flow for secure authorization
- Redirects to Epic's login screen
- Handles CSRF protection with state parameter

### 2. SMART Callback Route

Handles the authorization code exchange for access and refresh tokens.

Location: `app/api/smart/callback/route.ts`

Process:
1. Receives authorization code from Epic
2. Exchanges code for access and refresh tokens
3. Stores tokens in secure cookies
4. Redirects user back to the application

### 3. Post DocumentReference Route

Sends clinical documents to Epic as FHIR DocumentReference resources.

Location: `app/api/smart/post-document-reference/route.ts`

Process:
1. Retrieves stored access token
2. Loads clinical report data
3. Constructs FHIR DocumentReference resource
4. Posts to Epic FHIR endpoint

## Environment Variables

The following environment variables are required for SMART on FHIR integration:

```env
NEXT_PUBLIC_SMART_CLIENT_ID=your_client_id
SMART_CLIENT_SECRET=your_client_secret
SMART_REDIRECT_PATH=http://localhost:3000/api/smart/callback
SMART_SCOPES="openid fhirUser offline_access patient/.read patient/.write DocumentReference.Create"
SMART_ISSUER=https://fhir.epic.com/interconnect-fhir-oauth/oauth2
SMART_FHIR_BASE=https://fhir.epic.com/interconnect-fhir-oauth/api/FHIR/R4
```

## Integration Flow

1. User clicks "Connect to EHR" button
2. Application redirects to Epic's authorization server
3. User authenticates with Epic
4. Epic redirects back to callback URL with authorization code
5. Application exchanges code for access token
6. Application stores token for future API calls
7. User can now export clinical documents to Epic

## Required Epic App Permissions

Ensure your Epic app has the following permissions enabled:
- DocumentReference.Read
- DocumentReference.Create
- Encounter.Read
- Patient.Read

## Testing

To test the integration:

1. Ensure all environment variables are set correctly
2. Navigate to the EHR Sandbox page
3. Click the "Connect to EHR" button
4. Complete the Epic authentication flow
5. Verify connection status shows as connected
6. Create a clinical document
7. Use the export functionality to send to Epic