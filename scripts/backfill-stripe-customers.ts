import admin from "firebase-admin";
import Stripe from "stripe";

// Check if running in dry-run mode
const DRY_RUN = process.argv.includes("--dry-run");

// Preflight env validation
function requireEnv(name: string) {
  const v = process.env[name];
  if (!v || v.trim() === "") {
    throw new Error(`Missing required env var: ${name}`);
  }
  return v;
}

const STRIPE_SECRET_KEY = requireEnv("STRIPE_SECRET_KEY");
const SERVICE_ACCOUNT_B64 = requireEnv("FIREBASE_SERVICE_ACCOUNT_BASE64");

// Initialize Stripe
const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

// Initialize Firebase Admin
function initFirebase() {
  if ((admin.apps?.length ?? 0) === 0) {
    const serviceAccount = JSON.parse(
      Buffer.from(SERVICE_ACCOUNT_B64, "base64").toString("utf-8")
    );

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
  return admin.firestore();
}

async function backfill() {
  const db = initFirebase();

  console.log(`\n🔄 ${DRY_RUN ? "DRY RUN" : "LIVE RUN"} - Starting Stripe customer backfill...\n`);

  // Get all beta-active profiles
  let snapshot;
  try {
    snapshot = await db
      .collection("profiles")
      .where("betaActive", "==", true)
      .get();
  } catch (e) {
    console.error("❌ Firestore query failed: ", e);
    throw e;
  }

  if (!snapshot) {
    console.error("❌ Firestore returned undefined snapshot");
    return;
  }

  if (snapshot.empty) {
    console.log("⚠️ No beta-active profiles found");
    return;
  }

  if (typeof snapshot.size !== "number") {
    console.warn("⚠️ Snapshot size is not a number: ", (snapshot as any).size);
  }

  console.log(`📝 Found ${snapshot.size} beta-active profiles\n`);

  // Process each profile
  for (const doc of snapshot.docs) {
    const uid = doc.id;
    const profile = doc.data();

    console.log(`🔎 Processing ${uid} (${profile.email || "no email"})`);

    try {
      // If already has stripeCustomerId, use it
      let stripeCustomerId = profile.stripeCustomerId;

      if (!stripeCustomerId) {
        if (!profile.email) {
          console.warn(`⚠️ Profile ${uid} missing email, skipping`);
          continue;
        }

        // Look up customer by email
        let customers;
        try {
          customers = await stripe.customers.list({
            email: profile.email,
            limit: 1,
          });
        } catch (err) {
          console.error("❌ Stripe customers.list failed:", err);
          continue;
        }

        if (!customers || !Array.isArray(customers.data)) {
          console.error("❌ Unexpected Stripe customers.list response: ", customers);
          continue;
        }

        if (customers.data.length === 0) {
          console.warn(`❌ No Stripe customer found for ${profile.email}`);
          continue;
        }

        stripeCustomerId = customers.data[0].id;
        console.log(`✅ Found Stripe customer ${stripeCustomerId}`);
      }

      // Look up subscriptions
      let subs;
      try {
        subs = await stripe.subscriptions.list({
          customer: stripeCustomerId,
          limit: 1,
          status: "all",
        });
      } catch (err) {
        console.error("❌ Stripe subscriptions.list failed:", err);
        subs = { data: [] } as any;
      }

      const subData = {} as any;

      if (subs && Array.isArray(subs.data) && subs.data.length > 0) {
        const sub = subs.data[0];
        const item = sub.items?.data?.[0];

        if (item?.price?.id) {
          subData.stripePriceId = item.price.id;
        }
        subData.stripeSubscriptionId = sub.id;
        subData.stripeSubscriptionStatus = sub.status;

        console.log(
          `📦 Subscription ${sub.id} — ${item.price.id} — ${sub.status}`
        );
      } else {
        console.log(`ℹ️ No subscription found for ${stripeCustomerId}`);
      }

      // Update profile
      const updateData = {
        stripeCustomerId,
        ...subData,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      if (DRY_RUN) {
        console.log(`💡 [Dry Run] Would update profile ${uid}:`, updateData);
      } else {
        await db.collection("profiles").doc(uid).set(updateData, { merge: true });
        console.log(`✅ Updated Firestore profile for ${uid}`);
      }
    } catch (err) {
      console.error(`❌ Failed for ${uid}:`, err instanceof Error ? err.message : String(err));
    }
  }

  console.log("\n🎉 Backfill complete");
}

// Run the backfill
backfill().catch((err) => {
  console.error("Migration failed:", err instanceof Error ? err.message : String(err));
  process.exit(1);
});