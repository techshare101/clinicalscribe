import { redirect } from "next/navigation"
import { requireAuth } from "@/lib/requireUser"
import DashboardPage from "./page"

// ⚡ TEMP DEV OVERRIDE – disables paywall check
// You can restore later when subscription logic is ready
export async function getDashboardAccess(user: any) {
  // Always allow dashboard access in dev
  if (process.env.NEXT_PUBLIC_SHOW_DASHBOARD_ALWAYS === "true") {
    return { allowed: true, reason: "dev override" }
  }

  // For now, allow access to all authenticated users
  // Later you can restore the original paywall logic:
  // const plan = await getUserPlan(user.id)
  // if (!plan?.active) return { allowed: false, reason: "no plan" }
  // return { allowed: true }
  
  return { allowed: true } // fallback
}

export default async function DashboardPageServer() {
  const authResult = await requireAuth()
  
  // Handle redirect responses
  if ('redirect' in authResult && authResult.redirect) {
    redirect(authResult.redirect.destination)
  }
  
  // Check dashboard access with dev override
  const accessResult = await getDashboardAccess(authResult.props?.user)
  
  // For now, we'll always render the dashboard component
  // Later you can add access control based on accessResult
  
  // User is authenticated, render the dashboard component
  return <DashboardPage />
}
