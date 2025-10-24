import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { getStorage } from "firebase-admin/storage";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-11-20" as any,
});

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

    // TODO: Add admin role check here
    // For now, we'll just check if the user is authenticated

    const { uid, stripeCustomerId } = await req.json();
    if (!uid) {
      return NextResponse.json({ error: "UID required" }, { status: 400 });
    }

    let deletedCounts = {
      soapNotes: 0,
      patientSessions: 0,
      storageFiles: 0,
      stripeInvoices: 0,
    };

    // 1️⃣ Delete SOAP notes
    const notesSnap = await adminDb.collection("soapNotes").where("userId", "==", uid).get();
    if (!notesSnap.empty) {
      const batch = adminDb.batch();
      notesSnap.forEach((doc) => {
        batch.delete(doc.ref);
        deletedCounts.soapNotes++;
      });
      await batch.commit();
    }

    // 2️⃣ Delete patient sessions
    const sessSnap = await adminDb.collection("patientSessions").where("userId", "==", uid).get();
    if (!sessSnap.empty) {
      const batch2 = adminDb.batch();
      sessSnap.forEach((doc) => {
        batch2.delete(doc.ref);
        deletedCounts.patientSessions++;
      });
      await batch2.commit();
    }

    // 3️⃣ Delete PDFs from Storage
    try {
      const bucket = getStorage().bucket();
      const [files] = await bucket.getFiles({ prefix: `pdfs/${uid}/` });
      await Promise.all(files.map(async (file) => {
        try {
          await file.delete();
          deletedCounts.storageFiles++;
        } catch (err) {
          console.warn(`Failed to delete file ${file.name}:`, err);
        }
      }));
    } catch (err) {
      console.warn("Storage cleanup error:", err);
    }

    // 4️⃣ Delete Stripe test invoices if customer exists
    if (stripeCustomerId && process.env.STRIPE_SECRET_KEY?.includes('sk_test')) {
      try {
        const invoices = await stripe.invoices.list({ 
          customer: stripeCustomerId, 
          limit: 100 
        });
        
        for (const inv of invoices.data) {
          try {
            if (inv.status === "draft") {
              await stripe.invoices.del(inv.id);
              deletedCounts.stripeInvoices++;
            } else if (inv.status === "open") {
              await stripe.invoices.voidInvoice(inv.id);
              deletedCounts.stripeInvoices++;
            }
          } catch (err) {
            console.warn(`Failed to delete/void invoice ${inv.id}:`, err);
          }
        }
      } catch (err) {
        console.warn("Stripe invoice cleanup skipped:", err);
      }
    }

    // 5️⃣ Reset profile flags
    await adminDb.collection("profiles").doc(uid).set(
      {
        betaActive: false,
        subscriptionStatus: "inactive",
        stripeSubscriptionStatus: "canceled",
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        stripeSessionId: null,
        stripePriceId: null,
        updatedAt: new Date().toISOString(),
        // Keep activationSource to track it was a demo account
        activationSource: "seed-demo-api",
      },
      { merge: true }
    );

    return NextResponse.json({ 
      ok: true, 
      uid,
      cleared: deletedCounts,
      message: "Demo data cleared successfully"
    });
  } catch (err) {
    console.error("Clear demo error:", err);
    return NextResponse.json({ error: "Failed to clear demo data" }, { status: 500 });
  }
}
