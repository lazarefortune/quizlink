/**
 * Stripe Webhook Handler
 *
 * Handles Stripe webhook events for coin packs and QuizLink Pro subscriptions.
 */

import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import type Stripe from "stripe";
import type { SubscriptionStatus } from "@prisma/client";

import { stripe } from "@/lib/stripe/stripe-client";
import { getCoinPack, isValidPackId } from "@/lib/stripe/coin-packs";
import { creditCoins } from "@/lib/coins";
import { prisma } from "@/lib/prisma";
import { grantProMonthlyCoinsIfEligible } from "@/lib/subscription/grantProMonthlyCoinsIfEligible";
import { logStripeWebhookDev } from "@/lib/subscription/logStripeWebhookDev";
import { syncStripeProSubscription } from "@/lib/subscription/syncStripeProSubscription";
import {
  getStripeInvoiceBillingPeriod,
  getStripeInvoiceSubscriptionId,
} from "@/lib/subscription/stripeSubscriptionHelpers";

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

if (!WEBHOOK_SECRET) {
  console.error("[Stripe Webhook] STRIPE_WEBHOOK_SECRET is not set");
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isProCheckoutSession(session: Stripe.Checkout.Session): boolean {
  if (session.mode !== "subscription") {
    return false;
  }
  if (session.metadata?.kind === "pro_subscription") {
    return true;
  }
  return Boolean(session.metadata?.userId);
}

async function handleProStripeSubscriptionEvent(
  subscription: Stripe.Subscription,
  options: {
    userIdFromMetadata?: string | null;
    stripeProPriceId?: string | null;
    forceStatus?: SubscriptionStatus;
    stripeInvoiceId?: string | null;
    source: string;
  },
): Promise<void> {
  const syncResult = await syncStripeProSubscription({
    stripeSubscription: subscription,
    userIdFromMetadata: options.userIdFromMetadata,
    stripeProPriceId: options.stripeProPriceId,
    forceStatus: options.forceStatus,
  });

  if (!syncResult.synced) {
    logStripeWebhookDev("Pro subscription sync skipped", {
      branch: options.source,
      reason: syncResult.reason,
      subscriptionId: subscription.id,
      status: subscription.status,
    });
    return;
  }

  logStripeWebhookDev("Pro subscription synced", {
    branch: options.source,
    userId: syncResult.userId,
    subscriptionId: subscription.id,
    status: syncResult.userSubscription.status,
    currentPeriodEnd: syncResult.userSubscription.currentPeriodEnd?.toISOString(),
  });

  await grantProMonthlyCoinsIfEligible({
    userSubscription: syncResult.userSubscription,
    userId: syncResult.userId,
    stripeSubscription: subscription,
    stripeInvoiceId: options.stripeInvoiceId ?? null,
  });
}

async function handleProCheckoutSessionCompleted(
  session: Stripe.Checkout.Session,
  stripeProPriceId?: string | null,
): Promise<void> {
  const userId = session.metadata?.userId ?? null;
  const stripeSubscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id;

  if (!stripeSubscriptionId) {
    logStripeWebhookDev("Pro checkout missing subscription id", {
      sessionId: session.id,
      userId,
    });
    return;
  }

  const stripeSubscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);

  await handleProStripeSubscriptionEvent(stripeSubscription, {
    userIdFromMetadata: userId,
    stripeProPriceId,
    source: "checkout.session.completed",
  });

  logStripeWebhookDev("Synced Pro subscription from checkout.session.completed", {
    userId,
    subscriptionId: stripeSubscriptionId,
    status: stripeSubscription.status,
  });
}

async function handleProInvoicePaid(
  invoice: Stripe.Invoice,
  stripeProPriceId?: string | null,
): Promise<void> {
  const stripeSubscriptionId = getStripeInvoiceSubscriptionId(invoice);
  if (!stripeSubscriptionId) {
    return;
  }

  const stripeSubscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
  const syncResult = await syncStripeProSubscription({
    stripeSubscription,
    stripeProPriceId,
  });

  if (!syncResult.synced) {
    logStripeWebhookDev("Pro invoice sync skipped", {
      reason: syncResult.reason,
      invoiceId: invoice.id,
      subscriptionId: stripeSubscriptionId,
    });
    return;
  }

  const invoicePeriod = getStripeInvoiceBillingPeriod(invoice);

  await grantProMonthlyCoinsIfEligible({
    userSubscription: syncResult.userSubscription,
    userId: syncResult.userId,
    stripeSubscription,
    stripeInvoiceId: invoice.id,
    periodOverride:
      invoicePeriod.currentPeriodStart && invoicePeriod.currentPeriodEnd
        ? {
            periodStart: invoicePeriod.currentPeriodStart,
            periodEnd: invoicePeriod.currentPeriodEnd,
          }
        : undefined,
  });

  logStripeWebhookDev("Pro invoice processed", {
    invoiceId: invoice.id,
    userId: syncResult.userId,
    subscriptionId: stripeSubscriptionId,
  });
}

