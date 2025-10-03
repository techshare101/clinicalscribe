# GitHub Actions Setup for Firestore Rules Deployment

This document explains how to set up GitHub Actions for automatic deployment of Firestore rules.

## Prerequisites

1. A GitHub repository for your project
2. Firebase project with Firestore enabled
3. Firebase service account key

## Setup Instructions

### 1. Create Firebase Service Account

1. Go to the Firebase Console
2. Navigate to Project Settings > Service Accounts
3. Click "Generate new private key"
4. Save the JSON file securely

### 2. Add Secrets to GitHub Repository

1. Go to your GitHub repository
2. Navigate to Settings > Secrets and variables > Actions
3. Add the following secrets:

| Secret Name | Value |
|-------------|-------|
| `FIREBASE_SERVICE_ACCOUNT_BASE64` | Base64 encoded service account JSON |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase API key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase app ID |

To encode your service account JSON to base64:
```bash
cat service-account.json | base64
```

### 3. Configure the Workflow

The workflow is already configured in `.github/workflows/deploy-rules.yml`. It will:

1. Run tests on every push to the `mvp-launch` branch
2. Deploy Firestore rules if tests pass

### 4. Manual Deployment

You can also trigger the workflow manually:

1. Go to the Actions tab in your GitHub repository
2. Select "Deploy Firestore Rules"
3. Click "Run workflow"

## Environment Variables

The workflow uses the following environment variables:

- `FIREBASE_SERVICE_ACCOUNT_BASE64`: Base64 encoded service account JSON
- `NEXT_PUBLIC_FIREBASE_API_KEY`: Firebase API key
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`: Firebase auth domain
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`: Firebase project ID
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`: Firebase storage bucket
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`: Firebase messaging sender ID
- `NEXT_PUBLIC_FIREBASE_APP_ID`: Firebase app ID

## Troubleshooting

### "No currently active project" Error

If you encounter this error, ensure that:

1. `NEXT_PUBLIC_FIREBASE_PROJECT_ID` is set in your GitHub secrets
2. The deploy script is correctly using the project ID

### Permission Errors

If you encounter permission errors:

1. Verify that your service account has the necessary permissions
2. Ensure the service account key is correctly base64 encoded
3. Check that all required environment variables are set

## Customization

You can customize the workflow by modifying `.github/workflows/deploy-rules.yml`:

1. Change the branch trigger by modifying the `branches` section
2. Add additional test steps
3. Modify the deployment conditions
4. Add notifications (Slack, email, etc.)

## Security Best Practices

1. Never commit service account keys to the repository
2. Use the principle of least privilege for service accounts
3. Rotate service account keys regularly
4. Monitor deployment logs for unauthorized access