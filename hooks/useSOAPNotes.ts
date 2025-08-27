"use client";

import { useEffect, useState } from "react";
import { collection, query, where, orderBy, onSnapshot, limit, doc, Firestore } from "firebase/firestore";
import { db, auth, verifyFirestore } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

export interface SOAPNote {
  id: string;
  userId?: string;
  uid?: string;
  rawTranscript?: string;
  transcript?: string;
  translatedTranscript?: string;
  patientLang?: string;
  docLang?: string;
  soap?: {
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
    patientName?: string;
    encounterType?: string;
    timestamp: string;
  };
  patientName?: string;
  encounterType?: string;
  doctorName?: string;
  createdAt?: any;
  storagePath?: string;
  pdf?: {
    status: string;
    path?: string;
    url?: string;
  };
}

export function useSOAPNotes(limitCount: number = 50) {
  const [soapNotes, setSoapNotes] = useState<SOAPNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubAuth: (() => void) | undefined;
    let unsubSnapshot: (() => void) | undefined;

    // Check if Firebase services are properly initialized
    if (!auth) {
      setError("Firebase authentication is not properly initialized");
      setIsLoading(false);
      return;
    }
    
    try {
      // Verify Firestore is properly initialized
      verifyFirestore();
    } catch (err: any) {
      console.error("Firestore verification failed:", err);
      setError("Firestore verification failed: " + err.message);
      setIsLoading(false);
      return;
    }

    unsubAuth = onAuthStateChanged(auth, (user) => {
      if (unsubSnapshot) {
        unsubSnapshot();
        unsubSnapshot = undefined;
      }
      
      if (!user) {
        setSoapNotes([]);
        setIsLoading(false);
        return;
      }

      try {
        // Verify Firestore is properly initialized
        verifyFirestore();
        
        // Query SOAP notes for the current user
        // Support both 'uid' (newer) and 'userId' (legacy) fields
        const soapNotesCollection = collection(db as Firestore, "soapNotes");
        
        // Use the preferred field first
        const q = query(
          soapNotesCollection,
          where("userId", "==", user.uid),
          orderBy("createdAt", "desc"),
          limit(limitCount)
        );

        unsubSnapshot = onSnapshot(
          q,
          (querySnapshot) => {
            const notes: SOAPNote[] = [];
            querySnapshot.forEach((doc) => {
              notes.push({
                id: doc.id,
                ...doc.data()
              } as SOAPNote);
            });
            setSoapNotes(notes);
            setIsLoading(false);
            setError(null);
          },
          (err) => {
            console.error("Error fetching SOAP notes:", err);
            // Try fallback query with uid field
            if (err.code === 'permission-denied') {
              try {
                const fallbackQuery = query(
                  soapNotesCollection,
                  where("uid", "==", user.uid),
                  orderBy("createdAt", "desc"),
                  limit(limitCount)
                );
                
                const fallbackUnsub = onSnapshot(
                  fallbackQuery,
                  (fallbackSnapshot) => {
                    const notes: SOAPNote[] = [];
                    fallbackSnapshot.forEach((doc) => {
                      notes.push({
                        id: doc.id,
                        ...doc.data()
                      } as SOAPNote);
                    });
                    setSoapNotes(notes);
                    setIsLoading(false);
                    setError(null);
                  },
                  (fallbackErr) => {
                    console.error("Error fetching SOAP notes with fallback query:", fallbackErr);
                    setError("Failed to fetch SOAP notes: " + fallbackErr.message);
                    setIsLoading(false);
                  }
                );
                
                // Replace the unsubscribe function with the fallback one
                unsubSnapshot = fallbackUnsub;
              } catch (fallbackErr: any) {
                console.error("Error setting up fallback SOAP notes listener:", fallbackErr);
                setError("Failed to set up notes listener: " + (fallbackErr.message || fallbackErr.toString()));
                setIsLoading(false);
              }
            } else {
              setError("Failed to fetch SOAP notes: " + err.message);
              setIsLoading(false);
            }
          }
        );
      } catch (err: any) {
        console.error("Error setting up SOAP notes listener:", err);
        setError("Failed to set up notes listener: " + (err.message || err.toString()));
        setIsLoading(false);
      }
    });

    return () => {
      if (unsubSnapshot) unsubSnapshot();
      if (unsubAuth) unsubAuth();
    };
  }, [limitCount]);

  return { soapNotes, isLoading, error };
}

// Hook for getting a specific SOAP note by ID
export function useSOAPNote(noteId: string | null) {
  const [soapNote, setSoapNote] = useState<SOAPNote | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!noteId) {
      setSoapNote(null);
      setIsLoading(false);
      return;
    }

    let unsubSnapshot: (() => void) | undefined;

    try {
      // Verify Firestore is properly initialized
      verifyFirestore();
      
      const docRef = doc(db as Firestore, "soapNotes", noteId);
      unsubSnapshot = onSnapshot(
        docRef,
        (docSnap) => {
          if (docSnap.exists()) {
            setSoapNote({
              id: docSnap.id,
              ...docSnap.data()
            } as SOAPNote);
          } else {
            setSoapNote(null);
          }
          setIsLoading(false);
          setError(null);
        },
        (err) => {
          console.error("Error fetching SOAP note:", err);
          setError("Failed to fetch SOAP note: " + err.message);
          setIsLoading(false);
        }
      );
    } catch (err: any) {
      console.error("Error setting up SOAP note listener:", err);
      setError("Failed to set up note listener: " + (err.message || err.toString()));
      setIsLoading(false);
    }

    return () => {
      if (unsubSnapshot) unsubSnapshot();
    };
  }, [noteId]);

  return { soapNote, isLoading, error };
}