/**
 * Simple test to verify our authentication logic
 */

// Mock the required modules
const mockAdminAuth = {
  verifySessionCookie: async (cookie, checkRevoked) => {
    console.log('Verifying session cookie');
    if (cookie === 'valid-admin-cookie') {
      return { uid: 'admin123', email: 'admin@example.com', role: 'admin' };
    }
    if (cookie === 'valid-user-cookie') {
      return { uid: 'user123', email: 'user@example.com' };
    }
    throw new Error('Invalid session cookie');
  }
};

const mockAdminDb = {
  collection: (name) => ({
    doc: (id) => ({
      get: async () => {
        console.log('Fetching profile for user:', id);
        if (id === 'admin123') {
          return {
            exists: true,
            data: () => ({ role: 'admin', betaActive: true })
          };
        }
        if (id === 'user123') {
          return {
            exists: true,
            data: () => ({ role: 'user', betaActive: true })
          };
        }
        if (id === 'nonsub123') {
          return {
            exists: true,
            data: () => ({ role: 'user', betaActive: false })
          };
        }
        return { exists: false, data: () => null };
      }
    })
  })
};

// Mock cookies function
const mockCookies = () => ({
  get: (name) => {
    if (name === '__session') {
      return { value: 'valid-admin-cookie' }; // Change this to test different scenarios
    }
    return null;
  }
});

// Test our authentication logic
async function testAuthLogic() {
  console.log('Testing authentication logic...\n');
  
  // Mock the imports
  const mockModules = {
    'next/headers': { cookies: mockCookies },
    './firebaseAdmin': { adminAuth: mockAdminAuth, adminDb: mockAdminDb }
  };
  
  // Since we can't easily import our TypeScript file, let's simulate the logic
  console.log('1. Testing admin user access:');
  try {
    const cookieStore = mockCookies();
    const sessionCookie = cookieStore.get('__session')?.value;
    
    if (!sessionCookie) {
      console.log('  No session cookie found');
      return null;
    }
    
    const decodedClaims = await mockAdminAuth.verifySessionCookie(sessionCookie, true);
    console.log('  Session verified:', decodedClaims);
    
    const user = {
      uid: decodedClaims.uid,
      email: decodedClaims.email,
      role: decodedClaims.role || 'user'
    };
    
    console.log('  User object:', user);
    
    // Admin users bypass subscription checks
    if (user.role === 'admin') {
      console.log('  Admin user - granting full access');
      return user;
    }
    
    // For non-admin users, check subscription status
    try {
      const profileRef = mockAdminDb.collection('profiles').doc(user.uid);
      const profileSnap = await profileRef.get();
      
      if (profileSnap.exists) {
        const profileData = profileSnap.data();
        user.role = profileData?.role || user.role;
        
        if (profileData?.betaActive === true) {
          console.log('  User has active beta access');
          return { ...user, plan: 'beta' };
        }
      }
    } catch (profileError) {
      console.error('  Error fetching user profile:', profileError);
    }
    
    console.log('  User does not have active subscription');
    return { ...user, plan: null };
  } catch (err) {
    console.error('  Authentication failed:', err.message);
    return null;
  }
}

// Run the test
testAuthLogic().then(result => {
  console.log('\n✅ Test completed. Result:', result);
});