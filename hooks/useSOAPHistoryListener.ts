"use client";

import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase";

export interface SOAPHistoryEntry {
  id: string;
  url?: string;
  noteId?: string;
  createdAt?: any;
  patientName?: string;
  transcriptLang?: string;
  documentLang?: string;
  userId?: string;
  type?: "soap" | "pdf";
}

export const useSOAPHistoryListener = () => {
  const [entries, setEntries] = useState<SOAPHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const user = auth.currentUser;

    if (!user) {
      setError("User not authenticated");
      setLoading(false);
      return;
    }

    const uid = user.uid;
    
    user.getIdTokenResult()
      .then((tokenResult) => {
        const role = tokenResult.claims.role || "user";
        console.log(`[SOAP History] Listening as ${role} (${uid})`);

        // 🧠 Build Firestore query based on role
        let q;

        if (
          role === "admin" ||
          role === "system-admin" ||
          role === "nurse-admin"
        ) {
          // 🔹 Admins can view all PDFs, newest first
          q = query(collection(db, "pdfs"), orderBy("createdAt", "desc"));
          console.log("[SOAP History] Admin mode: viewing all PDFs");
        } else {
          // 🔹 Regular users only see their own PDFs
          q = query(
            collection(db, "pdfs"),
            where("userId", "==", uid),
            orderBy("createdAt", "desc")
          );
          console.log("[SOAP History] User mode: viewing own PDFs");
        }

        const unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            const docs: SOAPHistoryEntry[] = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
              type: "pdf",
            })) as SOAPHistoryEntry[];

            setEntries(docs);
            setLoading(false);
            console.log(`📄 SOAP history updated: ${docs.length} PDFs`);
          },
          (err) => {
            console.error("❌ Firestore listener error:", err);
            setError(err.message);
            setLoading(false);
          }
        );

        return () => unsubscribe();
      })
      .catch((err) => {
        console.error("❌ Token retrieval error:", err);
        setError("Failed to verify user role");
        setLoading(false);
      });
  }, []);

  return { entries, loading, error };
};
