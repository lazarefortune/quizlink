/**
 * Stripe client configuration
 *
 * SECURITY: Stripe secret key is server-side only.
 * Never expose secret keys to the frontend.
 */

import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY environment variable is not set");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  typescript: true,
});
