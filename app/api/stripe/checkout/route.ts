import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getAuth } from "firebase-admin/auth";
import { getApp, getApps, initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAppUrl } from "@/lib/env";

// Validate critical environment variables at startup
const stripeKey = process.env.STRIPE_SECRET_KEY;

if (!stripeKey) {
  console.error("❌ Missing STRIPE_SECRET_KEY in environment");
}

// Initialize Firebase Admin
if (!getApps().length) {
  try {
    const serviceAccount = JSON.parse(
      Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64!, 'base64').toString()
    )
    
    initializeApp({
      credential: cert(serviceAccount),
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    })
  } catch (firebaseErr) {
    console.error("❌ Firebase initialization failed:", firebaseErr);
  }
}

const db = getFirestore()
const stripe = new Stripe(stripeKey || "sk_missing", {
  // Let Stripe SDK use its default compatible API version
});

export async function POST(req: Request) {
  try {
    // Parse request body with error handling
    let body: any = {};
    try {
      body = await req.json();
    } catch (parseErr) {
      console.error("❌ Failed to parse request body:", parseErr);
      return NextResponse.json(
        { error: "Invalid request body. Must be JSON." },
        { status: 400 }
      );
    }

    const { priceId, idToken } = body;

    console.log('🔄 Checkout request received:', { 
      priceId: priceId ? 'present' : 'missing', 
      idToken: idToken ? 'present' : 'missing',
      actualPriceId: priceId
    });

    // Validate required fields
    if (!priceId) {
      return NextResponse.json(
        { error: "Missing priceId in request body" },
        { status: 400 }
      );
    }

    if (!idToken) {
      return NextResponse.json(
        { error: "Missing idToken in request body" },
        { status: 400 }
      );
    }

    // Check if Stripe is properly configured
    if (!stripeKey || stripeKey.startsWith("sk_missing")) {
      console.error('❌ STRIPE_SECRET_KEY is not configured');
      return NextResponse.json(
        { error: "Server misconfigured: STRIPE_SECRET_KEY is missing" },
        { status: 500 }
      );
    }

    // Verify Firebase token
    console.log('🔐 Verifying Firebase token...');
    let decoded, userId;
    try {
      decoded = await getAuth().verifyIdToken(idToken);
      userId = decoded.uid;
      console.log('✅ Token verified for user:', userId);
    } catch (authErr: any) {
      console.error('❌ Firebase token verification failed:', authErr);
      return NextResponse.json(
        { error: "Invalid or expired authentication token" },
        { status: 401 }
      );
    }

    const mode = "subscription"; // all your current plans are recurring now

    console.log('💳 Creating Stripe checkout session:', { priceId, mode, userId });

    // Create Stripe checkout session
    let session;
    try {
      const appUrl = getAppUrl();
      console.log('🌐 Using app URL:', appUrl);
      
      session = await stripe.checkout.sessions.create({
        mode,
        payment_method_types: ["card"],
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${appUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${appUrl}/cancel`,
        customer_email: decoded.email,
        metadata: { 
          userId,
          priceId 
        },
        subscription_data: {
          metadata: {
            userId,
          },
        },
      });
    } catch (stripeErr: any) {
      console.error('❌ Stripe session creation failed:', stripeErr);
      return NextResponse.json(
        { 
          error: `Stripe error: ${stripeErr.message}`,
          type: stripeErr.type || 'stripe_error',
          code: stripeErr.code || 'unknown'
        },
        { status: 500 }
      );
    }

    console.log('🎉 Checkout session created successfully:', session.id);
    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("❌ Stripe checkout error:", {
      message: err.message,
      type: err.type,
      code: err.code,
      stack: err.stack
    });
    return NextResponse.json(
      { error: err.message || "Unexpected server error" },
      { status: 500 }
    );
  }
}