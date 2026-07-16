/**
 * Vercel Serverless Function: /api/stripe/create-portal-session
 * Creates a Stripe Billing Portal session for the authenticated user.
 *
 * Session 23 v1: Replaced broken hardcoded bpc_ link with this dynamic endpoint.
 * Session 23 v2: Added email fallback — if stripe_customer_id is NULL in the
 * subscriptions table (e.g., owner account set up before webhook was live, or
 * webhook email lookup failed), we search Stripe for a customer matching the
 * user's email. We also backfill stripe_customer_id in Supabase for future calls.
 */
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://mxggxpoxgqubojvumjlt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14Z2d4cG94Z3F1Ym9qdnVtamx0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxMjI5NjYsImV4cCI6MjA3MjY5ODk2Nn0.EWlmoH-_kw1A_gbs1rECLWkC30X50IOGx3GDSDNSYE4';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return res.status(503).json({ error: 'Payment processing not configured' });
  }

  // Get the Supabase auth token from the Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }
  const accessToken = authHeader.split(' ')[1];

  // Create Supabase client authenticated as the calling user (respects RLS)
  const supabase = createClient(
    process.env.SUPABASE_URL || SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY || SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
  );

  // Verify the user and get their email
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const stripe = new Stripe(secretKey, { apiVersion: '2023-10-16' });

  // ── Step 1: Try to get stripe_customer_id from the subscriptions table ──────
  let stripeCustomerId = null;

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .single();

  if (subscription?.stripe_customer_id) {
    stripeCustomerId = subscription.stripe_customer_id;
    console.log('[Portal] Found stripe_customer_id in DB:', stripeCustomerId);
  } else {
    // ── Step 2: Fallback — search Stripe for a customer matching the user's email ──
    // This handles accounts where the webhook fired before the user profile existed,
    // or where the owner account was set up manually before the webhook was live.
    console.log('[Portal] stripe_customer_id is NULL, searching Stripe by email:', user.email);
    try {
      const customers = await stripe.customers.list({ email: user.email, limit: 5 });

      const activeCustomer = customers.data.find(c => !c.deleted);
      if (!activeCustomer) {
        console.error('[Portal] No Stripe customer found for email:', user.email);
        return res.status(404).json({
          error: 'No Stripe subscription found for this account. Please contact support@yfitai.com.'
        });
      }

      stripeCustomerId = activeCustomer.id;
      console.log('[Portal] Found Stripe customer by email:', stripeCustomerId);

      // ── Step 3: Backfill stripe_customer_id in Supabase so future calls skip this lookup ──
      // Use service-role key if available (bypasses RLS); otherwise fall back to anon key
      // (the user's own row update is allowed by RLS policy)
      const supabaseAdmin = createClient(
        process.env.SUPABASE_URL || SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || SUPABASE_ANON_KEY
      );
      const { error: backfillError } = await supabaseAdmin
        .from('subscriptions')
        .upsert(
          { user_id: user.id, stripe_customer_id: stripeCustomerId, updated_at: new Date().toISOString() },
          { onConflict: 'user_id' }
        );

      if (backfillError) {
        // Non-fatal — portal will still work even if backfill fails
        console.warn('[Portal] Could not backfill stripe_customer_id:', backfillError.message);
      } else {
        console.log('[Portal] Backfilled stripe_customer_id for user:', user.id);
      }
    } catch (stripeSearchError) {
      console.error('[Portal] Stripe customer search failed:', stripeSearchError.message);
      return res.status(500).json({
        error: 'Failed to locate your billing account. Please contact support@yfitai.com.'
      });
    }
  }

  // ── Step 4: Create the one-time Stripe Customer Portal session URL ───────────
  try {
    const origin = req.headers.origin || 'https://yfitai.com';
    const returnUrl = `${origin}/subscription`;

    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: returnUrl,
    });

    return res.json({ url: session.url });
  } catch (error) {
    console.error('[Portal] Error creating portal session:', error);

    if (error.code === 'resource_missing' || error.type === 'invalid_request_error') {
      return res.status(400).json({
        error: 'Your Stripe account does not have an active subscription. Please subscribe first.'
      });
    }

    return res.status(500).json({ error: 'Failed to create billing portal session. Please try again.' });
  }
}
