import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { getStorage } from "firebase-admin/storage";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-11-20" as any,
});

async function clearUser(uid: string, stripeCustomerId?: string) {
  const deletedCounts = {
    soapNotes: 0,
    patientSessions: 0,
    storageFiles: 0,
    stripeInvoices: 0,
  };

  // 1) Delete SOAP notes
  const notesSnap = await adminDb.collection("soapNotes").where("userId", "==", uid).get();
  if (!notesSnap.empty) {
    const batch = adminDb.batch();
    notesSnap.forEach((doc) => {
      batch.delete(doc.ref);
      deletedCounts.soapNotes++;
    });
    await batch.commit();
  }

  // 2) Delete patient sessions
  const sessSnap = await adminDb.collection("patientSessions").where("userId", "==", uid).get();
  if (!sessSnap.empty) {
    const batch2 = adminDb.batch();
    sessSnap.forEach((doc) => {
      batch2.delete(doc.ref);
      deletedCounts.patientSessions++;
    });
    await batch2.commit();
  }

  // 3) Delete PDFs from storage
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
    console.warn(`Storage cleanup error for ${uid}:`, err);
  }

  // 4) Delete Stripe invoices
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
      console.warn(`Skipping Stripe invoice cleanup for ${uid}:`, err);
    }
  }

  // 5) Reset profile flags
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

  return deletedCounts;
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

    // TODO: Add admin role check here
    // For now, we'll just check if the user is authenticated

    // Fetch all demo accounts
    const snapshot = await adminDb
      .collection("profiles")
      .where("activationSource", "in", ["seed-demo-api", "seed-script"])
      .get();

    const accounts = snapshot.docs.map((doc) => ({
      uid: doc.id,
      stripeCustomerId: doc.get("stripeCustomerId"),
    }));

    const totalCounts = {
      soapNotes: 0,
      patientSessions: 0,
      storageFiles: 0,
      stripeInvoices: 0,
    };

    // Clear each account
    for (const account of accounts) {
      try {
        const counts = await clearUser(account.uid, account.stripeCustomerId);
        totalCounts.soapNotes += counts.soapNotes;
        totalCounts.patientSessions += counts.patientSessions;
        totalCounts.storageFiles += counts.storageFiles;
        totalCounts.stripeInvoices += counts.stripeInvoices;
      } catch (err) {
        console.error(`Failed to clear account ${account.uid}:`, err);
      }
    }

    return NextResponse.json({ 
      ok: true, 
      clearedAccounts: accounts.length,
      deletedCounts: totalCounts,
      message: `Cleared ${accounts.length} demo accounts successfully`
    });
  } catch (err) {
    console.error("Clear all demos error:", err);
    return NextResponse.json({ error: "Failed to clear all demo accounts" }, { status: 500 });
  }
}
