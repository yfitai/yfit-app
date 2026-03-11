import Stripe from "stripe";
import express from "express";

// Initialize Stripe with the secret key from environment
function getStripe(): Stripe | null {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    console.warn("[Stripe] STRIPE_SECRET_KEY not set");
    return null;
  }
  return new Stripe(secretKey, { apiVersion: "2026-02-25.clover" });
}

// Price IDs - these will be populated after products are created in Stripe
// They are read from environment variables so they can be set without code changes
export const STRIPE_PRICES = {
  proMonthly: process.env.STRIPE_PRICE_PRO_MONTHLY || "",
  proYearly: process.env.STRIPE_PRICE_PRO_YEARLY || "",
  proLifetime: process.env.STRIPE_PRICE_PRO_LIFETIME || "",
};

// Plan details for creating products/prices if they don't exist
const PLAN_DEFINITIONS = [
  {
    key: "proMonthly",
    name: "YFIT Pro Monthly",
    description: "Full access to all YFIT Pro features, billed monthly",
    amount: 1299, // $12.99 in cents
    currency: "usd",
    interval: "month" as const,
    type: "recurring" as const,
  },
  {
    key: "proYearly",
    name: "YFIT Pro Yearly",
    description: "Full access to all YFIT Pro features, billed yearly (save 35%)",
    amount: 9999, // $99.99 in cents
    currency: "usd",
    interval: "year" as const,
    type: "recurring" as const,
  },
  {
    key: "proLifetime",
    name: "YFIT Pro Lifetime",
    description: "Lifetime access to all YFIT Pro features — pay once, own forever",
    amount: 24999, // $249.99 in cents
    currency: "usd",
    type: "one_time" as const,
  },
];

/**
 * Creates Stripe products and prices if they don't exist yet.
 * Returns a map of plan key -> Stripe price ID.
 */
export async function ensureStripeProducts(): Promise<Record<string, string>> {
  const stripe = getStripe();
  if (!stripe) return {};

  const priceIds: Record<string, string> = {};

  for (const plan of PLAN_DEFINITIONS) {
    // Check if price ID is already set in env
    const envKey = `STRIPE_PRICE_${plan.key.replace(/([A-Z])/g, "_$1").toUpperCase()}`;
    const existingPriceId = process.env[envKey];
    if (existingPriceId) {
      priceIds[plan.key] = existingPriceId;
      continue;
    }

    try {
      // Search for existing product by name
      const products = await stripe.products.search({
        query: `name:"${plan.name}"`,
        limit: 1,
      });

      let productId: string;
      if (products.data.length > 0) {
        productId = products.data[0].id;
        console.log(`[Stripe] Found existing product: ${plan.name} (${productId})`);
      } else {
        // Create new product
        const product = await stripe.products.create({
          name: plan.name,
          description: plan.description,
          tax_code: "txcd_10000000", // General - tangible goods/services
        });
        productId = product.id;
        console.log(`[Stripe] Created product: ${plan.name} (${productId})`);
      }

      // Search for existing price for this product
      const prices = await stripe.prices.list({
        product: productId,
        active: true,
        limit: 10,
      });

      const matchingPrice = prices.data.find(p => {
        if (p.unit_amount !== plan.amount || p.currency !== plan.currency) return false;
        if (plan.type === "recurring") {
          return p.type === "recurring" && p.recurring?.interval === plan.interval;
        }
        return p.type === "one_time";
      });

      if (matchingPrice) {
        priceIds[plan.key] = matchingPrice.id;
        console.log(`[Stripe] Found existing price for ${plan.name}: ${matchingPrice.id}`);
      } else {
        // Create new price
        const priceData: Stripe.PriceCreateParams = {
          product: productId,
          unit_amount: plan.amount,
          currency: plan.currency,
        };

        if (plan.type === "recurring") {
          priceData.recurring = { interval: plan.interval! };
        }

        const price = await stripe.prices.create(priceData);
        priceIds[plan.key] = price.id;
        console.log(`[Stripe] Created price for ${plan.name}: ${price.id}`);
      }
    } catch (error) {
      console.error(`[Stripe] Error setting up product ${plan.name}:`, error);
    }
  }

  return priceIds;
}

// Cache price IDs after first load
let cachedPriceIds: Record<string, string> | null = null;

async function getPriceIds(): Promise<Record<string, string>> {
  if (cachedPriceIds) return cachedPriceIds;
  cachedPriceIds = await ensureStripeProducts();
  return cachedPriceIds;
}

/**
 * Register Stripe REST endpoints on the Express app.
 * These are plain REST routes (not tRPC) because the webhook needs raw body access.
 */
