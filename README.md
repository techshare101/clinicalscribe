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