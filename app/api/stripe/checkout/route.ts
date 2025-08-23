import { NextResponse } from "next/server";
import Stripe from "stripe";
import { adminAuth } from "@/lib/firebaseAdmin";
import { getAppUrl } from "@/lib/env";

// Validate critical environment variables at startup
const stripeKey = process.env.STRIPE_SECRET_KEY;

if (!stripeKey) {
  console.error("❌ Missing STRIPE_SECRET_KEY in environment");
}

// Initialize Stripe with validation
const stripe = new Stripe(stripeKey || "sk_missing", {
  // Let Stripe SDK use its default compatible API version
});

export async function POST(req: Request) {
  console.log('🔄 Stripe Checkout: Request received at', new Date().toISOString());
  
  try {
    // Parse request body with error handling
    let body: any = {};
    try {
      body = await req.json();
      console.log('✅ Stripe Checkout: Request body parsed successfully');
    } catch (parseErr) {
      console.error("❌ Stripe Checkout: Failed to parse request body:", parseErr);
      return NextResponse.json(
        { error: "Invalid request body. Must be JSON." },
        { status: 400 }
      );
    }

    const { priceId, idToken } = body;

    console.log('🔄 Stripe Checkout: Request details:', { 
      priceId: priceId ? 'present' : 'missing', 
      idToken: idToken ? 'present' : 'missing',
      actualPriceId: priceId,
      tokenLength: idToken?.length || 0,
      timestamp: new Date().toISOString()
    });

    // Validate required fields
    if (!priceId) {
      console.error('❌ Stripe Checkout: Missing priceId');
      return NextResponse.json(
        { error: "Missing priceId in request body" },
        { status: 400 }
      );
    }

    if (!idToken) {
      console.error('❌ Stripe Checkout: Missing idToken');
      return NextResponse.json(
        { error: "Missing idToken in request body" },
        { status: 400 }
      );
    }

    // Check if Stripe is properly configured
    if (!stripeKey || stripeKey.startsWith("sk_missing")) {
      console.error('❌ Stripe Checkout: STRIPE_SECRET_KEY is not configured');
      return NextResponse.json(
        { error: "Server misconfigured: STRIPE_SECRET_KEY is missing" },
        { status: 500 }
      );
    }

    // Verify Firebase token with enhanced debugging
    console.log('🔐 Verifying Firebase token...');
    console.log('Token length:', idToken?.length || 0);
    console.log('Token starts with:', idToken?.substring(0, 20) || 'null');
    console.log('Server time before verification:', new Date().toISOString());
    
    let decoded, userId;
    const verificationStartTime = Date.now();
    
    try {
      decoded = await adminAuth.verifyIdToken(idToken);
      userId = decoded.uid;
      const verificationEndTime = Date.now();
      
      console.log('✅ Token verified for user:', userId);
      console.log('Verification took (ms):', verificationEndTime - verificationStartTime);
      console.log('Token issued at:', new Date(decoded.iat * 1000).toISOString());
      console.log('Token expires at:', new Date(decoded.exp * 1000).toISOString());
      console.log('Current server time:', new Date().toISOString());
      console.log('Time until expiry (ms):', (decoded.exp * 1000) - Date.now());
      console.log('Token age (ms):', Date.now() - (decoded.iat * 1000));
      
      // Check if token is close to expiry (within 5 minutes)
      const timeUntilExpiry = (decoded.exp * 1000) - Date.now();
      if (timeUntilExpiry < 5 * 60 * 1000) {
        console.warn('⚠️ Token expires soon:', timeUntilExpiry / 1000, 'seconds remaining');
      }
      
    } catch (authErr: any) {
      const verificationEndTime = Date.now();
      
      console.error('❌ Firebase token verification failed:', {
        error: authErr.message,
        code: authErr.code,
        type: authErr.constructor?.name,
        tokenProvided: !!idToken,
        tokenLength: idToken?.length || 0,
        verificationTime: verificationEndTime - verificationStartTime,
        serverTime: new Date().toISOString(),
        tokenPreview: idToken ? idToken.substring(0, 50) + '...' : 'null'
      });
      
      // Enhanced error analysis
      if (authErr.code === 'auth/id-token-expired') {
        console.error('🕒 Token has expired');
      } else if (authErr.code === 'auth/invalid-id-token') {
        console.error('📝 Token format is invalid');
      } else if (authErr.code === 'auth/project-not-found') {
        console.error('🏗️ Firebase project configuration issue');
      } else {
        console.error('❓ Unknown authentication error');
      }
      
      // Provide more specific error messages based on the error type
      let errorMessage = "Invalid or expired authentication token";
      if (authErr.code === 'auth/id-token-expired') {
        errorMessage = "Authentication token has expired. Please refresh and try again.";
      } else if (authErr.code === 'auth/invalid-id-token') {
        errorMessage = "Invalid authentication token format. Please log out and log back in.";
      } else if (authErr.code === 'auth/project-not-found') {
        errorMessage = "Server configuration error. Please contact support.";
      }
      
      return NextResponse.json(
        { 
          error: errorMessage,
          debug: {
            code: authErr.code,
            verificationTime: verificationEndTime - verificationStartTime,
            serverTime: new Date().toISOString()
          }
        },
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