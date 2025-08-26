# Firestore Rules Documentation

## Overview

This document explains the Firestore security rules implementation for ClinicalScribe, including the structure, testing, and deployment procedures.

## Rules Structure

The Firestore rules are defined in `firestore.rules` and include:

1. **Profiles**: Each user can only read/write their own profile document
2. **SOAP Notes**: Documents must belong to the user (userId field)
3. **Reports**: Documents must belong to the user (userId field)
4. **Patient Sessions**: Documents must belong to the user (patientId field)
5. **Generic Sessions**: Documents must belong to the user (userId field)

## Key Security Features

- Users can only access documents that belong to them
- Admin users have read-only access to all profiles
- All documents must have a `createdAt` field when created
- Field-level access control based on user ID matching

## Testing

To test the Firestore rules locally:

```bash
npm run test:rules
```

This runs the `scripts/test-firestore-permissions.js` script which verifies:
- Users can only access their own documents
- Admin users have appropriate read access
- Cross-user access is properly denied

## Deployment

To deploy the Firestore rules to production:

```bash
npm run deploy:rules
```

This runs the `scripts/deploy-rules.js` script which deploys the rules using the Firebase CLI.

## Field Usage

The rules expect specific fields for ownership verification:

- **Profiles**: `uid` field matching the document ID
- **SOAP Notes**: `userId` field matching the authenticated user ID
- **Reports**: `userId` field matching the authenticated user ID
- **Patient Sessions**: `patientId` field matching the authenticated user ID
- **Generic Sessions**: `userId` field matching the authenticated user ID

Components have been updated to query using these fields while maintaining backward compatibility with legacy field names.