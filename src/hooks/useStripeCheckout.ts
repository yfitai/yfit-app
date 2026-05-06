/**
 * Stripe Payment Links — direct redirect, no server-side API needed.
 * Stripe handles tax collection automatically.
 * Locale is appended as a query param so Stripe renders in the user's language.
 */
import { useTranslation } from "react-i18next";

const STRIPE_PAYMENT_LINKS: Record<string, string> = {
  proMonthly:  "https://buy.stripe.com/cNi6oGbHBgYD2S5bOZ3sI00",
  proYearly:   "https://buy.stripe.com/6oU5kCaDxbEj3W98CN3sI01",
  proLifetime: "https://buy.stripe.com/aFadR8bHB9wbfERdX73sI02",
};

// Map our i18n codes to Stripe-supported locale codes
// https://stripe.com/docs/js/appendix/supported_locales
const STRIPE_LOCALE_MAP: Record<string, string> = {
  en: "en",
  fr: "fr",
  es: "es",
  pt: "pt",
  zh: "zh",
  hi: "auto", // Stripe does not support Hindi — fall back to auto-detect
  de: "de",
  ja: "ja",
};

type Plan = "proMonthly" | "proYearly" | "proLifetime" | "freeTrial" | "signup";

interface CheckoutOptions {
  plan: Plan;
  onError?: (error: string) => void;
}

export function useStripeCheckout() {
  const { i18n } = useTranslation();

  const startCheckout = ({ plan }: CheckoutOptions) => {
    // Free / signup — redirect to signup page
    if (plan === "freeTrial" || plan === "signup" || !(plan in STRIPE_PAYMENT_LINKS)) {
      window.location.href = "/signup";
      return;
    }
    const stripeLocale = STRIPE_LOCALE_MAP[i18n.language] ?? "auto";
    const url = `${STRIPE_PAYMENT_LINKS[plan]}?locale=${stripeLocale}`;
    window.location.href = url;
  };

  // isLoading kept for API compatibility — always null since redirects are instant
  return { startCheckout, isLoading: null as Plan | null };
}
