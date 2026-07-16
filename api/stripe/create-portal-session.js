/**
 * Vercel Serverless Function: /api/stripe/create-portal-session
 * Creates a Stripe Billing Portal session for the authenticated user.
 *
 * The broken static bpc_ link was replaced with this dynamic endpoint in Session 23.
 * It looks up the user's stripe_customer_id from Supabase and creates a one-time portal URL.
 */
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

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

  // Create Supabase client and verify the user
  const supabase = createClient(
    process.env.SUPABASE_URL || 'https://mxggxpoxgqubojvumjlt.supabase.co',
    process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14Z2d4cG94Z3F1Ym9qdnVtamx0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxMjI5NjYsImV4cCI6MjA3MjY5ODk2Nn0.EWlmoH-_kw1A_gbs1rECLWkC30X50IOGx3GDSDNSYE4',
    {
      global: {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    }
  );

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Look up the user's Stripe customer ID from the subscriptions table
  const { data: subscription, error: subError } = await supabase
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .single();

  if (subError || !subscription?.stripe_customer_id) {
    console.error('[Portal] No Stripe customer found for user:', user.id, subError);
    return res.status(404).json({ error: 'No Stripe subscription found for this account' });
  }

  const stripe = new Stripe(secretKey, { apiVersion: '2023-10-16' });

  try {
    const origin = req.headers.origin || 'https://yfitai.com';
    const returnUrl = `${origin}/subscription`;

    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: returnUrl,
    });

    return res.json({ url: session.url });
  } catch (error) {
    console.error('[Portal] Error creating portal session:', error);
    return res.status(500).json({ error: 'Failed to create billing portal session' });
  }
}
