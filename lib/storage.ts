// lib/storage.ts
import { getBytes, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage, auth } from "./firebase";

export type BucketFolder = "recordings" | "images" | "pdfs";

/**
 * Server-only PDF generation to avoid Firebase Storage retry errors
 * Use this instead of uploadToFirebase for PDFs
 */
export async function generateAndUploadPDF(
  html: string,
  metadata?: {
    patientId?: string
    patientName?: string
    docLang?: string
  }
): Promise<{ url: string; path: string }> {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");

  const idToken = await user.getIdToken(true);
  
  // Generate noteId if metadata is provided (for Firestore sync)
  const noteId = metadata ? `${user.uid}_${Date.now()}` : undefined;
  
  const response = await fetch("/api/pdf/render", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({
      html,
      ownerId: user.uid,
      ...(noteId && { noteId }),
      ...(metadata?.patientId && { patientId: metadata.patientId }),
      ...(metadata?.patientName && { patientName: metadata.patientName }),
      ...(metadata?.docLang && { docLang: metadata.docLang })
    }),
  });
  
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "PDF generation failed");
  
  return { url: result.url, path: result.path };
}

function randomId() {
  // crypto.randomUUID with fallback for older browsers/environments
  try {
    if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  } catch {}
  return `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export async function uploadToFirebase(
  folder: "recordings" | "images" | "pdfs",
  file: Blob,
  uid: string,
  ext = "bin"
): Promise<{ path: string; size: number; contentType?: string | null }> {
  const id = randomId();
  const safeExt = ext.replace(/[^a-z0-9]/gi, "").toLowerCase() || "bin";
  const path = `${folder}/${uid}/${id}.${safeExt}`;
  const r = ref(storage, path);
  const meta = { contentType: file.type || undefined };
  await uploadBytes(r, file, meta);
  return { path, size: (file as any).size ?? 0, contentType: meta.contentType ?? null };
}

/** Auth-respecting fetch (no public URL). Handy for inline previews. */
export async function getBlobUrl(path: string) {
  const r = ref(storage, path);
  const bytes = await getBytes(r); // respects Storage rules (must be signed-in owner)
  const blob = new Blob([bytes]);
  return URL.createObjectURL(blob); // remember to revokeObjectURL when done
}

export async function uploadUserFile(
  path: BucketFolder,
  file: File | Blob,
  fileName: string
): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  const fileRef = ref(storage, `${path}/${user.uid}/${fileName}`);
  await uploadBytes(fileRef, file, { contentType: (file as any).type || undefined });
  return getDownloadURL(fileRef);
}

export async function getUserFileUrl(
  path: BucketFolder,
  fileName: string
): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  const fileRef = ref(storage, `${path}/${user.uid}/${fileName}`);
  return getDownloadURL(fileRef);
}

export async function getSignedUrlForPath(storagePath: string): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  const parts = storagePath.split("/");
  if (parts.length < 3) throw new Error("Invalid storage path");
  const uid = parts[1];
  if (uid !== user.uid) throw new Error("Forbidden");
  const r = ref(storage, storagePath);
  return getDownloadURL(r);
}
