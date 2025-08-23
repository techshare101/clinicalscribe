import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { adminDb } from "@/lib/firebaseAdmin"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

// In development, we'll use a test webhook secret
// In production, you'll get this from Stripe Dashboard -> Webhooks
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "whsec_test_webhook_secret"

export async function POST(req: NextRequest) {
  console.log('🔔 Webhook received')
  
  try {
    const body = await req.text()
    const sig = req.headers.get("stripe-signature")

    if (!sig) {
      console.error('❌ Missing stripe-signature header')
      return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 })
    }

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
      console.log('✅ Webhook signature verified, event type:', event.type)
    } catch (err: any) {
      console.error("❌ Webhook signature verification failed:", err.message)
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
    }

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed":
        console.log('🎉 Processing checkout.session.completed')
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break
      case "customer.subscription.created":
        console.log('📝 Processing customer.subscription.created')
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription)
        break
      case "customer.subscription.updated":
        console.log('🔄 Processing customer.subscription.updated')
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break
      case "customer.subscription.deleted":
        console.log('🗑️ Processing customer.subscription.deleted')
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break
      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("❌ Webhook error:", error)
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 })
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log("🎉 Checkout completed for session:", session.id)
  
  const userId = session.metadata?.userId
  if (!userId) {
    console.error("❌ No userId in checkout session metadata")
    return
  }

  try {
    // 🔥 ACTIVATE BETA ACCESS FOR THE USER 🔥
    await activateBetaAccess(userId, {
      stripeCustomerId: session.customer as string,
      stripeSubscriptionId: session.subscription as string,
      stripePriceId: session.metadata?.priceId,
      activatedAt: new Date(),
      activationSource: "stripe_checkout",
      sessionId: session.id
    })
    
    console.log(`🎊 Beta access activated for user: ${userId}!`)
  } catch (error) {
    console.error("❌ Error activating beta access:", error)
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log("📝 Subscription created:", subscription.id)
  
  const userId = subscription.metadata?.userId
  if (!userId) {
    console.warn("⚠️ No userId in subscription metadata")
    return
  }

  await updateSubscriptionStatus(userId, {
    status: subscription.status,
    stripeSubscriptionId: subscription.id,
    currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
    currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
  })
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log("🔄 Subscription updated:", subscription.id)
  
  const userId = subscription.metadata?.userId
  if (!userId) return

  await updateSubscriptionStatus(userId, {
    status: subscription.status,
    currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
    currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
  })

  // If subscription becomes active, ensure beta access is enabled
  if (subscription.status === 'active') {
    console.log('🔥 Subscription is active, ensuring beta access')
    await ensureBetaAccess(userId)
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log("🗑️ Subscription deleted:", subscription.id)
  
  const userId = subscription.metadata?.userId
  if (!userId) return

  // 🚫 Deactivate beta access when subscription is cancelled
  console.log(`🚫 Deactivating beta access for user: ${userId}`)
  await adminDb.collection("profiles").doc(userId).update({
    betaActive: false,
    subscriptionStatus: "cancelled",
    deactivatedAt: new Date(),
    updatedAt: new Date(),
  })
}

async function activateBetaAccess(userId: string, paymentInfo: any) {
  console.log(`🔥 Activating beta access for user ${userId}...`)
  
  const updateData = {
    betaActive: true,
    subscriptionStatus: "active",
    stripeCustomerId: paymentInfo.stripeCustomerId,
    stripeSubscriptionId: paymentInfo.stripeSubscriptionId,
    stripePriceId: paymentInfo.stripePriceId,
    betaActivatedAt: paymentInfo.activatedAt,
    activationSource: paymentInfo.activationSource,
    lastPaymentSessionId: paymentInfo.sessionId,
    updatedAt: new Date(),
  }

  await adminDb.collection("profiles").doc(userId).update(updateData)
  console.log(`✅ User ${userId} profile updated:`, updateData)
}

async function ensureBetaAccess(userId: string) {
  const profile = await adminDb.collection("profiles").doc(userId).get()
  if (profile.exists) {
    const data = profile.data()
    if (!data?.betaActive) {
      console.log(`🔧 Enabling beta access for user ${userId} (subscription active)`)
      await adminDb.collection("profiles").doc(userId).update({
        betaActive: true,
        updatedAt: new Date(),
      })
    }
  }
}

async function updateSubscriptionStatus(userId: string, subscriptionData: any) {
  console.log(`📊 Updating subscription status for user ${userId}:`, subscriptionData.status)
  
  await adminDb.collection("profiles").doc(userId).update({
    subscriptionStatus: subscriptionData.status,
    stripeSubscriptionId: subscriptionData.stripeSubscriptionId,
    currentPeriodStart: subscriptionData.currentPeriodStart,
    currentPeriodEnd: subscriptionData.currentPeriodEnd,
    updatedAt: new Date(),
  })
}