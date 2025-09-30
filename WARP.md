# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

ClinicalScribe is a Next.js application built with Firebase for authentication and data storage. The application includes features for patient management, transcription handling, and SOAP note generation, with a strong focus on security and proper credential management.

## Development Environment

### Prerequisites
- Node.js
- pnpm
- Firebase project access
- Environment variables configured (see Environment Setup section)

### Key Commands

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Run tests
pnpm test

# QA Testing
# For Windows
pnpm run qa:cards:ps
# For Linux/macOS
pnpm run qa:cards:sh

# Manage Demo Data
pnpm run seed-demo        # Seed all demo data
pnpm run seed-soap-demo   # Seed SOAP History demo data
pnpm run check-soap-notes # Check existing SOAP notes
pnpm run clear-demo      # Clear all demo data
```

## Project Architecture

### Key Technology Stack
- Next.js 15.2.4
- Firebase (Authentication, Firestore, Storage)
- OpenAI API
- Stripe Integration
- TypeScript
- TailwindCSS
- Radix UI Components
- Framer Motion

### Core Components and Services

1. **Authentication Layer**
   - Firebase Authentication
   - User permissions managed through Firestore rules
   - Admin role functionality

2. **Data Storage**
   - Firestore for structured data
   - Firebase Storage for large files
   - Collection structure follows user-centric security model

3. **API Integration**
   - OpenAI for AI processing
   - Stripe for payment processing
   - SMART on FHIR integration

### Security Model

The application follows a strict security model:
- Default deny-all Firestore rules
- User-specific document access control
- Separate service accounts for development/production
- Environment variable-based credential management

## Environment Setup

Critical environment variables needed:
- `FIREBASE_SERVICE_ACCOUNT_BASE64`: Base64 encoded Firebase service account
- OpenAI API credentials
- Stripe API keys
- SMART on FHIR credentials

Never commit sensitive credentials to version control. Use `.env.local` for local development and configure deployment platform environment variables for production.

## Common Tasks

### Adding New Features
1. Review existing components in `/components` directory
2. Follow established patterns for Firebase interactions
3. Update Firestore security rules if adding new collections
4. Add necessary environment variables to `.env.example`

### Troubleshooting

#### Firebase Issues
- Check service account configuration
- Verify Firestore rules deployment
- Confirm environment variables are properly set
- Use `pnpm test:firebase` for connection testing

#### Permission Issues
- Review Firestore rules in `firestore.rules`
- Check user authentication state
- Verify service account permissions
- Run `pnpm test:permissions` to validate

## Deployment

The application is deployed on Vercel. Environment variables must be configured in the Vercel dashboard for production deployments.