# Demo Data Seeding for ClinicalScribe

This script creates realistic dummy data for testing the ClinicalScribe dashboard without having to record actual audio or create real SOAP notes.

## What it creates:

✅ **5 Complete Reports** (transcript + SOAP note + PDF link)
✅ **3 Standalone SOAP Notes** (with fake PDF URLs)  
✅ **3 Standalone Transcripts** (audio processing only)
✅ **User Profile** with `betaActive: true` for full access

## Quick Setup:

### 1. Create a test user account
First, create a test user in your app or use Firebase Console:
```bash
# Go to your app and sign up with:
# Email: test@clinicalscribe.com
# Password: testpassword123
```

### 2. Update the script with your test user
Edit `scripts/seed-demo.ts` and update these lines:
```typescript
const TEST_EMAIL = "test@clinicalscribe.com";     // ← Your test email
const TEST_PASSWORD = "testpassword123";          // ← Your test password
```

### 3. Run the seeding script
```bash
npm run seed-demo
```

## Sample Data Generated:

### Reports Collection
- **Patient cases**: Chest pain, migraine, diabetes follow-up, strep throat, elderly fall
- **Realistic timestamps**: Spread over the last 5 days
- **Complete data**: Each has transcript, SOAP note, and PDF URL

### SOAP Notes Collection  
- **Clinical formats**: Proper SUBJECTIVE/OBJECTIVE/ASSESSMENT/PLAN structure
- **Patient linking**: Uses `patientId` and `patientName` fields
- **PDF status**: All marked as generated with download URLs

### Transcripts Collection
- **Audio simulation**: Includes fake audio URLs and durations
- **Processing status**: All marked as "transcribed"
- **Recent timing**: Created over the last 18 hours

## Testing Your Dashboard:

After running the script, you can:

1. **Sign in** with your test user credentials
2. **View Dashboard** - should show all demo stats and reports
3. **Test Paywall** - temporarily set `betaActive: false` in Firestore
4. **Test Webhook** - make a Stripe payment to see real-time beta unlock

## Cleanup (Optional):

To remove demo data, you can manually delete documents from these collections:
- `reports` (where `userId` matches your test user)
- `soapNotes` (where `userId` matches your test user)  
- `transcripts` (where `userId` matches your test user)

Or implement the `clearDemoData()` function in the script.

## Troubleshooting:

**Authentication Error?**
- Make sure your test user exists and credentials are correct
- Check that Firebase Auth is properly configured

**Permission Denied?**
- Verify your Firestore security rules allow the test user to write
- Check that the user has the correct permissions

**No Data Showing?**
- Confirm the `userId` in the created documents matches your signed-in user
- Check browser console for any Firebase errors

## Next Steps:

Once you have demo data, test:
- [ ] Dashboard loads with correct stats
- [ ] Reports show in ReportList component  
- [ ] Paywall toggles correctly based on `betaActive`
- [ ] Stripe webhook sets `betaActive: true`
- [ ] Real-time updates work when beta status changes