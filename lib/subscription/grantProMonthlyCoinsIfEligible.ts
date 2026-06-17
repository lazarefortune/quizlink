import type { UserSubscription } from "@/generated/prisma/client";
import type Stripe from "stripe";

import { grantProMonthlyCoinsForPeriod } from "./grantProMonthlyCoins";
import {
  getStripeSubscriptionBillingPeriod,
  getStripeSubscriptionPriceId,
} from "./stripeSubscriptionHelpers";

export type GrantProMonthlyCoinsIfEligibleParams = {
  userSubscription: UserSubscription;
  userId: string;
  stripeSubscription: Stripe.Subscription;
  stripeInvoiceId?: string | null;
  periodOverride?: {
    periodStart: Date;
    periodEnd: Date;
  };
  now?: Date;
};

export async function grantProMonthlyCoinsIfEligible({
  userSubscription,
  userId,
  stripeSubscription,
  stripeInvoiceId,
  periodOverride,
  now = new Date(),
}: GrantProMonthlyCoinsIfEligibleParams): Promise<void> {
  if (
    userSubscription.status !== "ACTIVE" &&
    userSubscription.status !== "TRIALING"
  ) {
    return;
  }

  let periodStart: Date | null;
  let periodEnd: Date | null;

  if (periodOverride) {
    periodStart = periodOverride.periodStart;
    periodEnd = periodOverride.periodEnd;
  } else {
    const period = getStripeSubscriptionBillingPeriod(stripeSubscription);
    periodStart = userSubscription.currentPeriodStart ?? period.currentPeriodStart;
    periodEnd = userSubscription.currentPeriodEnd ?? period.currentPeriodEnd;
  }

  if (!periodStart || !periodEnd || periodEnd <= now) {
    return;
  }

  await grantProMonthlyCoinsForPeriod({
    userId,
    userSubscriptionId: userSubscription.id,
    stripeSubscriptionId: stripeSubscription.id,
    stripeInvoiceId: stripeInvoiceId ?? null,
    stripePriceId: getStripeSubscriptionPriceId(stripeSubscription),
    periodStart,
    periodEnd,
    now,
  });
}