export async function POST(request: NextRequest) {
  logStripeWebhookDev("Webhook received");
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get("stripe-signature");

    if (!signature) {
      console.error("[Stripe Webhook] Missing signature");
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    if (!WEBHOOK_SECRET) {
      console.error("[Stripe Webhook] Webhook secret not configured");
      return NextResponse.json(
        { error: "Webhook secret not configured" },
        { status: 500 },
      );
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, WEBHOOK_SECRET);
    } catch (err) {
      console.error("[Stripe Webhook] Signature verification failed:", err);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const stripeProPriceId = process.env.STRIPE_PRO_PRICE_ID;

    logStripeWebhookDev("Event received", {
      type: event.type,
      id: event.id,
    });

    if (
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      const subscription = event.data.object as Stripe.Subscription;
      const forceStatus =
        event.type === "customer.subscription.deleted"
          ? ("CANCELED" as SubscriptionStatus)
          : undefined;

      await handleProStripeSubscriptionEvent(subscription, {
        userIdFromMetadata: subscription.metadata?.userId,
        stripeProPriceId,
        forceStatus,
        source: event.type,
      });

      return NextResponse.json({ received: true });
    }

    if (
      event.type === "invoice.payment_succeeded" ||
      event.type === "invoice.paid"
    ) {
      const invoice = event.data.object as Stripe.Invoice;
      await handleProInvoicePaid(invoice, stripeProPriceId);
      return NextResponse.json({ received: true });
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      logStripeWebhookDev("checkout.session.completed", {
        sessionId: session.id,
        mode: session.mode,
        kind: session.metadata?.kind,
        userId: session.metadata?.userId,
        packId: session.metadata?.packId,
      });

      if (isProCheckoutSession(session)) {
        await handleProCheckoutSessionCompleted(session, stripeProPriceId);
        return NextResponse.json({ received: true });
      }

      const userId = session.metadata?.userId;
      const packId = session.metadata?.packId;

      if (!userId || !packId) {
        console.error("[Stripe Webhook] Missing coin checkout metadata:", {
          userId,
          packId,
        });
        return NextResponse.json({ error: "Missing metadata" }, { status: 400 });
      }

      if (!(await isValidPackId(packId))) {
        console.error("[Stripe Webhook] Invalid pack ID:", packId);
        return NextResponse.json({ error: "Invalid pack ID" }, { status: 400 });
      }

      const pack = await getCoinPack(packId);
      if (!pack) {
        return NextResponse.json({ error: "Pack not found" }, { status: 404 });
      }

      const coinAmount = pack.coins;
      const idempotencyKey = `stripe_${session.id}`;
      const purchaseReason = `Achat pack ${packId} (${idempotencyKey})`;

      const existingTransaction = await prisma.coinTransaction.findFirst({
        where: {
          userId,
          reason: { contains: idempotencyKey },
        },
      });

      if (existingTransaction) {
        logStripeWebhookDev("Coin checkout already processed", { idempotencyKey });
        return NextResponse.json({ received: true, duplicate: true });
      }

      const result = await creditCoins(
        userId,
        coinAmount,
        purchaseReason,
        true,
        "STRIPE",
      );

      if (!result.success) {
        console.error("[Stripe Webhook] Failed to credit coins:", result.error);
        return NextResponse.json(
          { error: result.error || "Failed to credit coins" },
          { status: 500 },
        );
      }

      logStripeWebhookDev("Coin pack credited", {
        userId,
        packId,
        coinAmount,
      });

      return NextResponse.json({ received: true });
    }

    logStripeWebhookDev("Unhandled event type", { type: event.type });
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Stripe Webhook] Error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