export function registerStripeRoutes(app: express.Application): void {
  // Create checkout session
  app.post("/api/stripe/create-checkout-session", express.json(), async (req, res) => {
    const stripe = getStripe();
    if (!stripe) {
      res.status(503).json({ error: "Payment processing not configured" });
      return;
    }

    const { plan, successUrl, cancelUrl } = req.body as {
      plan: "proMonthly" | "proYearly" | "proLifetime" | "freeTrial";
      successUrl: string;
      cancelUrl: string;
    };

    try {
      const priceIds = await getPriceIds();

      // Handle free trial — no payment needed, redirect to app signup
      if (plan === "freeTrial") {
        res.json({ url: process.env.APP_SIGNUP_URL || "https://yfitai.com/signup?trial=true" });
        return;
      }

      const priceId = priceIds[plan];
      if (!priceId) {
        res.status(400).json({ error: `No price configured for plan: ${plan}` });
        return;
      }

      const isLifetime = plan === "proLifetime";

      const sessionParams: Stripe.Checkout.SessionCreateParams = {
        mode: isLifetime ? "payment" : "subscription",
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: successUrl || `${req.headers.origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: cancelUrl || `${req.headers.origin}/#pricing`,
        automatic_tax: { enabled: true },
        allow_promotion_codes: true,
        billing_address_collection: "auto",
        metadata: {
          plan,
          source: "yfit-marketing-website",
        },
      };

      // Add trial period for monthly/yearly plans
      if (!isLifetime) {
        sessionParams.subscription_data = {
          trial_period_days: 0,
          metadata: { plan },
        };
      }

      const session = await stripe.checkout.sessions.create(sessionParams);
      res.json({ url: session.url });
    } catch (error) {
      console.error("[Stripe] Error creating checkout session:", error);
      res.status(500).json({ error: "Failed to create checkout session" });
    }
  });

  // Webhook handler — must use raw body
  app.post(
    "/api/stripe/webhook",
    express.raw({ type: "application/json" }),
    async (req, res) => {
      const stripe = getStripe();
      if (!stripe) {
        res.status(503).send("Payment processing not configured");
        return;
      }

      const sig = req.headers["stripe-signature"] as string;
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

      if (!webhookSecret) {
        console.warn("[Stripe] STRIPE_WEBHOOK_SECRET not set — skipping signature verification");
        res.json({ received: true });
        return;
      }

      let event: Stripe.Event;
      try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
      } catch (err) {
        console.error("[Stripe] Webhook signature verification failed:", err);
        res.status(400).send(`Webhook Error: ${(err as Error).message}`);
        return;
      }

      console.log(`[Stripe] Webhook received: ${event.type}`);

      // Handle events
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as Stripe.Checkout.Session;
          console.log(`[Stripe] Checkout completed for session: ${session.id}, plan: ${session.metadata?.plan}`);
          // TODO: Update user subscription status in database
          // const customerId = session.customer as string;
          // const plan = session.metadata?.plan;
          break;
        }
        case "customer.subscription.created":
        case "customer.subscription.updated": {
          const subscription = event.data.object as Stripe.Subscription;
          console.log(`[Stripe] Subscription ${event.type}: ${subscription.id}, status: ${subscription.status}`);
          // TODO: Update subscription status in database
          break;
        }
        case "customer.subscription.deleted": {
          const subscription = event.data.object as Stripe.Subscription;
          console.log(`[Stripe] Subscription cancelled: ${subscription.id}`);
          // TODO: Revoke user access in database
          break;
        }
        case "invoice.payment_failed": {
          const invoice = event.data.object as Stripe.Invoice;
          console.log(`[Stripe] Payment failed for invoice: ${invoice.id}`);
          // TODO: Notify user of payment failure
          break;
        }
        default:
          console.log(`[Stripe] Unhandled event type: ${event.type}`);
      }

      res.json({ received: true });
    }
  );

  // Get available plans (for frontend to know if Stripe is configured)
  app.get("/api/stripe/plans", async (_req, res) => {
    const stripe = getStripe();
    if (!stripe) {
      res.json({ configured: false, plans: {} });
      return;
    }
    const priceIds = await getPriceIds();
    res.json({
      configured: true,
      plans: {
        proMonthly: { priceId: priceIds.proMonthly, amount: 1299, currency: "usd" },
        proYearly: { priceId: priceIds.proYearly, amount: 9999, currency: "usd" },
        proLifetime: { priceId: priceIds.proLifetime, amount: 24999, currency: "usd" },
      },
    });
  });
}
