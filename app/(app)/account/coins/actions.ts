"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { stripe } from "@/lib/stripe/stripe-client";
import { getCoinPack, isValidPackId } from "@/lib/stripe/coin-packs";

export type CoinTransaction = {
  id: string;
  amount: number;
  reason: string;
  createdAt: Date;
};

type GetUserCoinTransactionsResponse =
  | { success: true; transactions: CoinTransaction[]; balance: number }
  | { success: false; error: string };

/**
 * Get user's coin transactions and current balance
 * SECURITY: User can only see their own transactions
 */
export async function getUserCoinTransactions(): Promise<GetUserCoinTransactionsResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    if (!prisma) {
      return { success: false, error: "Database not initialized" };
    }

    const userId = session.user.id;

    // Get user's current balance and transactions in parallel
    const [user, transactions] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { coinBalance: true },
      }),
      prisma.coinTransaction.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          amount: true,
          reason: true,
          createdAt: true,
        },
      }),
    ]);

    if (!user) {
      return { success: false, error: "User not found" };
    }

    return {
      success: true,
      transactions,
      balance: user.coinBalance,
    };
  } catch (error) {
    console.error("Error fetching user coin transactions:", error);
    return {
      success: false,
      error: "Failed to fetch transactions",
    };
  }
}

export type CreateCheckoutResponse =
  | { success: true; url: string; sessionId: string }
  | { success: false; error: string };

/**
 * Create Stripe checkout session for a coin pack.
 * Redirects: success → /account/coins/success, cancel → /account/coins
 */
export async function createCheckoutSession(
  packId: string
): Promise<CreateCheckoutResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    if (!(await isValidPackId(packId))) {
      return { success: false, error: "Invalid pack ID" };
    }

    const pack = await getCoinPack(packId);
    if (!pack) {
      return { success: false, error: "Pack not found" };
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ??
      (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000");

    const lineItems = pack.stripePriceId
      ? [{ price: pack.stripePriceId, quantity: 1 }]
      : [
          {
            price_data: {
              currency: "eur",
              product_data: {
                name: pack.displayName,
                description: `${pack.coins} coins pour QuizLink`,
              },
              unit_amount: Math.round(pack.price * 100),
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

    return {
      success: true,
      url: checkoutSession.url || "",
      sessionId: checkoutSession.id,
    };
  } catch (error) {
    console.error("[createCheckoutSession] Error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to create checkout session",
    };
  }
}

export type CheckoutSessionDetails =
  | {
      success: true;
      packId: string;
      coinsPurchased: number;
      price: number;
      currency: string;
    }
  | { success: false; error: string };

/**
 * Get checkout session details for analytics (pack_id, coins, price).
 * Call after redirect to success page; validates session belongs to user.
 */
export async function getCheckoutSessionDetails(
  sessionId: string
): Promise<CheckoutSessionDetails> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: [],
    });

    if (checkoutSession.payment_status !== "paid") {
      return { success: false, error: "Payment not completed" };
    }
    const metadata = checkoutSession.metadata;
    const packId = metadata?.packId;
    const coinsStr = metadata?.coins;
    if (!packId || !coinsStr) {
      return { success: false, error: "Missing session metadata" };
    }
    if (metadata?.userId !== session.user.id) {
      return { success: false, error: "Unauthorized" };
    }

    const pack = await getCoinPack(packId);
    if (!pack) {
      return {
        success: true,
        packId,
        coinsPurchased: parseInt(coinsStr, 10) || 0,
        price: 0,
        currency: "eur",
      };
    }

    return {
      success: true,
      packId,
      coinsPurchased: pack.coins,
      price: pack.price,
      currency: "eur",
    };
  } catch (error) {
    console.error("[getCheckoutSessionDetails] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load session",
    };
  }
}
