import { ref, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";
// Remove the adminStorage import from this file as we'll access it through firebaseAdmin

/**
 * Get download URL for a PDF stored in Firebase Storage
 * @param storagePath - The path to the PDF in Firebase Storage (e.g., "pdfs/userId/noteId.pdf")
 * @returns Promise that resolves to the download URL
 */
export async function getPDFUrl(storagePath: string): Promise<string> {
  try {
    // This function should only be used on the client-side
    if (typeof window === 'undefined') {
      throw new Error('getPDFUrl should only be called on the client-side');
    }
    
    const pdfRef = ref(storage, storagePath);
    const url = await getDownloadURL(pdfRef);
    return url;
  } catch (error) {
    console.error("Error getting PDF URL:", error);
    throw new Error("Failed to retrieve PDF");
  }
}

/**
 * Open a PDF in a new tab
 * @param storagePath - The path to the PDF in Firebase Storage
 */
export async function openPDF(storagePath: string): Promise<void> {
  try {
    // This function should only be used on the client-side
    if (typeof window === 'undefined') {
      throw new Error('openPDF should only be called on the client-side');
    }
    
    const url = await getPDFUrl(storagePath);
    window.open(url, "_blank");
  } catch (error) {
    console.error("Error opening PDF:", error);
    throw new Error("Failed to open PDF");
  }
}

/**
 * Download a PDF
 * @param storagePath - The path to the PDF in Firebase Storage
 * @param filename - The filename to save the PDF as
 */
export async function downloadPDF(storagePath: string, filename: string = "document.pdf"): Promise<void> {
  try {
    // This function should only be used on the client-side
    if (typeof window === 'undefined') {
      throw new Error('downloadPDF should only be called on the client-side');
    }
    
    const url = await getPDFUrl(storagePath);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error("Error downloading PDF:", error);
    throw new Error("Failed to download PDF");
  }
}

// --- SERVER-SIDE FUNCTIONS (Node.js/Admin SDK) ---

/**
 * Get a permanent public URL for a stored PDF (server-side only)
 * @param filePath string - The path in Firebase Storage (e.g., "pdfs/uid/noteId.pdf")
 */
export async function getSignedPdfUrl(filePath: string) {
  // Dynamically import firebaseAdmin to avoid bundling it in client-side code
  const { adminStorage } = await import('./firebaseAdmin');
  
  try {
    if (!adminStorage) {
      throw new Error('Firebase Storage not initialized - check NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET');
    }

    // Get the bucket from the storage instance
    const bucket = adminStorage.bucket();
    const file = bucket.file(filePath);

    // Check if file exists first
    const [exists] = await file.exists();
    if (!exists) {
      throw new Error(`PDF file not found: ${filePath}`);
    }

    // Generate signed URL that bypasses Storage Rules
    const [signedUrl] = await file.getSignedUrl({
      action: "read",
      expires: "03-01-2080", // Long-lived signed URL
    });

    return signedUrl;
  } catch (err: any) {
    console.error('❌ Error generating PDF URL:', err.message);
    throw new Error(`Failed to generate PDF download link: ${err.message}`);
  }
}

/**
 * Check if a PDF exists in Firebase Storage (server-side only)
 * @param filePath string - The path in Firebase Storage
 */
export async function pdfExists(filePath: string): Promise<boolean> {
  // Dynamically import firebaseAdmin to avoid bundling it in client-side code
  const { adminStorage } = await import('./firebaseAdmin');
  
  try {
    if (!adminStorage) {
      return false;
    }

    // Get the bucket from the storage instance
    const bucket = adminStorage.bucket();
    const file = bucket.file(filePath);
    const [exists] = await file.exists();
    return exists;
  } catch (err: any) {
    console.error('❌ Error checking PDF existence:', err.message);
    return false;
  }
}
