// lib/storage.ts
import { getBytes, getMetadata, ref, uploadBytes } from "firebase/storage";
import { storage } from "./firebase";

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
  const snap = await uploadBytes(r, file, meta);
  return { path, size: snap.totalBytes, contentType: snap.metadata.contentType };
}

/** Auth-respecting fetch (no public URL). Handy for inline previews. */
export async function getBlobUrl(path: string) {
  const r = ref(storage, path);
  const bytes = await getBytes(r); // respects Storage rules (must be signed-in owner)
  const blob = new Blob([bytes]);
  return URL.createObjectURL(blob); // remember to revokeObjectURL when done
}
