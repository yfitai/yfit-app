import { useState } from "react";

type Plan = "proMonthly" | "proYearly" | "proLifetime" | "freeTrial";

interface CheckoutOptions {
  plan: Plan;
  onError?: (error: string) => void;
}

export function useStripeCheckout() {
  const [isLoading, setIsLoading] = useState<Plan | null>(null);

  const startCheckout = async ({ plan, onError }: CheckoutOptions) => {
    // Free plan — redirect to signup
    if (plan === "freeTrial" || plan === undefined) {
      window.location.href = "/signup";
      return;
    }

    setIsLoading(plan);

    try {
      const origin = window.location.origin;
      const response = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan,
          successUrl: `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${origin}/#pricing`,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `Server error: ${response.status}`);
      }

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (error) {
      console.error("[Stripe] Checkout error:", error);
      const message = error instanceof Error ? error.message : "Payment failed. Please try again.";
      if (onError) {
        onError(message);
      } else {
        alert(message);
      }
    } finally {
      setIsLoading(null);
    }
  };

  return { startCheckout, isLoading };
}
