import { cookies } from "next/headers"
import { adminAuth } from "./firebase-admin"
import { adminDb } from "./firebase-admin"

/**
 * Unified user authentication and authorization helper
 * Verifies session cookie and checks user role/subscription status
 */
export async function requireUser() {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get("__session")?.value
    
    // No session cookie found
    if (!sessionCookie) {
      // Dev override: return mock user when NEXT_PUBLIC_SHOW_DASHBOARD_ALWAYS is true
      const devOverride = process.env.NEXT_PUBLIC_SHOW_DASHBOARD_ALWAYS === "true"
      if (devOverride) {
        return {
          uid: "dev-user-id",
          email: "dev@example.com",
          role: "admin", // Give dev user admin role to bypass all checks
          betaActive: true
        }
      }
      return null
    }

    // Verify session cookie
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true /** checkRevoked */)
    console.log("✅ Session claims:", decodedClaims)

    // Create basic user object
    const user: any = {
      uid: decodedClaims.uid,
      email: decodedClaims.email,
      role: decodedClaims.role || "user", // default role
    }

    // Admin users bypass subscription checks
    if (user.role === "admin") {
      return user
    }

    // For non-admin users, check subscription status in Firestore
    try {
      const profileRef = adminDb.collection("profiles").doc(user.uid)
      const profileSnap = await profileRef.get()
      
      if (profileSnap.exists) {
        const profileData: any = profileSnap.data()
        user.role = profileData?.role || user.role
        
        // Check if user has active beta access
        if (profileData?.betaActive === true) {
          return { ...user, plan: "beta" }
        }
      }
    } catch (profileError) {
      console.error("❌ Error fetching user profile:", profileError)
    }

    // If we get here, user is authenticated but doesn't have active subscription
    return { ...user, plan: null }
  } catch (err) {
    console.error("❌ requireUser failed:", err)
    
    // Dev override: return mock user when NEXT_PUBLIC_SHOW_DASHBOARD_ALWAYS is true
    const devOverride = process.env.NEXT_PUBLIC_SHOW_DASHBOARD_ALWAYS === "true"
    if (devOverride) {
      return {
        uid: "dev-user-id",
        email: "dev@example.com",
        role: "admin", // Give dev user admin role to bypass all checks
        betaActive: true
      }
    }
    
    return null
  }
}

/**
 * Server-side guard for pages that require authentication
 * Redirects to login if user is not authenticated
 */
export async function requireAuth() {
  const user = await requireUser()
  
  if (!user) {
    return { redirect: { destination: "/auth/login", permanent: false } }
  }
  
  return { props: { user } }
}

/**
 * Server-side guard for pages that require active subscription
 * Redirects to pricing page if user doesn't have active subscription
 */
export async function requireSubscription() {
  const user: any = await requireUser()
  
  if (!user) {
    return { redirect: { destination: "/auth/login", permanent: false } }
  }
  
  // Admin users have access to everything
  if (user.role === "admin") {
    return { props: { user } }
  }
  
  // Check if user has active subscription
  if (!user.plan) {
    return { redirect: { destination: "/pricing", permanent: false } }
  }
  
  return { props: { user } }
}
