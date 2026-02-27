# Vercel Deployment Setup Guide

This guide explains how to configure your ClinicalScribe application for deployment on Vercel.

## 🔧 Environment Variables Setup

For your application to work correctly on Vercel, you need to set up environment variables in the Vercel dashboard.

### 1. Access Vercel Environment Variables

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your ClinicalScribe project
3. Go to Settings > Environment Variables

### 2. Required Environment Variables

Add the following environment variables:

#### Firebase Configuration
```
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-firebase-auth-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-firebase-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-firebase-storage-bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-firebase-messaging-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-firebase-app-id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your-firebase-measurement-id

FIREBASE_STORAGE_BUCKET=your-firebase-storage-bucket
```

#### Firebase Admin Service Account
```
FIREBASE_SERVICE_ACCOUNT_BASE64=your-base64-encoded-service-account
```

To generate the FIREBASE_SERVICE_ACCOUNT_BASE64:
1. Generate a service account key from Firebase Console
2. Encode it as base64 using our script:
   ```bash
   node scripts/encode-firebase-key.js path/to/service-account.json
   ```
3. Copy the output and paste it as the value

#### Application URL
```
NEXT_PUBLIC_APP_URL=https://your-vercel-app.vercel.app
```

#### OpenAI API Key (if using AI features)
```
OPENAI_API_KEY=your-openai-api-key
```

#### Stripe Configuration (if using payments)
```
NEXT_PUBLIC_STRIPE_LINK_BETA=your-stripe-beta-link
NEXT_PUBLIC_STRIPE_LINK_PRO_MONTHLY=your-stripe-pro-monthly-link
NEXT_PUBLIC_STRIPE_LINK_PRO_YEARLY=your-stripe-pro-yearly-link
NEXT_PUBLIC_STRIPE_LINK_TEAM_MONTHLY=your-stripe-team-monthly-link
NEXT_PUBLIC_STRIPE_LINK_TEAM_YEARLY=your-stripe-team-yearly-link
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret
```

#### SMART on FHIR Configuration (if using EHR integration)
```
NEXT_PUBLIC_SMART_CLIENT_ID=your-smart-client-id
SMART_CLIENT_SECRET=your-smart-client-secret
NEXT_PUBLIC_BASE_URL=https://your-vercel-app.vercel.app
SMART_REDIRECT_PATH=/api/smart/callback
SMART_AUTH_URL=https://fhir.epic.com/interconnect-fhir-oauth/oauth2/authorize
SMART_TOKEN_URL=https://fhir.epic.com/interconnect-fhir-oauth/oauth2/token
SMART_SCOPES=openid fhirUser offline_access patient/*.read patient/*.write DocumentReference.Create
SMART_ISSUER=https://fhir.epic.com/interconnect-fhir-oauth/oauth2
SMART_FHIR_BASE=https://fhir.epic.com/interconnect-fhir-oauth/api/FHIR/R4
```

### 3. Environment Targeting

For each environment variable, make sure to check both:
- ✅ Production
- ✅ Development

This ensures the variables are available in both environments.

## 🚀 Deployment Process

### 1. Automatic Deployments

If your repository is connected to Vercel:
1. Push changes to your GitHub repository
2. Vercel will automatically detect and deploy changes

### 2. Manual Deployments

To manually trigger a deployment:
1. Go to your Vercel project dashboard
2. Click "Deployments" in the sidebar
3. Click "Create Deployment"
4. Select the branch you want to deploy

## 🔍 Troubleshooting

### Common Issues

#### "Firebase Admin initialization failed" on Vercel

This usually happens when the FIREBASE_SERVICE_ACCOUNT_BASE64 is not properly set in Vercel environment variables.

**Solution:**
1. Verify the environment variable is set in Vercel dashboard
2. Make sure it's checked for both Production and Development
3. Redeploy your application

#### "Missing or insufficient permissions" errors

This can happen if:
1. Firestore rules are not deployed
2. Service account doesn't have proper permissions

**Solution:**
1. Deploy Firestore rules:
   ```bash
   node scripts/deploy-firestore-rules.js
   ```
2. Check service account permissions in Firebase Console

#### Environment variables not loading

**Solution:**
1. Check that variable names exactly match (case-sensitive)
2. Ensure variables are checked for the correct environments
3. Redeploy after making changes

### Checking Deployment Logs

To debug deployment issues:
1. Go to your Vercel project dashboard
2. Click "Deployments" in the sidebar
3. Select the deployment you want to inspect
4. Click "View Logs" to see detailed logs

## 🔐 Security Best Practices

1. **Never hardcode sensitive values** - Always use environment variables
2. **Regularly rotate credentials** - Update API keys periodically
3. **Limit service account permissions** - Only grant necessary permissions
4. **Monitor usage** - Check logs for unusual activity
5. **Use separate service accounts** - Different accounts for development and production

## 🔄 Sync with GitHub

To ensure your local changes sync with Vercel:
1. Commit and push changes to your GitHub repository
2. Vercel will automatically deploy the latest changes
3. Environment variables in Vercel dashboard take precedence over code changes

## 📞 Support

If you encounter issues:
1. Check the [Firebase Service Account Guide](FIREBASE_SERVICE_ACCOUNT_GUIDE.md)
2. Review Vercel documentation
3. Check application logs in Vercel dashboard
4. Contact support if needed