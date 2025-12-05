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
    await stripe.balance.retrieve();
    results.stripe = "ok";
  } catch (err) {
    console.error("Stripe healthcheck failed:", err);
    results.stripe = "error";
  }

  // --- Epic SMART check ---
  try {
    const issuer = process.env.SMART_ISSUER;
    if (issuer) {
      const res = await fetch(issuer, { 
        method: "GET",
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      results.epic = res.ok ? "ok" : "error";
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
