import Stripe from "stripe";

// When STRIPE_SECRET_KEY is not set, the app runs in demo mode:
// the checkout step is simulated and no real charges occur.
export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

export const stripeEnabled = Boolean(stripe);

export function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}
