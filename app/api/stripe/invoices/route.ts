import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getFirestore } from "firebase-admin/firestore";
import { initFirebaseAdmin } from "@/lib/firebase-admin";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("Missing STRIPE_SECRET_KEY environment variable");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16", // Using stable API version
});

// Initialize Firebase Admin if not already initialized
initFirebaseAdmin();
const db = getFirestore();

export async function POST(req: NextRequest) {
  try {
    const { uid } = await req.json();

    if (!uid) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Get the user's profile to find their Stripe customer ID
    const profileDoc = await db.collection("users").doc(uid).get();
    const profile = profileDoc.data();
    const stripeCustomerId = profile?.stripeCustomerId;

    // If there's no Stripe customer ID, return empty invoice list with redirect URL
    if (!stripeCustomerId) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      return NextResponse.json({
        invoices: [],
        redirectUrl: `${baseUrl}/plans`,
        message: "No invoices available - Please subscribe to a plan first."
      });
    }

    // Fetch the customer's invoices
    const invoices = await stripe.invoices.list({
      customer: stripeCustomerId,
      limit: 10,
      status: "paid",
    });

    // Format invoice data for the frontend
    const formattedInvoices = invoices.data.map((invoice) => ({
      id: invoice.id,
      number: invoice.number,
      amount: invoice.amount_paid / 100, // Convert from cents to dollars
      status: invoice.status,
      date: invoice.created * 1000, // Convert to milliseconds
      pdf: invoice.invoice_pdf,
      hostedUrl: invoice.hosted_invoice_url,
    }));

    return NextResponse.json({ invoices: formattedInvoices });
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return NextResponse.json(
      { error: "Failed to fetch invoices" },
      { status: 500 }
    );
  }
}