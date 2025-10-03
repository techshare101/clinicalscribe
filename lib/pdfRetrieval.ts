import { ref, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";

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