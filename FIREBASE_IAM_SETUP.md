# Firebase Service Account IAM Configuration

This document provides instructions for configuring the Firebase service account with least privilege permissions for the ClinicalScribe application.

## Service Account

The service account that needs to be configured is:
```
firebase-adminsdk-fbsvc@clinicalscribe-511e7.iam.gserviceaccount.com
```

## Required Roles

The service account needs the following roles for ClinicalScribe to function properly:

1. **Service Usage Consumer** (`roles/serviceusage.serviceUsageConsumer`)
   - Lets the service account call Google APIs (required for any Firebase service)

2. **Firebase Authentication Admin** (`roles/firebaseauth.admin`)
   - Required to mint session cookies and manage user sessions

3. **Firebase Admin SDK Administrator Service Agent** (`roles/firebase.sdkAdminServiceAgent`)
   - Needed for Firebase Admin SDK operations across Auth, Firestore, etc.

4. **Cloud Firestore User** (`roles/datastore.user`)
   - Allows the service account to read/write documents in Firestore

5. **Storage Admin** (`roles/storage.admin`)
   - Required for storing signed PDFs (like SOAP note exports) in Firebase Storage

## Applying the Policy

### Option 1: Using gcloud CLI

1. First, apply the least privilege policy:
```bash
gcloud projects set-iam-policy clinicalscribe-511e7 firebase-service-account-policy.yaml
```

2. Then, clean up any overly permissive roles:
```bash
gcloud projects set-iam-policy clinicalscribe-511e7 firebase-service-account-rollback.yaml
```

### Option 2: Using Google Cloud Console

1. Go to the [IAM & Admin Console](https://console.cloud.google.com/iam-admin/iam?project=clinicalscribe-511e7)
2. Find the service account: `firebase-adminsdk-fbsvc@clinicalscribe-511e7.iam.gserviceaccount.com`
3. Click the pencil icon to edit
4. Remove any overly permissive roles (Owner, Editor, Viewer)
5. Add the required roles listed above

## Verification

After applying the policies, you can verify the roles assigned to the service account:

```bash
gcloud projects get-iam-policy clinicalscribe-511e7 \
  --flatten="bindings[].members" \
  --format="table(bindings.role)" \
  --filter="bindings.members:firebase-adminsdk-fbsvc@clinicalscribe-511e7.iam.gserviceaccount.com"
```

## HIPAA Compliance

This least privilege configuration is important for HIPAA compliance as it ensures that the service account only has the minimum permissions necessary to perform its functions, reducing the risk of unauthorized access to protected health information.

## Troubleshooting

If you encounter permission errors after applying these policies, ensure that:

1. All required roles have been added
2. Any overly permissive roles have been removed
3. The changes have propagated (this can take a few minutes)
4. The service account key has been properly configured in your environment variables

## Additional Security Recommendations

1. Rotate the service account key regularly
2. Monitor the service account activity using Cloud Audit Logs
3. Consider using more granular permissions for Storage if you only need access to specific buckets