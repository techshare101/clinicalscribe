// This route is for testing client-side Firebase configuration
export async function GET() {
  const clientBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  
  return Response.json({ 
    clientBucket: clientBucket,
    expectedClientBucket: "clinicalscribe-511e7.firebasestorage.app",
    match: clientBucket === "clinicalscribe-511e7.firebasestorage.app"
  });
}