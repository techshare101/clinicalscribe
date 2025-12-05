export const dynamic = "force-dynamic";
export const runtime = "nodejs"; // ✅ force Node.js runtime

import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { adminDb } from "@/lib/firebase-admin"

// Lazy initialization to avoid build-time errors when env var is missing
function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY environment variable is required')
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY)
}

export async function POST(req: NextRequest) {
  const timestamp = Date.now()
  console.log(`[Stripe Webhook] Request received at ${new Date(timestamp).toISOString()}`)
  
  try {
    // Get raw body and signature
    const body = await req.text()
    const signature = req.headers.get('stripe-signature')

    if (!signature) {
      console.error('[Stripe Webhook] Missing stripe-signature header')
      return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    if (!webhookSecret) {
      console.error('[Stripe Webhook] STRIPE_WEBHOOK_SECRET not configured')
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
    }

    let event: Stripe.Event
    const stripe = getStripe()

    try {
      // Verify webhook signature
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
      console.log(`[Stripe Webhook] ✅ Signature verified, event type: ${event.type}`)
    } catch (err: any) {
      console.error('[Stripe Webhook] ❌ Signature verification failed:', err.message)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        console.log('[Stripe Webhook] 🎉 Processing checkout.session.completed')
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break
        
      case 'customer.subscription.created':
        console.log('[Stripe Webhook] 📝 Processing customer.subscription.created')
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription)
        break
        
      case 'customer.subscription.updated':
        console.log('[Stripe Webhook] 🔄 Processing customer.subscription.updated')
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break
        
      case 'customer.subscription.deleted':
        console.log('[Stripe Webhook] 🗑️ Processing customer.subscription.deleted')
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break
        
      case 'invoice.payment_succeeded':
        console.log('[Stripe Webhook] 💰 Processing invoice.payment_succeeded')
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice)
        break
        
      case 'invoice.payment_failed':
        console.log('[Stripe Webhook] ❌ Processing invoice.payment_failed')
        await handlePaymentFailed(event.data.object as Stripe.Invoice)
        break
        
      default:
        console.log(`[Stripe Webhook] ℹ️ Unhandled event type: ${event.type}`)
    }

    console.log(`[Stripe Webhook] ✅ Event processed successfully`)
    return NextResponse.json({ received: true, timestamp })
    
  } catch (error: any) {
    console.error('[Stripe Webhook] ❌ Error processing webhook:', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    })
    
    return NextResponse.json(
      { 
        error: 'Webhook processing failed',
        timestamp 
      },
      { status: 500 }
    )
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log(`[Stripe Webhook] 🎉 Checkout completed for session: ${session.id}`)
  
  // Get user ID from metadata (key should be 'uid' to match Firebase)
  const uid = session.metadata?.uid || session.metadata?.userId
  if (!uid) {
    console.error('[Stripe Webhook] ❌ No uid/userId in checkout session metadata')
    return
  }

  try {
    // 🔥 ACTIVATE BETA ACCESS FOR THE USER 🔥
    const activationData: any = {
      betaActive: true,
      subscriptionStatus: 'active',
      stripeCustomerId: session.customer as string,
      stripeSessionId: session.id,
      betaActivatedAt: new Date(),
      activationSource: 'stripe_checkout',
      updatedAt: new Date(),
    }
    
    // Add subscription ID if it's a subscription checkout
    if (session.subscription) {
      activationData.stripeSubscriptionId = session.subscription as string
    }
    
    // Add price ID from metadata if available
    if (session.metadata?.priceId) {
      activationData.stripePriceId = session.metadata.priceId
    }
    
    await adminDb.collection('profiles').doc(uid).set(activationData, { merge: true })
    
    console.log(`[Stripe Webhook] ✅ Beta access activated for user: ${uid}`)
    console.log('[Stripe Webhook] Activation data:', activationData)
    
  } catch (error: any) {
    console.error('[Stripe Webhook] ❌ Error activating beta access:', {
      uid,
      sessionId: session.id,
      error: error.message
    })
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log(`[Stripe Webhook] 📝 Subscription created: ${subscription.id}`)
  
  const uid = subscription.metadata?.uid || subscription.metadata?.userId
  if (!uid) {
    console.warn('[Stripe Webhook] ⚠️ No uid/userId in subscription metadata')
    return
  }

  await updateSubscriptionStatus(uid, {
    status: subscription.status,
    stripeSubscriptionId: subscription.id,
    currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
    currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
  })
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log(`[Stripe Webhook] 🔄 Subscription updated: ${subscription.id}`)
  
  const uid = subscription.metadata?.uid || subscription.metadata?.userId
  if (!uid) {
    console.warn('[Stripe Webhook] ⚠️ No uid/userId in subscription metadata')
    return
  }

  await updateSubscriptionStatus(uid, {
    status: subscription.status,
    currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
    currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
  })

  // If subscription becomes active, ensure beta access is enabled
  if (subscription.status === 'active') {
    console.log('[Stripe Webhook] 🔥 Subscription is active, ensuring beta access')
    await ensureBetaAccess(uid)
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log(`[Stripe Webhook] 🗑️ Subscription deleted: ${subscription.id}`)
  
  const uid = subscription.metadata?.uid || subscription.metadata?.userId
  if (!uid) {
    console.warn('[Stripe Webhook] ⚠️ No uid/userId in subscription metadata')
    return
  }

  // 🚫 Deactivate beta access when subscription is cancelled
  console.log(`[Stripe Webhook] 🚫 Deactivating beta access for user: ${uid}`)
  await adminDb.collection('profiles').doc(uid).update({
    betaActive: false,
    subscriptionStatus: 'cancelled',
    deactivatedAt: new Date(),
    updatedAt: new Date(),
  })
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log(`[Stripe Webhook] 💰 Payment succeeded for invoice: ${invoice.id}`)
  
  const subscriptionId = (invoice as any).subscription as string
  if (subscriptionId) {
    try {
      // Retrieve subscription to get user metadata
      const stripe = getStripe()
      const subscription = await stripe.subscriptions.retrieve(subscriptionId)
      const uid = subscription.metadata?.uid || subscription.metadata?.userId
      
      if (uid) {
        // Ensure beta access is active for successful payments
        await ensureBetaAccess(uid)
        console.log(`[Stripe Webhook] ✅ Payment processed for user: ${uid}`)
      }
    } catch (error: any) {
      console.error('[Stripe Webhook] ❌ Error processing payment success:', error.message)
    }
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  console.log(`[Stripe Webhook] ❌ Payment failed for invoice: ${invoice.id}`)
  
  const subscriptionId = (invoice as any).subscription as string
  if (subscriptionId) {
    try {
      // Retrieve subscription to get user metadata
      const stripe = getStripe()
      const subscription = await stripe.subscriptions.retrieve(subscriptionId)
      const uid = subscription.metadata?.uid || subscription.metadata?.userId
      
      if (uid) {
        // Update payment status but don't immediately deactivate beta access
        // (Give users a grace period to update payment method)
        await adminDb.collection('profiles').doc(uid).update({
          lastPaymentFailed: true,
          lastPaymentFailedAt: new Date(),
          updatedAt: new Date(),
        })
        
        console.log(`[Stripe Webhook] ⚠️ Payment failure recorded for user: ${uid}`)
      }
    } catch (error: any) {
      console.error('[Stripe Webhook] ❌ Error processing payment failure:', error.message)
    }
  }
}

async function ensureBetaAccess(uid: string) {
  try {
    const profileRef = adminDb.collection('profiles').doc(uid)
    const profile = await profileRef.get()
    
    if (profile.exists) {
      const data = profile.data()
      if (!data?.betaActive) {
        console.log(`[Stripe Webhook] 🔧 Enabling beta access for user ${uid} (subscription active)`)
        await profileRef.update({
          betaActive: true,
          updatedAt: new Date(),
        })
      }
    } else {
      console.warn(`[Stripe Webhook] ⚠️ Profile not found for user: ${uid}`)
    }
  } catch (error: any) {
    console.error('[Stripe Webhook] ❌ Error ensuring beta access:', {
      uid,
      error: error.message
    })
  }
}

async function updateSubscriptionStatus(uid: string, subscriptionData: any) {
  console.log(`[Stripe Webhook] 📆 Updating subscription status for user ${uid}: ${subscriptionData.status}`)
  
  try {
    await adminDb.collection('profiles').doc(uid).update({
      subscriptionStatus: subscriptionData.status,
      stripeSubscriptionId: subscriptionData.stripeSubscriptionId,
      currentPeriodStart: subscriptionData.currentPeriodStart,
      currentPeriodEnd: subscriptionData.currentPeriodEnd,
      updatedAt: new Date(),
    })
    
    console.log(`[Stripe Webhook] ✅ Subscription status updated for user: ${uid}`)
  } catch (error: any) {
    console.error('[Stripe Webhook] ❌ Error updating subscription status:', {
      uid,
      error: error.message
    })
  }
}
