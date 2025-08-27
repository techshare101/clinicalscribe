# Firebase Service Account Security Guide

## ⚠️ Security Warning

Never hardcode service account credentials in your source code or commit them to version control. This is a major security risk that could lead to unauthorized access to your Firebase project.

## ✅ Proper Way to Handle Service Account Credentials

### 1. Generate a New Service Account Key

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to Project Settings > Service Accounts
4. Click "Generate new private key"
5. Save the JSON file in a secure location (do NOT commit this file)

### 2. Encode the Service Account as Base64

Use the provided script to encode your service account:

```bash
node scripts/encode-firebase-key.js path/to/your/service-account.json
```

This will output a base64 encoded string that you can safely use in your environment variables.

Alternatively, you can manually encode it using command line tools:

**On Windows (PowerShell):**
```powershell
$base64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes("path\to\your\service-account.json"))
Write-Output $base64
```

**On macOS/Linux:**
```bash
base64 -i path/to/your/service-account.json -o encoded.txt
cat encoded.txt
```

### 3. Set Environment Variables

#### For Local Development

Add the base64 string to your `.env.local` file:

```
FIREBASE_SERVICE_ACCOUNT_BASE64=your-base64-encoded-string-here
```

Make sure the value is on a single line with no line breaks or extra spaces.

#### For Production Deployment (Vercel)

Set the environment variable in your Vercel project:

1. Go to your Vercel dashboard
2. Select your project
3. Go to Settings > Environment Variables
4. Add a new environment variable:
   - Name: `FIREBASE_SERVICE_ACCOUNT_BASE64`
   - Value: Your base64 encoded service account string
   - Check "Production" and "Development" environments

### 4. Using the Service Account in Code

The application will automatically decode and use the service account:

```javascript
const serviceAccount = JSON.parse(
  Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8')
);
```

## 🔒 Best Practices

1. **Never commit credentials**: Always use environment variables
2. **Rotate keys regularly**: Generate new service account keys periodically
3. **Limit permissions**: Only grant necessary permissions to service accounts
4. **Use different accounts**: Use separate service accounts for development and production
5. **Monitor usage**: Regularly check logs for unauthorized access

## 🧪 Testing Your Setup

Run the test script to verify your service account is properly configured:

```bash
node scripts/test-firebase-config.js
```

## 🔍 Troubleshooting

### Common Issues

1. **"FIREBASE_SERVICE_ACCOUNT_BASE64 environment variable is required"**
   - Make sure the variable is set in your `.env.local` file
   - Restart your development server after adding the variable

2. **"Unexpected token in JSON" or "Invalid base64"**
   - The base64 string may be corrupted or truncated
   - Re-encode your service account file using the provided script

3. **"Private key should be a string"**
   - The private key may have incorrect newline characters
   - The updated firebaseAdmin.ts handles this automatically

## 🆘 If You've Committed Credentials

If you've accidentally committed service account credentials:

1. Immediately generate a new service account key
2. Revoke the compromised key in Firebase Console
3. Update all environment variables with the new key
4. Consider it compromised and monitor for unauthorized usage