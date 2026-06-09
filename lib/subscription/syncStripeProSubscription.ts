import type { SubscriptionStatus, UserSubscription } from "@prisma/client";
import type Stripe from "stripe";

import { prisma } from "@/lib/prisma";

import {
  getStripeSubscriptionBillingPeriod,
  getStripeSubscriptionCustomerId,
  getStripeSubscriptionPriceId,
  isQuizLinkProStripeSubscription,
  mapStripeSubscriptionStatus,
  stripeUnixToDate,
} from "./stripeSubscriptionHelpers";

export type SyncStripeProSubscriptionParams = {
  stripeSubscription: Stripe.Subscription;
  userIdFromMetadata?: string | null;
  stripeProPriceId?: string | null;
  forceStatus?: SubscriptionStatus;
};

export type SyncStripeProSubscriptionResult =
  | { synced: true; userSubscription: UserSubscription; userId: string }
  | { synced: false; reason: string };

async function resolveUserId(params: {
  userIdFromMetadata?: string | null;
  stripeSubscription: Stripe.Subscription;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string;
}): Promise<string | null> {
  if (params.userIdFromMetadata) {
    return params.userIdFromMetadata;
  }

  const metadataUserId = params.stripeSubscription.metadata?.userId;
  if (metadataUserId) {
    return metadataUserId;
  }

  const bySubscriptionId = await prisma.userSubscription.findFirst({
    where: { stripeSubscriptionId: params.stripeSubscriptionId },
    select: { userId: true },
  });
  if (bySubscriptionId?.userId) {
    return bySubscriptionId.userId;
  }

  if (params.stripeCustomerId) {
    const byCustomerId = await prisma.userSubscription.findFirst({
      where: { stripeCustomerId: params.stripeCustomerId },
      orderBy: { updatedAt: "desc" },
      select: { userId: true },
    });
    if (byCustomerId?.userId) {
      return byCustomerId.userId;
    }
  }

  return null;
}

export async function syncStripeProSubscription({
  stripeSubscription,
  userIdFromMetadata,
  stripeProPriceId,
  forceStatus,
}: SyncStripeProSubscriptionParams): Promise<SyncStripeProSubscriptionResult> {
  const stripeSubscriptionId = stripeSubscription.id;
  const stripeCustomerId = getStripeSubscriptionCustomerId(stripeSubscription);

  const existing = await prisma.userSubscription.findFirst({
    where: {
      OR: [
        { stripeSubscriptionId },
        ...(stripeCustomerId
          ? [{ stripeCustomerId, plan: "PRO" as const }]
          : []),
      ],
    },
    select: { id: true, userId: true, plan: true },
  });

  const isPro = isQuizLinkProStripeSubscription({
    subscription: stripeSubscription,
    stripeProPriceId,
    hasExistingProRecord: existing?.plan === "PRO",
  });

  if (!isPro) {
    return { synced: false, reason: "not_pro_subscription" };
  }

  const userId = await resolveUserId({
    userIdFromMetadata,
    stripeSubscription,
    stripeCustomerId,
    stripeSubscriptionId,
  });

  if (!userId) {
    return { synced: false, reason: "missing_user_id" };
  }

  const stripePriceId = getStripeSubscriptionPriceId(stripeSubscription);
  const { currentPeriodStart, currentPeriodEnd } =
    getStripeSubscriptionBillingPeriod(stripeSubscription);

  const mappedStatus =
    forceStatus ?? mapStripeSubscriptionStatus(stripeSubscription.status);

  if (!mappedStatus) {
    return { synced: false, reason: "unsupported_status" };
  }

  const cancelAtPeriodEnd = Boolean(stripeSubscription.cancel_at_period_end);
  const canceledAt = stripeUnixToDate(stripeSubscription.canceled_at);

  const userSubscription = await prisma.userSubscription.upsert({
    where: { stripeSubscriptionId },
    update: {
      userId,
      stripeCustomerId,
      stripePriceId,
      status: mappedStatus,
      currentPeriodStart,
      currentPeriodEnd,
      cancelAtPeriodEnd,
      canceledAt,
      plan: "PRO",
    },
    create: {
      userId,
      provider: "STRIPE",
      stripeCustomerId,
      stripeSubscriptionId,
      stripePriceId,
      plan: "PRO",
      status: mappedStatus,
      currentPeriodStart,
      currentPeriodEnd,
      cancelAtPeriodEnd,
      canceledAt,
    },
  });

  return { synced: true, userSubscription, userId };
}
