import { adminBucket } from "@/lib/firebase-admin";

export async function GET() {
  try {
    console.log(`[Debug Bucket] Checking bucket: ${adminBucket.name}`);
    
    // Try to list files in the bucket to verify access
    const [files] = await adminBucket.getFiles({ maxResults: 1 });
    
    return Response.json({ 
      ok: true, 
      bucket: adminBucket.name,
      message: "Successfully connected to Firebase Storage bucket",
      canListFiles: true,
      fileCount: files.length
    });
  } catch (err: any) {
    console.error("[Debug Bucket] Error accessing bucket:", err);
    
    // Check if it's a permission error
    if (err.code === 403) {
      return Response.json({ 
        ok: false, 
        error: "Permission denied - check service account roles",
        code: err.code,
        message: err.message,
        bucket: adminBucket.name
      });
    }
    
    // Check if it's a bucket not found error
    if (err.code === 404) {
      return Response.json({ 
        ok: false, 
        error: "Bucket not found - verify bucket name and Firebase Storage setup",
        code: err.code,
        message: err.message,
        bucket: adminBucket.name,
        fix: "Enable Cloud Storage in Firebase Console and create the bucket"
      });
    }
    
    return Response.json({ 
      ok: false, 
      error: "Failed to access Firebase Storage bucket",
      code: err.code || 'UNKNOWN',
      message: err.message,
      bucket: adminBucket.name
    });
  }
}
