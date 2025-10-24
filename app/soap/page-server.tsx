import { redirect } from "next/navigation";
import { requireSubscription } from "@/lib/requireUser";
import SOAPPageClient from "./page-client";

export default async function SOAPPage() {
  const authResult = await requireSubscription();
  
  // Handle redirect responses
  if ('redirect' in authResult) {
    redirect(authResult.redirect.destination);
  }
  
  // User is authenticated and has subscription, render the client component
  return <SOAPPageClient />;
}
