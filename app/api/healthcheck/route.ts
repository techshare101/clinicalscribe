export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
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
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY not configured");
    }

    // Verify key format is valid
    const validPrefix = /^(sk|rk)_(test|live)_/.test(stripeKey);
    if (!validPrefix) {
      throw new Error("STRIPE_SECRET_KEY has invalid format");
    }

    // Ping Stripe API directly with a lightweight GET request
    const res = await fetch("https://api.stripe.com/v1/balance", {
      method: "GET",
      headers: { Authorization: `Bearer ${stripeKey}` },
      signal: AbortSignal.timeout(8000),
    });

    // 200 = full access, 403 = restricted key but reachable
    if (res.ok || res.status === 403) {
      results.stripe = "ok";
    } else if (res.status === 401) {
      results.stripe = "error"; // invalid key
    } else {
      results.stripe = "ok"; // Stripe is reachable
    }
  } catch (err: any) {
    console.error("Stripe healthcheck failed:", err?.message);
    results.stripe = "error";
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
