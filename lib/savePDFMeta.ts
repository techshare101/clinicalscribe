import { setDoc, doc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";

/**
 * Save PDF metadata to Firestore with proper userId field
 * This ensures Firestore rules allow access and SOAP history updates
 */
export const savePDFMeta = async (
  pdfUrl: string, 
  noteId?: string,
  additionalData?: Record<string, any>
) => {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    console.error("[savePDFMeta] User not authenticated");
    throw new Error("User not signed in");
  }
  
  if (!pdfUrl || !pdfUrl.startsWith("https")) {
    console.error("[savePDFMeta] Invalid PDF URL:", pdfUrl);
    throw new Error("Invalid PDF URL");
  }

  console.log("[savePDFMeta] Saving PDF metadata:", { uid, pdfUrl, noteId });

  // Use flat structure in /pdfs for SOAP history listener
  const ref = doc(db, "pdfs", `${Date.now()}`);

  const metadata = {
    userId: uid, // ✅ Required for Firestore rules
    url: pdfUrl,
    noteId: noteId || null,
    createdAt: serverTimestamp(),
    ...additionalData,
  };

  await setDoc(ref, metadata);
  
  console.log(`✅ PDF metadata saved to Firestore: ${ref.path}`);
  console.log(`✅ Metadata:`, metadata);
  
  return ref.id;
};
