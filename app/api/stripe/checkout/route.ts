/**
 * Stripe Checkout API Route
 *
 * Creates a Stripe Checkout Session for coin pack purchases.
 *
 * SECURITY:
 * - User must be authenticated
 * - Pack prices come from server-side configuration only
 * - Never trust frontend price values
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { stripe } from "@/lib/stripe/stripe-client";
import { getCoinPack, isValidPackId } from "@/lib/stripe/coin-packs";

export async function POST(request: NextRequest) {
  try {
    // 1. Verify authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2. Parse request body
    const body = await request.json();
    const { packId } = body;

    if (!packId || typeof packId !== "string") {
      return NextResponse.json(
        { error: "packId is required" },
        { status: 400 }
      );
    }

    // 3. Validate pack ID and get pack configuration
    if (!(await isValidPackId(packId))) {
      return NextResponse.json(
        { error: "Invalid pack ID" },
        { status: 400 }
      );
    }

    const pack = await getCoinPack(packId);
    if (!pack) {
      return NextResponse.json(
        { error: "Pack not found" },
        { status: 404 }
      );
    }

    // 4. Get base URL for redirects
    const baseUrl =
            process.env.NEXT_PUBLIC_BASE_URL ??
            (process.env.VERCEL_URL
                ? `https://${process.env.VERCEL_URL}`
                : "http://localhost:3000");


    // 5. Create Stripe Checkout Session
    // Use price_id if available, otherwise fallback to price_data
    const lineItems = pack.stripePriceId
      ? [
          {
            price: pack.stripePriceId,
            quantity: 1,
          },
        ]
      : [
          {
            price_data: {
              currency: "eur",
              product_data: {
                name: pack.displayName,
                description: `${pack.coins} coins pour QuizLink`,
              },
              unit_amount: Math.round(pack.price * 100), // Convert to cents
            },
            quantity: 1,
          },
        ];

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: lineItems,
      metadata: {
        userId: session.user.id,
        packId: pack.id,
        packName: pack.name,
        coins: pack.coins.toString(),
      },
      success_url: `${baseUrl}/account/coins/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/account/coins?canceled=true`,
      customer_email: session.user.email || undefined,
    });

    // 6. Return checkout URL
    return NextResponse.json({
      url: checkoutSession.url,
      sessionId: checkoutSession.id,
    });
  } catch (error) {
    console.error("[Stripe Checkout] Error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
