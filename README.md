# ClinicalScribe UI

*Automatically synced with your [v0.dev](https://v0.dev) deployments*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/valentin2v2000s-projects/v0-clinical-scribe-ui)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.dev-black?style=for-the-badge)](https://v0.dev/chat/projects/6NRlmsyrKuE)

## Overview

This repository will stay in sync with your deployed chats on [v0.dev](https://v0.dev).
Any changes you make to your deployed app will be automatically pushed to this repository from [v0.dev](https://v0.dev).

## 🔐 Security Notice

This project requires sensitive credentials for Firebase, OpenAI, and other services. **Never commit credentials to version control.**

For proper environment setup, see:
- [SETUP_ENVIRONMENT.md](SETUP_ENVIRONMENT.md)
- [FIREBASE_SERVICE_ACCOUNT_GUIDE.md](FIREBASE_SERVICE_ACCOUNT_GUIDE.md)

## Deployment

Your project is live at:

**[https://vercel.com/valentin2v2000s-projects/v0-clinical-scribe-ui](https://vercel.com/valentin2v2000s-projects/v0-clinical-scribe-ui)**

For Vercel deployment setup, see:
- [VERCEL_SETUP.md](VERCEL_SETUP.md)

## Build your app

Continue building your app on:

**[https://v0.dev/chat/projects/6NRlmsyrKuE](https://v0.dev/chat/projects/6NRlmsyrKuE)**

## How It Works

1. Create and modify your project using [v0.dev](https://v0.dev)
2. Deploy your chats from the v0 interface
3. Changes are automatically pushed to this repository
4. Vercel deploys the latest version from this repository

## 🛠️ Environment Setup

1. Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```

2. Configure your credentials in `.env.local` (see [SETUP_ENVIRONMENT.md](SETUP_ENVIRONMENT.md))

3. Never commit `.env.local` to version control (it's already in `.gitignore`)

## 🚀 Local Development

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Start the development server:
   ```bash
   pnpm dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## 🧪 Testing

Run the test suite:
```bash
pnpm test
```

Run QA scripts:
```bash
# Linux/macOS
pnpm run qa:cards:sh

# Windows
pnpm run qa:cards:ps
```

## 🌱 Demo Data Seeding

Seed all demo data (including patients, transcripts, SOAP notes, etc.):
```bash
pnpm run seed-demo
```

Seed specific demo data for the SOAP History page:
```bash
pnpm run seed-soap-demo
```

Check what SOAP notes exist in the database:
```bash
pnpm run check-soap-notes
```

Clear all demo data:
```bash
pnpm run clear-demo
```

You can also seed demo data directly from the Admin Panel by clicking the "Seed SOAP History Demo Data" button.

## 📦 Build for Production

```bash
pnpm build
```

## 🔄 Vercel Deployment

For Vercel deployment instructions, see [VERCEL_SETUP.md](VERCEL_SETUP.md)

Environment variables must be set in the Vercel dashboard for production deployment.

## 🛡️ Security Best Practices

1. Never commit `.env.local` to version control
2. Rotate credentials regularly
3. Use different service accounts for development and production
4. Monitor for unauthorized usage
5. Revoke compromised keys immediately

## 🆘 Troubleshooting

Common issues and solutions:

### Firebase Admin Initialization Failed

1. Ensure `FIREBASE_SERVICE_ACCOUNT_BASE64` is properly set in `.env.local`
2. Use the provided script to encode your service account:
   ```bash
   node scripts/encode-firebase-key.js path/to/service-account.json
   ```
3. For Vercel deployment, ensure the environment variable is set in the Vercel dashboard

### Missing or Insufficient Permissions

1. Check that Firestore rules are deployed:
   ```bash
   node scripts/deploy-firestore-rules.js
   ```
2. Verify service account permissions in Firebase Console

### Environment Variables Not Loading

1. Check that variable names exactly match (case-sensitive)
2. Restart the development server after making changes
3. For Vercel, ensure variables are checked for the correct environments