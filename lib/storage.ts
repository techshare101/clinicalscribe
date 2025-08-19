// lib/storage.ts
import { getBytes, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage, auth } from "./firebase";

export type BucketFolder = "recordings" | "images" | "pdfs";

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
