import { ref, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";
import { adminStorage } from './firebaseAdmin';

/**
 * Get download URL for a PDF stored in Firebase Storage
 * @param storagePath - The path to the PDF in Firebase Storage (e.g., "pdfs/userId/noteId.pdf")
 * @returns Promise that resolves to the download URL
 */
export async function getPDFUrl(storagePath: string): Promise<string> {
  try {
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
 * Get a signed URL for a stored PDF (server-side only)
 * @param filePath string - The path in Firebase Storage (e.g., "pdfs/uid/noteId.pdf")
 * @param expiresIn number - Expiry in ms (default: 1 hour)
 */
export async function getSignedPdfUrl(filePath: string, expiresIn: number = 60 * 60 * 1000) {
  try {
    if (!adminStorage) {
      throw new Error('Firebase Storage not initialized - check NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET');
    }

    const file = adminStorage.file(filePath);

    // Check if file exists first
    const [exists] = await file.exists();
    if (!exists) {
      throw new Error(`PDF file not found: ${filePath}`);
    }

    const [url] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + expiresIn,
    });

    return url;
  } catch (err: any) {
    console.error('❌ Error generating signed PDF URL:', err.message);
    throw new Error(`Failed to generate PDF download link: ${err.message}`);
  }
}

/**
 * Check if a PDF exists in Firebase Storage (server-side only)
 * @param filePath string - The path in Firebase Storage
 */
export async function pdfExists(filePath: string): Promise<boolean> {
  try {
    if (!adminStorage) {
      return false;
    }

    const file = adminStorage.file(filePath);
    const [exists] = await file.exists();
    return exists;
  } catch (err: any) {
    console.error('❌ Error checking PDF existence:', err.message);
    return false;
  }
}
