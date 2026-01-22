"use server";

import { auth } from "@/lib/auth";
import { stripe } from "@/lib/stripe/stripe-client";
import { getCoinPack, isValidPackId } from "@/lib/stripe/coin-packs";

/**
 * Server Action to create Stripe checkout session
 */

export type CreateCheckoutResponse =
  | { success: true; url: string; sessionId: string }
  | { success: false; error: string };

export async function createCheckoutSession(
  packId: string
): Promise<CreateCheckoutResponse> {
  try {
    // Verify authentication
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    // Validate pack ID
    if (!isValidPackId(packId)) {
      return { success: false, error: "Invalid pack ID" };
    }

    const pack = getCoinPack(packId);
    if (!pack) {
      return { success: false, error: "Pack not found" };
    }

    // Get base URL for redirects
  const baseUrl =
  process.env.NEXT_PUBLIC_BASE_URL ??
  (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000");

    // Create Stripe Checkout Session
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: `Pack ${packId} - ${pack.coins} coins`,
              description: `${pack.coins} coins pour QuizLink`,
            },
            unit_amount: pack.price * 100, // Convert to cents
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId: session.user.id,
        packId: pack.id,
        coins: pack.coins.toString(),
      },
      success_url: `${baseUrl}/pricing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/pricing?canceled=true`,
      customer_email: session.user.email || undefined,
    });

    return { success: true, url: checkoutSession.url || "", sessionId: checkoutSession.id };
  } catch (error) {
    console.error("[createCheckoutSession] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create checkout session",
    };
  }
}
