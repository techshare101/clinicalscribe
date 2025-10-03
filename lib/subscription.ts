import { auth } from "@/lib/firebase";

export async function handleManageSubscription() {
  if (!auth.currentUser) return;
  
  try {
    const response = await fetch("/api/stripe/portal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid: auth.currentUser.uid }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to load billing portal");
    }

    return data; // Returns { url: string, noCustomer?: boolean }
  } catch (error) {
    console.error("Error accessing billing portal:", error);
    throw error;
  }
}

export async function getInvoices() {
  if (!auth.currentUser) {
    return {
      invoices: [],
      message: "Please sign in to view invoices."
    };
  }
  
  try {
    const response = await fetch("/api/stripe/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid: auth.currentUser.uid }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to fetch invoices");
    }

    return {
      invoices: data.invoices || [],
      message: data.message,
      redirectUrl: data.redirectUrl
    };
  } catch (error) {
    console.error("Error fetching invoices:", error);
    throw error;
  }
}
