import { prisma } from "@/lib/prisma";

/**
 * Latest Stripe customer id linked to a user's Pro subscription records.
 */
export async function getStripeCustomerIdForUser(
  userId: string,
): Promise<string | null> {
  const record = await prisma.userSubscription.findFirst({
    where: {
      userId,
      stripeCustomerId: { not: null },
    },
    orderBy: { updatedAt: "desc" },
    select: { stripeCustomerId: true },
  });

  return record?.stripeCustomerId ?? null;
}
