import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

import { PRO_MONTHLY_INCLUDED_COINS } from "./proSubscriptionConstants";

export type GrantProMonthlyCoinsForPeriodParams = {
  userId: string;
  userSubscriptionId: string;
  stripeSubscriptionId: string;
  stripeInvoiceId?: string | null;
  stripePriceId?: string | null;
  periodStart: Date;
  periodEnd: Date;
  now?: Date;
};

export type GrantProMonthlyCoinsForPeriodResult =
  | { status: "alreadyGranted"; grantId: string }
  | { status: "granted"; grantId: string; newBalance: number };

export async function grantProMonthlyCoinsForPeriod({
  userId,
  userSubscriptionId,
  stripeSubscriptionId,
  stripeInvoiceId,
  stripePriceId,
  periodStart,
  periodEnd,
  now,
}: GrantProMonthlyCoinsForPeriodParams): Promise<GrantProMonthlyCoinsForPeriodResult> {
  const effectiveNow = now ?? new Date();

  if (!prisma) {
    return { status: "alreadyGranted", grantId: "prisma_unavailable" };
  }

  try {
    const result = await prisma.$transaction(
      async (tx) => {
        const existingGrant = await tx.subscriptionCoinGrant.findFirst({
          where: {
            stripeSubscriptionId,
            periodStart,
            periodEnd,
          },
          select: { id: true },
        });

        if (existingGrant) {
          return { status: "alreadyGranted" as const, grantId: existingGrant.id };
        }

        // Lock user row to compute a consistent balance update.
        const lockedUser = await tx.$queryRaw<Array<{ coinBalance: number }>>`
          SELECT coin_balance as coinBalance
          FROM users
          WHERE id = ${userId}
          FOR UPDATE
        `;

        if (!lockedUser || lockedUser.length === 0) {
          throw new Error("User not found");
        }

        const newBalance = lockedUser[0].coinBalance + PRO_MONTHLY_INCLUDED_COINS;

        const grant = await tx.subscriptionCoinGrant.create({
          data: {
            userId,
            subscriptionId: userSubscriptionId,
            stripeSubscriptionId,
            stripeInvoiceId: stripeInvoiceId ?? null,
            stripePriceId: stripePriceId ?? null,
            coinsGranted: PRO_MONTHLY_INCLUDED_COINS,
            periodStart,
            periodEnd,
          },
        });

        await tx.user.update({
          where: { id: userId },
          data: { coinBalance: newBalance },
        });

        await tx.coinTransaction.create({
          data: {
            userId,
            amount: PRO_MONTHLY_INCLUDED_COINS,
            reason: stripeInvoiceId
              ? `PRO_MONTHLY_COINS: ${stripeInvoiceId}`
              : "PRO_MONTHLY_COINS",
          },
        });

        return { status: "granted" as const, grantId: grant.id, newBalance };
      },
      {
        isolationLevel: "ReadCommitted",
        timeout: 10000,
      },
    );

    return result;
  } catch (error) {
    // Idempotency safety: if two concurrent webhook events race,
    // the unique constraint may throw; retry reading existing grant.
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const existingGrant = await prisma.subscriptionCoinGrant.findFirst({
        where: {
          stripeSubscriptionId,
          periodStart,
          periodEnd,
        },
        select: { id: true },
      });

      if (existingGrant) {
        return { status: "alreadyGranted", grantId: existingGrant.id };
      }
    }

    // eslint-disable-next-line no-console
    console.error("[grantProMonthlyCoinsForPeriod] Error:", error, {
      userId,
      stripeSubscriptionId,
      periodStart: effectiveNow.toISOString(),
      periodEnd,
    });

    throw error;
  }
}

