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

export function canGrantSealsLocally(): boolean {
  return process.env.NODE_ENV !== "production" && !isStripeConfigured();
}
