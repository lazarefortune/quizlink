import type { SubscriptionStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type ActiveUserSubscriptionAccess = {
  isActive: boolean;

  // Recommended details (for paywall/UI decisions).
  plan: "PRO" | null;
  status: SubscriptionStatus | null;
  currentPeriodEnd: Date | null;
  subscriptionId: string | null;

  // Backward-compat for existing code/tests.
  expiresAt: Date | null;
};

export async function getActiveUserSubscriptionAccess(
  userId: string,
): Promise<ActiveUserSubscriptionAccess> {
  const now = new Date();

  const subscription = await prisma.userSubscription.findFirst({
    where: {
      userId,
      provider: "STRIPE",
      plan: "PRO",
      status: { in: ["ACTIVE", "TRIALING"] },
      currentPeriodEnd: { gt: now },
    },
    orderBy: { currentPeriodEnd: "desc" },
    select: {
      id: true,
      plan: true,
      status: true,
      currentPeriodEnd: true,
    },
  });

  if (!subscription) {
    return {
      isActive: false,
      plan: null,
      status: null,
      currentPeriodEnd: null,
      subscriptionId: null,
      expiresAt: null,
    };
  }

  // Extra guard for correctness even if query filters evolve.
  const isActive =
    subscription.plan === "PRO" &&
    (subscription.status === "ACTIVE" || subscription.status === "TRIALING") &&
    Boolean(subscription.currentPeriodEnd && subscription.currentPeriodEnd > now);

  if (!isActive) {
    return {
      isActive: false,
      plan: null,
      status: null,
      currentPeriodEnd: null,
      subscriptionId: null,
      expiresAt: null,
    };
  }

  return {
    isActive: true,
    plan: subscription.plan,
    status: subscription.status,
    currentPeriodEnd: subscription.currentPeriodEnd,
    subscriptionId: subscription.id,
    expiresAt: subscription.currentPeriodEnd,
  };
}
