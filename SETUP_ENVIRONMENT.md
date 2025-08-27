# Environment Setup Guide

## 🔐 Security First

Never commit credentials to version control. All sensitive information should be stored in environment variables.

## 📁 Environment Files

- `.env.local` - Local development environment variables (gitignored)
- `.env.example` - Template for environment variables (committed to repo)

## 🔧 Setting Up Your Environment

### 1. Create Your Local Environment File

Copy the example file:

```bash
cp .env.example .env.local
```

### 2. Configure Firebase Credentials

1. Download a new service account key from Firebase Console
2. Encode it as base64 using our helper script:
   ```bash
   node scripts/encode-service-account.js path/to/service-account.json
   ```
3. Add the output to your `.env.local` file:
   ```
   FIREBASE_SERVICE_ACCOUNT_BASE64=your-encoded-service-account-here
   ```

### 3. Configure Other Services

Replace all placeholder values in `.env.local` with your actual credentials:
- OpenAI API key
- Stripe keys
- SMART on FHIR credentials

## 🚀 Deployment

When deploying to production, set the same environment variables in your deployment platform:
- Vercel: Project Settings > Environment Variables
- Netlify: Site settings > Build & deploy > Environment
- Heroku: Settings > Config Vars

## 🔍 Verification

Test your environment setup:

```bash
node scripts/test-firebase-config.js
```

## 🛡️ Security Best Practices

1. Never commit `.env.local` to version control
2. Rotate credentials regularly
3. Use different service accounts for development and production
4. Monitor for unauthorized usage
5. Revoke compromised keys immediately

## 🆘 If You've Committed Credentials

If you've accidentally committed credentials:

1. Immediately generate new keys
2. Revoke the compromised keys
3. Update all environment variables
4. Consider the credentials compromised and monitor for unauthorized usage