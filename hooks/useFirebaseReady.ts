import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

/**
 * Hook to ensure Firebase Auth is ready before accessing Storage or Firestore
 * 
 * Usage:
 * ```typescript
 * const { isReady, user } = useFirebaseReady();
 * 
 * if (!isReady) return <Loading />;
 * if (!user) return <SignIn />;
 * 
 * // Safe to access storage now
 * const fileRef = ref(storage, `pdfs/${user.uid}/file.pdf`);
 * ```
 */
export function useFirebaseReady() {
  const [isReady, setIsReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Wait for auth state to be determined
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsReady(true);
      
      if (currentUser) {
        console.log('✅ Firebase auth ready, user:', currentUser.uid);
      } else {
        console.log('⚠️ Firebase auth ready, no user signed in');
      }
    });

    return () => unsubscribe();
  }, []);

  return { 
    isReady,  // true when auth state is determined
    user,     // current user or null
    isAuthenticated: !!user  // convenience boolean
  };
}
