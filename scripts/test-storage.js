import admin from 'firebase-admin';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (!serviceAccountBase64) {
    console.error('❌ FIREBASE_SERVICE_ACCOUNT_BASE64 not found');
    console.log('💡 Make sure you have .env.local file with the Firebase service account');
    process.exit(1);
  }

  const serviceAccount = JSON.parse(
    Buffer.from(serviceAccountBase64, 'base64').toString('utf-8')
  );

  console.log('🔧 Initializing Firebase Admin SDK...');
  console.log('📁 Project ID:', serviceAccount.project_id);
  console.log('📧 Client Email:', serviceAccount.client_email);
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
}

async function testFirebaseStorage() {
  console.log('\n🧪 Testing Firebase Storage...');
  console.log('🪣 Bucket:', process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);
  
  try {
    const bucket = admin.storage().bucket();
    
    // Test 1: Check if bucket exists
    console.log('\n1️⃣ Checking if bucket exists...');
    const [bucketExists] = await bucket.exists();
    console.log(`   Bucket exists: ${bucketExists ? '✅ YES' : '❌ NO'}`);
    
    if (!bucketExists) {
      console.log('\n🔧 Attempting to create bucket...');
      try {
        await bucket.create();
        console.log('✅ Bucket created successfully!');
      } catch (createError) {
        console.error('❌ Failed to create bucket:', createError.message);
        console.log('\n💡 You may need to create the bucket manually in Firebase Console:');
        console.log(`   1. Go to https://console.firebase.google.com/project/${admin.app().options.projectId}/storage`);
        console.log('   2. Click "Get started" if Storage is not enabled');
        console.log('   3. Choose "Start in test mode" for now');
        console.log('   4. Select a location for your storage bucket');
        return;
      }
    }
    
    // Test 2: Test write permissions
    console.log('\n2️⃣ Testing write permissions...');
    const testFile = bucket.file('test/write-test.txt');
    await testFile.save('Hello from Clinical Scribe!', {
      metadata: { contentType: 'text/plain' }
    });
    console.log('✅ Write test successful!');
    
    // Test 3: Test read permissions  
    console.log('\n3️⃣ Testing read permissions...');
    const [downloadContent] = await testFile.download();
    console.log('✅ Read test successful!');
    console.log('📄 Content:', downloadContent.toString());
    
    // Test 4: Test signed URL generation
    console.log('\n4️⃣ Testing signed URL generation...');
    const [signedUrl] = await testFile.getSignedUrl({
      action: 'read',
      expires: Date.now() + 60 * 60 * 1000, // 1 hour
    });
    console.log('✅ Signed URL generated successfully!');
    console.log('🔗 URL:', signedUrl.substring(0, 100) + '...');
    
    // Test 5: Test PDF directory structure
    console.log('\n5️⃣ Testing PDF directory structure...');
    const pdfTestFile = bucket.file('pdfs/test-user/test-note.pdf');
    await pdfTestFile.save(Buffer.from('Fake PDF content'), {
      metadata: { contentType: 'application/pdf' }
    });
    console.log('✅ PDF directory structure test successful!');
    
    // Cleanup test files
    console.log('\n🧹 Cleaning up test files...');
    await testFile.delete();
    await pdfTestFile.delete();
    console.log('✅ Cleanup complete!');
    
    console.log('\n🎉 All Firebase Storage tests passed!');
    console.log('✅ Your Firebase Storage is properly configured and ready to use.');
    
  } catch (error) {
    console.error('\n❌ Firebase Storage test failed:', error);
    
    if (error.code === 404) {
      console.log('\n💡 The bucket does not exist. You need to:');
      console.log('   1. Go to Firebase Console Storage section');
      console.log('   2. Enable Cloud Storage');
      console.log('   3. Create a storage bucket');
    } else if (error.code === 403) {
      console.log('\n💡 Permission denied. You need to:');
      console.log('   1. Check that your service account has Storage Admin role');
      console.log('   2. Verify the bucket name is correct');
      console.log('   3. Check Firebase Storage security rules');
    }
  }
}

// Run the test
testFirebaseStorage()
  .then(() => {
    console.log('\n🏁 Storage test complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Unexpected error:', error);
    process.exit(1);
  });