import { redirect } from "next/navigation";
import { requireSubscription } from "@/lib/requireUser";
import TranscriptionPageClient from "./page-client";

export default async function TranscriptionPage() {
  const authResult = await requireSubscription();
  
  // Handle redirect responses
  if ('redirect' in authResult) {
    redirect(authResult.redirect.destination);
  }
  
  // User is authenticated and has subscription, render the client component
  return <TranscriptionPageClient />;
}