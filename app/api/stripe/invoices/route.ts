import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("Missing STRIPE_SECRET_KEY environment variable");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16", // Using stable API version
});

export async function GET(req: NextRequest) {
  try {
    // Get the auth token from the Authorization header
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing authorization header" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    
    // Verify the Firebase ID token
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch (error) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const uid = decodedToken.uid;

    // Get the user's profile to find their Stripe customer ID
    const profileDoc = await adminDb.collection("profiles").doc(uid).get();
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