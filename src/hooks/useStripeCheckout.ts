/**
 * Stripe Payment Links — direct redirect, no server-side API needed.
 * Stripe handles tax collection automatically.
 */

const STRIPE_PAYMENT_LINKS: Record<string, string> = {
  proMonthly:  "https://buy.stripe.com/cNi6oGbHBgYD2S5bOZ3sI00",
  proYearly:   "https://buy.stripe.com/6oU5kCaDxbEj3W98CN3sI01",
  proLifetime: "https://buy.stripe.com/aFadR8bHB9wbfERdX73sI02",
};

type Plan = "proMonthly" | "proYearly" | "proLifetime" | "freeTrial" | "signup";

interface CheckoutOptions {
  plan: Plan;
  onError?: (error: string) => void;
}

export function useStripeCheckout() {
  const startCheckout = ({ plan }: CheckoutOptions) => {
    // Free / signup — redirect to signup page
    if (plan === "freeTrial" || plan === "signup" || !(plan in STRIPE_PAYMENT_LINKS)) {
      window.location.href = "/signup";
      return;
    }
    window.location.href = STRIPE_PAYMENT_LINKS[plan];
  };

  // isLoading kept for API compatibility — always null since redirects are instant
  return { startCheckout, isLoading: null as Plan | null };
}
