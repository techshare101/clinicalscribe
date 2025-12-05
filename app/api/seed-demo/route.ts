export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

// Lazy initialization to avoid build-time errors when env var is missing
function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2024-11-20" as any,
  });
}

function randomId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).substring(2, 10)}`;
}

export async function POST(req: NextRequest) {
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

    // Check if this is an admin reseed (uid provided in body)
    const { uid: bodyUid } = await req.json().catch(() => ({}));
    
    let uid: string;
    if (bodyUid) {
      // Admin reseed mode - use provided UID
      // TODO: Add admin role check here
      uid = bodyUid;
    } else {
      // Self-seed mode - use current user's UID
      uid = decodedToken.uid;
    }

    // --- Firestore profile ---
    const profileRef = adminDb.collection("profiles").doc(uid);

    // fake Stripe IDs
    const stripeCustomerId = randomId("cus_demo");
    const stripeSubscriptionId = randomId("sub_demo");
    const stripeSessionId = randomId("cs_demo");

    await profileRef.set(
      {
        betaActive: true,
        betaActivatedAt: new Date().toISOString(),
        activationSource: "seed-demo-api",
        stripeCustomerId,
        stripeSubscriptionId,
        stripeSessionId,
        stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_BETA || "price_test_beta",
        stripeSubscriptionStatus: "active",
        subscriptionStatus: "active",
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    // --- Stripe test invoice (optional) ---
    let invoice;
    const stripe = getStripe();
    try {
      // Only create invoice if using test mode
      if (stripe && process.env.STRIPE_SECRET_KEY?.includes('sk_test')) {
        // First, ensure customer exists in Stripe
        try {
          await stripe.customers.create({
            id: stripeCustomerId,
            metadata: {
              firebaseUid: uid,
              demo: "true"
            }
          });
        } catch (err) {
          console.log("Customer might already exist, continuing...");
        }

        await stripe.invoiceItems.create({
          customer: stripeCustomerId,
          amount: 2500, // $25
          currency: "usd",
          description: "ClinicalScribe Pro (Demo)",
        });

        const inv = await stripe.invoices.create({
          customer: stripeCustomerId,
          collection_method: "send_invoice",
          days_until_due: 30,
        });

        invoice = await stripe.invoices.finalizeInvoice(inv.id);
      }
    } catch (err) {
      console.warn("Skipping Stripe invoice creation (demo mode)", err);
    }

    return NextResponse.json({
      ok: true,
      uid,
      betaActive: true,
      stripeCustomerId,
      stripeSubscriptionId,
      invoiceUrl: invoice?.hosted_invoice_url || null,
      message: "Demo subscription seeded successfully"
    });
  } catch (err) {
    console.error("Seed demo error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// GET method to check if demo mode is available
export async function GET() {
  const isDemoMode = process.env.NODE_ENV === 'development' || process.env.ENABLE_DEMO_MODE === 'true';
  
  return NextResponse.json({
    demoModeAvailable: isDemoMode,
    endpoint: "/api/seed-demo",
    method: "POST",
    requiresAuth: true
  });
}
