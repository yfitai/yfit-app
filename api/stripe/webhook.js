/**
 * Stripe Webhook Handler — Vercel Serverless Function
 * Endpoint: /api/stripe/webhook
 * Method: POST
 *
 * Handles Stripe events and updates the Supabase subscriptions table.
 * Uses the Stripe service_role key so it can bypass RLS and update any user's row.
 *
 * Events handled:
 *   checkout.session.completed       → new subscription or one-time payment
 *   customer.subscription.updated    → plan change, renewal, reactivation
 *   customer.subscription.deleted    → cancellation
 *   invoice.payment_failed           → start grace period
 *   invoice.payment_succeeded        → clear grace period / renew period
 */

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// ── Stripe price ID → plan_type mapping ──────────────────────────────────────
// Add your Stripe Price IDs here after creating the products in Stripe.
// Find them at: dashboard.stripe.com → Products → click product → copy Price ID
const PRICE_TO_PLAN = {
  // Monthly recurring
  [process.env.STRIPE_PRICE_MONTHLY]:  'pro_monthly',
  // Yearly recurring
  [process.env.STRIPE_PRICE_YEARLY]:   'pro_yearly',
  // One-time lifetime
  [process.env.STRIPE_PRICE_LIFETIME]: 'pro_lifetime',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function getPlanFromPriceId(priceId) {
  return PRICE_TO_PLAN[priceId] || 'pro_monthly'; // safe fallback
}

function toTimestamp(unixSeconds) {
  return unixSeconds ? new Date(unixSeconds * 1000).toISOString() : null;
}

// ── Main handler ──────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-06-20',
  });

  // Use service_role key so the webhook can write to any user's row
  const supabase = createClient(
    process.env.SUPABASE_URL || 'https://mxggxpoxgqubojvumjlt.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // ── Verify Stripe signature ──────────────────────────────────────────────
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    // Vercel provides raw body via req.body when bodyParser is disabled
    const rawBody = await getRawBody(req);
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('[Stripe Webhook] Signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  console.log(`[Stripe Webhook] Event: ${event.type}`);

  try {
    switch (event.type) {

      // ── New checkout completed (subscription or one-time) ────────────────
      case 'checkout.session.completed': {
        const session = event.data.object;
        const customerId = session.customer;
        const customerEmail = session.customer_details?.email || session.customer_email;

        // Find the user by email
        const userId = await getUserIdByEmail(supabase, customerEmail);
        if (!userId) {
          console.warn(`[Stripe Webhook] No user found for email: ${customerEmail}`);
          break;
        }

        // Determine plan from line items
        let planType = 'pro_monthly';
        let priceId = null;

        if (session.mode === 'subscription') {
          // Retrieve the subscription to get price details
          const subscription = await stripe.subscriptions.retrieve(session.subscription);
          priceId = subscription.items.data[0]?.price?.id;
          planType = getPlanFromPriceId(priceId);

          await upsertSubscription(supabase, {
            userId,
            planType,
            status: 'active',
            platform: 'stripe',
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscription.id,
            stripePriceId: priceId,
            currentPeriodStart: toTimestamp(subscription.current_period_start),
            currentPeriodEnd: toTimestamp(subscription.current_period_end),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
            isLifetime: false,
          });

        } else if (session.mode === 'payment') {
          // One-time payment = lifetime
          const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
          priceId = lineItems.data[0]?.price?.id;
          planType = getPlanFromPriceId(priceId);

          await upsertSubscription(supabase, {
            userId,
            planType: 'pro_lifetime',
            status: 'active',
            platform: 'stripe',
            stripeCustomerId: customerId,
            stripeSubscriptionId: null,
            stripePriceId: priceId,
            currentPeriodStart: new Date().toISOString(),
            currentPeriodEnd: null, // never expires
            cancelAtPeriodEnd: false,
            isLifetime: true,
          });
        }

        console.log(`[Stripe Webhook] Activated ${planType} for user ${userId}`);
        break;
      }

      // ── Subscription updated (renewal, plan change, reactivation) ────────
      case 'customer.subscription.updated': {
        const sub = event.data.object;
        const priceId = sub.items.data[0]?.price?.id;
        const planType = getPlanFromPriceId(priceId);

        const userId = await getUserIdByStripeCustomer(supabase, sub.customer);
        if (!userId) break;

        await upsertSubscription(supabase, {
          userId,
          planType,
          status: sub.status === 'active' ? 'active' : sub.status,
          platform: 'stripe',
          stripeCustomerId: sub.customer,
          stripeSubscriptionId: sub.id,
          stripePriceId: priceId,
          currentPeriodStart: toTimestamp(sub.current_period_start),
          currentPeriodEnd: toTimestamp(sub.current_period_end),
          cancelAtPeriodEnd: sub.cancel_at_period_end,
          isLifetime: false,
          gracePeriodEndsAt: null, // clear any grace period
        });

        console.log(`[Stripe Webhook] Updated subscription to ${planType} for user ${userId}`);
        break;
      }

      // ── Subscription cancelled ───────────────────────────────────────────
      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        const userId = await getUserIdByStripeCustomer(supabase, sub.customer);
        if (!userId) break;

        // Downgrade to free — keep the row but reset plan
        const { error } = await supabase
          .from('subscriptions')
          .update({
            plan_type: 'free',
            status: 'canceled',
            cancel_at_period_end: false,
            current_period_end: toTimestamp(sub.current_period_end),
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId);

        if (error) console.error('[Stripe Webhook] Cancel update error:', error);
        else console.log(`[Stripe Webhook] Cancelled subscription for user ${userId}`);
        break;
      }

      // ── Payment failed → start 7-day grace period ────────────────────────
      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        if (!invoice.subscription) break;

        const userId = await getUserIdByStripeCustomer(supabase, invoice.customer);
        if (!userId) break;

        const graceEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

        const { error } = await supabase
          .from('subscriptions')
          .update({
            status: 'grace_period',
            grace_period_ends_at: graceEnd,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId);

        if (error) console.error('[Stripe Webhook] Grace period update error:', error);
        else console.log(`[Stripe Webhook] Grace period started for user ${userId} until ${graceEnd}`);
        break;
      }

      // ── Payment succeeded → clear grace period ───────────────────────────
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        if (!invoice.subscription) break;

        const userId = await getUserIdByStripeCustomer(supabase, invoice.customer);
        if (!userId) break;

        const sub = await stripe.subscriptions.retrieve(invoice.subscription);

        const { error } = await supabase
          .from('subscriptions')
          .update({
            status: 'active',
            grace_period_ends_at: null,
            current_period_start: toTimestamp(sub.current_period_start),
            current_period_end: toTimestamp(sub.current_period_end),
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId);

        if (error) console.error('[Stripe Webhook] Payment success update error:', error);
        else console.log(`[Stripe Webhook] Payment succeeded, grace period cleared for user ${userId}`);
        break;
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    return res.status(200).json({ received: true });

  } catch (err) {
    console.error('[Stripe Webhook] Handler error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// ── DB helpers ────────────────────────────────────────────────────────────────

async function getUserIdByEmail(supabase, email) {
  if (!email) return null;
  // Query user_profiles table which stores email
  const { data, error } = await supabase
    .from('user_profiles')
    .select('user_id')
    .eq('email', email.toLowerCase())
    .maybeSingle();

  if (error) {
    console.error('[Stripe Webhook] getUserIdByEmail error:', error);
    return null;
  }
  return data?.user_id || null;
}

async function getUserIdByStripeCustomer(supabase, stripeCustomerId) {
  if (!stripeCustomerId) return null;
  const { data, error } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_customer_id', stripeCustomerId)
    .maybeSingle();

  if (error) {
    console.error('[Stripe Webhook] getUserIdByStripeCustomer error:', error);
    return null;
  }
  return data?.user_id || null;
}

async function upsertSubscription(supabase, {
  userId, planType, status, platform,
  stripeCustomerId, stripeSubscriptionId, stripePriceId,
  currentPeriodStart, currentPeriodEnd, cancelAtPeriodEnd,
  isLifetime, gracePeriodEndsAt = null,
}) {
  const { error } = await supabase
    .from('subscriptions')
    .upsert({
      user_id: userId,
      plan_type: planType,
      status,
      platform,
      stripe_customer_id: stripeCustomerId,
      stripe_subscription_id: stripeSubscriptionId,
      stripe_price_id: stripePriceId,
      current_period_start: currentPeriodStart,
      current_period_end: currentPeriodEnd,
      cancel_at_period_end: cancelAtPeriodEnd,
      is_lifetime: isLifetime,
      grace_period_ends_at: gracePeriodEndsAt,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id',
    });

  if (error) {
    console.error('[Stripe Webhook] upsertSubscription error:', error);
    throw error;
  }
}

// ── Raw body reader (required for Stripe signature verification) ──────────────
// Vercel disables bodyParser for this route via config export below
function getRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

// Tell Vercel NOT to parse the body — Stripe needs the raw bytes for signature check
export const config = {
  api: {
    bodyParser: false,
  },
};
