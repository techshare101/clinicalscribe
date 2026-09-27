import { auth } from "@/lib/firebase";

/**
 * Adds the signed-in user's Firebase ID token as a Bearer header.
 * The API routes accept either this header or the __session cookie; sending the
 * token means requests still work when the session cookie is missing or expired.
 */
export async function withAuthHeaders(headers: Record<string, string> = {}): Promise<Record<string, string>> {
  const user = auth.currentUser;
  if (!user) return headers;
  try {
    const token = await user.getIdToken();
    return { ...headers, Authorization: `Bearer ${token}` };
  } catch (err) {
    console.warn("[withAuthHeaders] Failed to retrieve ID token:", err);
    return headers;
  }
}
