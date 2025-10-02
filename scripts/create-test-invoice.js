/**
 * Usage:
 *   node scripts/create-test-invoice.js cus_12345
 *
 * Requires STRIPE_SECRET_KEY (test key)
 */

import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  console.error("❌ Missing STRIPE_SECRET_KEY environment variable");
  process.exit(1);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-11-20",
});

async function main() {
  const [customerId] = process.argv.slice(2);
  if (!customerId) {
    console.error("Usage: node create-test-invoice.js cus_12345");
    process.exit(1);
  }

  try {
    // 1. Create an invoice item (line item)
    await stripe.invoiceItems.create({
      customer: customerId,
      amount: 2000, // $20
      currency: "usd",
      description: "ClinicalScribe Pro (Test)",
    });

    // 2. Create invoice
    const invoice = await stripe.invoices.create({
      customer: customerId,
      collection_method: "send_invoice",
      days_until_due: 30,
    });

    // 3. Finalize invoice
    const finalized = await stripe.invoices.finalizeInvoice(invoice.id);

    console.log("✅ Test invoice created:", finalized.id, finalized.hosted_invoice_url);
  } catch (err) {
    console.error("❌ Error creating invoice:", err);
  }
}

main();