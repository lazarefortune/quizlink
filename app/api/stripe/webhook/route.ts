/**
 * Stripe Webhook Handler
 *
 * Handles Stripe webhook events for payment processing.
 *
 * SECURITY:
 * - Verifies Stripe signature
 * - Only processes payment_intent.succeeded events
 * - Prevents duplicate processing (idempotency)
 * - All coin credits go through creditCoins()
 */

import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe/stripe-client";
import { getCoinPack, isValidPackId } from "@/lib/stripe/coin-packs";
import { creditCoins } from "@/lib/coins";
import { prisma } from "@/lib/prisma";

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

if (!WEBHOOK_SECRET) {
  console.error("[Stripe Webhook] STRIPE_WEBHOOK_SECRET is not set");
}

// Disable body parsing for webhook route (Stripe needs raw body)
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  console.log("[Stripe Webhook] Webhook received");
  try {
    // 1. Get raw body and signature
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get("stripe-signature");

    console.log("[Stripe Webhook] Signature present:", !!signature);

    if (!signature) {
      console.error("[Stripe Webhook] Missing signature");
      return NextResponse.json(
        { error: "Missing signature" },
        { status: 400 }
      );
    }

    if (!WEBHOOK_SECRET) {
      console.error("[Stripe Webhook] Webhook secret not configured");
      return NextResponse.json(
        { error: "Webhook secret not configured" },
        { status: 500 }
      );
    }

    // 2. Verify Stripe signature
    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, WEBHOOK_SECRET);
    } catch (err) {
      console.error("[Stripe Webhook] Signature verification failed:", err);
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    // 3. Handle checkout.session.completed event
    if (event.type === "checkout.session.completed") {
      console.log("[Stripe Webhook] Received checkout.session.completed event");
      const session = event.data.object as Stripe.Checkout.Session;

      console.log("[Stripe Webhook] Session data:", {
        id: session.id,
        payment_status: session.payment_status,
        metadata: session.metadata,
      });

      // Extract metadata
      const userId = session.metadata?.userId;
      const packId = session.metadata?.packId;
      const coinsFromMetadata = session.metadata?.coins;

      console.log("[Stripe Webhook] Extracted metadata:", { userId, packId, coinsFromMetadata });

      if (!userId || !packId) {
        console.error("[Stripe Webhook] Missing metadata:", { userId, packId });
        return NextResponse.json(
          { error: "Missing metadata" },
          { status: 400 }
        );
      }

      // Validate pack ID
      if (!isValidPackId(packId)) {
        console.error("[Stripe Webhook] Invalid pack ID:", packId);
        return NextResponse.json(
          { error: "Invalid pack ID" },
          { status: 400 }
        );
      }

      // Get pack configuration (server-side only - never trust metadata)
      const pack = getCoinPack(packId);
      if (!pack) {
        console.error("[Stripe Webhook] Pack not found:", packId);
        return NextResponse.json(
          { error: "Pack not found" },
          { status: 404 }
        );
      }

      // Use server-side coin amount, not metadata
      const coinAmount = pack.coins;

      // 4. Check for duplicate processing (idempotency)
      // Use payment_intent ID or session ID as idempotency key
      const idempotencyKey = `stripe_${session.id}`;

      // Check if we've already processed this payment
      const existingTransaction = await prisma.coinTransaction.findFirst({
        where: {
          userId,
          reason: {
            contains: idempotencyKey,
          },
        },
      });

      if (existingTransaction) {
        console.log("[Stripe Webhook] Payment already processed:", idempotencyKey);
        return NextResponse.json({ received: true, duplicate: true });
      }

      // 5. Credit coins to user
      const result = await creditCoins(
        userId,
        coinAmount,
        `Achat pack ${packId}`,
        true, // skipAuthCheck for webhook
        "STRIPE"
      );

      if (!result.success) {
        console.error("[Stripe Webhook] Failed to credit coins:", result.error);
        return NextResponse.json(
          { error: result.error || "Failed to credit coins" },
          { status: 500 }
        );
      }

      console.log(
        `[Stripe Webhook] ✅ Successfully credited ${coinAmount} coins to user ${userId} for pack ${packId}`
      );

      return NextResponse.json({ received: true });
    }

    // 6. Handle other event types (optional)
    console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Stripe Webhook] Error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
