"use client";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, User } from "firebase/auth";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<any[]>([]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.push("/auth/login");
        return;
      }
      setUser(currentUser);

      try {
        const q = query(
          collection(db, "soapNotes"),
          where("userId", "==", currentUser.uid),
          orderBy("createdAt", "desc")
        );

        const unsubNotes = onSnapshot(
          q,
          (snapshot) => {
            const items = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));
            setNotes(items);
            setLoading(false);
          },
          (err) => {
            console.error("Error fetching notes:", err);
            setNotes([]);
            setLoading(false);
          }
        );

        return () => unsubNotes();
      } catch (err) {
        console.error("Query failed:", err);
        setNotes([]);
        setLoading(false);
      }
    });

    return () => unsub();
  }, [router]);

  if (loading) {
    return <p className="p-4 text-gray-500">Loading your notes...</p>;
  }

  if (!notes.length) {
    return <p className="p-4 text-gray-500">No notes yet — create your first SOAP entry.</p>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-semibold mb-4">Your SOAP Notes</h1>
      <ul className="space-y-2">
        {notes.map((note) => (
          <li key={note.id} className="p-3 bg-white rounded shadow">
            <p className="font-medium">{(note as any).title || "Untitled Note"}</p>
            <p className="text-sm text-gray-500">
              {(note as any).createdAt?.toDate
                ? (note as any).createdAt.toDate().toLocaleString()
                : "Unknown date"}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
