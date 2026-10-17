import Stripe from "stripe";

export { appBaseUrl } from "@/lib/app-url";

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key);
}

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

/**
 * Paid checkout is off until explicitly enabled.
 * Production launches without payments; set SEAL_PURCHASES_ENABLED=true when ready.
 */
export function areSealPurchasesEnabled(): boolean {
  const flag = process.env.SEAL_PURCHASES_ENABLED?.trim().toLowerCase();
  return flag === "true" || flag === "1";
}

export function canGrantSealsLocally(): boolean {
  return process.env.NODE_ENV !== "production" && !isStripeConfigured();
}

/** Stripe Checkout only when purchases are enabled and keys are present. */
export function canStartSealCheckout(): boolean {
  return areSealPurchasesEnabled() && isStripeConfigured();
}
