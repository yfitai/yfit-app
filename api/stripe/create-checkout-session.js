/**
 * Vercel Serverless Function: /api/stripe/create-checkout-session
 * Creates a Stripe Checkout session for the given plan.
 */
import Stripe from 'stripe';

// Price IDs from environment variables
const STRIPE_PRICES = {
  proMonthly: process.env.STRIPE_PRICE_PRO_MONTHLY || '',
  proYearly: process.env.STRIPE_PRICE_PRO_YEARLY || '',
  proLifetime: process.env.STRIPE_PRICE_PRO_LIFETIME || '',
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return res.status(503).json({ error: 'Payment processing not configured' });
  }

  const stripe = new Stripe(secretKey, { apiVersion: '2023-10-16' });

  const { plan, successUrl, cancelUrl } = req.body;

  try {
    // Handle free trial / signup — no payment needed
    if (plan === 'freeTrial' || plan === 'signup') {
      return res.json({ url: `${req.headers.origin || 'https://yfitai.com'}/signup?trial=true` });
    }

    const priceId = STRIPE_PRICES[plan];
    if (!priceId) {
      return res.status(400).json({ error: `No price configured for plan: ${plan}` });
    }

    const isLifetime = plan === 'proLifetime';
    const sessionParams = {
      mode: isLifetime ? 'payment' : 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl || `${req.headers.origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${req.headers.origin}/#pricing`,
      automatic_tax: { enabled: true },
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      metadata: {
        plan,
        source: 'yfit-app-landing',
      },
    };

    if (!isLifetime) {
      sessionParams.subscription_data = {
        trial_period_days: 0,
        metadata: { plan },
      };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);
    return res.json({ url: session.url });
  } catch (error) {
    console.error('[Stripe] Error creating checkout session:', error);
    return res.status(500).json({ error: 'Failed to create checkout session' });
  }
}
