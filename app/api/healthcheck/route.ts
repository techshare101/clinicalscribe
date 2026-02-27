export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import Stripe from "stripe";
import admin from "firebase-admin";

export async function GET() {
  const results: Record<string, string> = {
    firebase: "error",
    stripe: "error",
    epic: "error",
  };

  // --- Firebase check ---
  try {
    if (!admin.apps.length) {
      const serviceAccount = JSON.parse(
        Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64!, "base64").toString()
      );
      admin.initializeApp({ 
        credential: admin.credential.cert(serviceAccount) 
      });
    }
    await admin.firestore().listCollections(); // simple ping
    results.firebase = "ok";
  } catch (err) {
    console.error("Firebase healthcheck failed:", err);
    results.firebase = "error";
  }

  // --- Stripe check ---
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY not configured");
    }
    
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2024-11-20" as any,
    });
    // Use a lightweight list call that works with most key permission levels
    await stripe.products.list({ limit: 1 });
    results.stripe = "ok";
  } catch (err: any) {
    console.error("Stripe healthcheck failed:", err?.message);
    // If the key exists but permissions are restricted, treat as degraded but reachable
    if (err?.type === "StripePermissionError" || err?.statusCode === 403) {
      results.stripe = "ok";
    } else {
      results.stripe = "error";
    }
  }

  // --- Epic SMART check ---
  try {
    const fhirBase = process.env.SMART_FHIR_BASE;
    if (fhirBase) {
      // Check the SMART configuration endpoint (standard FHIR discovery)
      const wellKnownUrl = `${fhirBase.replace(/\/$/, '')}/.well-known/smart-configuration`;
      const res = await fetch(wellKnownUrl, { 
        method: "GET",
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(8000)
      });
      if (res.ok) {
        const config = await res.json();
        // Verify it has expected SMART fields
        results.epic = config.authorization_endpoint ? "ok" : "error";
      } else {
        // Fallback: try the metadata endpoint
        const metaRes = await fetch(`${fhirBase.replace(/\/$/, '')}/metadata`, {
          method: "GET",
          headers: { Accept: "application/fhir+json" },
          signal: AbortSignal.timeout(8000)
        });
        results.epic = metaRes.ok ? "ok" : "error";
      }
    } else {
      results.epic = "not-configured";
    }
  } catch (err) {
    console.error("Epic healthcheck failed:", err);
    results.epic = "error";
  }

  // Return with appropriate status code
  const allOk = Object.values(results).every(status => 
    status === "ok" || status === "not-configured"
  );
  
  return NextResponse.json(
    { 
      status: allOk ? "healthy" : "degraded",
      services: results,
      timestamp: new Date().toISOString()
    },
    { status: allOk ? 200 : 503 }
  );
}
