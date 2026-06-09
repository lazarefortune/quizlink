import type { SubscriptionStatus } from "@/generated/prisma/client";
import type Stripe from "stripe";

/** Stripe Unix timestamps are in seconds; Prisma Date uses milliseconds. */
export function stripeUnixToDate(
  timestamp: number | null | undefined,
): Date | null {
  if (timestamp == null || !Number.isFinite(timestamp)) {
    return null;
  }
  return new Date(timestamp * 1000);
}

export type StripeSubscriptionBillingPeriod = {
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
};

/**
 * Billing period lives on subscription items in Stripe API v20+.
 * Webhook payloads may still include legacy subscription-level fields.
 */
export function getStripeSubscriptionBillingPeriod(
  subscription: Stripe.Subscription,
): StripeSubscriptionBillingPeriod {
  const firstItem = subscription.items?.data?.[0];
  if (
    firstItem?.current_period_start != null &&
    firstItem?.current_period_end != null
  ) {
    return {
      currentPeriodStart: stripeUnixToDate(firstItem.current_period_start),
      currentPeriodEnd: stripeUnixToDate(firstItem.current_period_end),
    };
  }

  const legacy = subscription as Stripe.Subscription & {
    current_period_start?: number;
    current_period_end?: number;
  };

  return {
    currentPeriodStart: stripeUnixToDate(legacy.current_period_start),
    currentPeriodEnd: stripeUnixToDate(legacy.current_period_end),
  };
}

export function getStripeSubscriptionPriceId(
  subscription: Stripe.Subscription,
): string | null {
  return subscription.items?.data?.[0]?.price?.id ?? null;
}

export function getStripeSubscriptionCustomerId(
  subscription: Stripe.Subscription,
): string | null {
  if (typeof subscription.customer === "string") {
    return subscription.customer;
  }
  return subscription.customer?.id ?? null;
}

export function mapStripeSubscriptionStatus(
  status: string,
): SubscriptionStatus | null {
  const normalized = status.toUpperCase();
  const allowed: SubscriptionStatus[] = [
    "ACTIVE",
    "TRIALING",
    "PAST_DUE",
    "CANCELED",
    "INCOMPLETE",
    "INCOMPLETE_EXPIRED",
    "UNPAID",
  ];
  return allowed.includes(normalized as SubscriptionStatus)
    ? (normalized as SubscriptionStatus)
    : null;
}

export function isQuizLinkProStripeSubscription(params: {
  subscription: Stripe.Subscription;
  stripeProPriceId?: string | null;
  hasExistingProRecord?: boolean;
}): boolean {
  const { subscription, stripeProPriceId, hasExistingProRecord } = params;

  if (subscription.metadata?.kind === "pro_subscription") {
    return true;
  }

  const priceId = getStripeSubscriptionPriceId(subscription);
  if (stripeProPriceId && priceId === stripeProPriceId) {
    return true;
  }

  if (hasExistingProRecord) {
    return true;
  }

  return false;
}

export function getStripeInvoiceSubscriptionId(
  invoice: Stripe.Invoice,
): string | null {
  const parentSubscription = invoice.parent?.subscription_details?.subscription;
  if (typeof parentSubscription === "string") {
    return parentSubscription;
  }
  if (
    parentSubscription &&
    typeof parentSubscription === "object" &&
    "id" in parentSubscription
  ) {
    return parentSubscription.id;
  }

  const legacy = invoice as Stripe.Invoice & {
    subscription?: string | Stripe.Subscription | null;
  };
  if (typeof legacy.subscription === "string") {
    return legacy.subscription;
  }
  if (legacy.subscription && typeof legacy.subscription === "object") {
    return legacy.subscription.id;
  }

  return null;
}

export function getStripeInvoiceBillingPeriod(
  invoice: Stripe.Invoice,
): StripeSubscriptionBillingPeriod {
  return {
    currentPeriodStart: stripeUnixToDate(invoice.period_start),
    currentPeriodEnd: stripeUnixToDate(invoice.period_end),
  };
}
