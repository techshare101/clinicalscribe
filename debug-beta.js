// Quick Debug: Add this to browser console on your dashboard page

// 1. Check your current user and profile
console.log('Current user:', auth.currentUser);

// 2. Check your current profile in Firestore  
if (auth.currentUser) {
  const userDoc = doc(db, 'profiles', auth.currentUser.uid);
  getDoc(userDoc).then(snap => {
    console.log('Current profile:', snap.exists() ? snap.data() : 'No profile found');
    
    // 3. If you want to enable beta access directly:
    // UNCOMMENT THE LINES BELOW TO ENABLE BETA ACCESS:
    /*
    setDoc(userDoc, {
      betaActive: true,
      uid: auth.currentUser.uid,
      email: auth.currentUser.email,
      updatedAt: serverTimestamp()
    }, { merge: true }).then(() => {
      console.log('🎉 Beta access enabled! Refresh the page to see the beautiful dashboard!');
    }).catch(err => {
      console.error('Error enabling beta access:', err);
    });
    */
  });
}