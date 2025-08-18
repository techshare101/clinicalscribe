import { getDoc, doc } from "firebase/firestore";
import { db } from "./firebase";

export async function getUserRole(uid: string): Promise<"admin" | "nurse"> {
  const ref = doc(db, "profiles", uid);
  const snap = await getDoc(ref);
  const data = snap.exists() ? snap.data() as any : {};
  return (data?.role ?? "nurse") as "admin" | "nurse";
}
