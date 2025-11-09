import { setDoc, doc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";

/**
 * Save PDF metadata to Firestore with proper userId field
 * This ensures Firestore rules allow access
 */
export const savePDFMeta = async (
  pdfUrl: string, 
  noteId?: string,
  additionalData?: Record<string, any>
) => {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("User not signed in");

  // Use nested structure under soapNotes if noteId provided
  const ref = noteId
    ? doc(db, "soapNotes", noteId, "pdfs", `${Date.now()}`)
    : doc(db, "pdfs", `${Date.now()}`);

  await setDoc(ref, {
    userId: uid, // ✅ Required for Firestore rules
    url: pdfUrl,
    createdAt: serverTimestamp(),
    ...additionalData,
  });
  
  console.log(`✅ PDF metadata saved to Firestore: ${ref.path}`);
};
