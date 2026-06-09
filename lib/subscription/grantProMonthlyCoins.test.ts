/* @vitest-environment node */

import { describe, expect, it, vi, beforeEach } from "vitest";

import { PRO_MONTHLY_INCLUDED_COINS } from "./proSubscriptionConstants";

const mockFindFirst = vi.fn();
const mockCreateGrant = vi.fn();
const mockQueryRaw = vi.fn();
const mockUserUpdate = vi.fn();
const mockCoinTransactionCreate = vi.fn();

const txMocks = {
  subscriptionCoinGrant: {
    findFirst: (...args: unknown[]) => mockFindFirst(...args),
    create: (...args: unknown[]) => mockCreateGrant(...args),
  },
  $queryRaw: (...args: unknown[]) => mockQueryRaw(...args),
  user: {
    update: (...args: unknown[]) => mockUserUpdate(...args),
  },
  coinTransaction: {
    create: (...args: unknown[]) => mockCoinTransactionCreate(...args),
  },
};

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: (cb: (tx: typeof txMocks) => unknown) => cb(txMocks),
    subscriptionCoinGrant: {
      findFirst: (...args: unknown[]) => mockFindFirst(...args),
    },
  },
}));

import { grantProMonthlyCoinsForPeriod } from "./grantProMonthlyCoins";

describe("grantProMonthlyCoinsForPeriod", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("grants coins and creates SubscriptionCoinGrant when no grant exists", async () => {
    const userId = "user-1";
    const userSubscriptionId = "subdb-1";
    const stripeSubscriptionId = "subs-1";
    const periodStart = new Date("2026-06-01T00:00:00.000Z");
    const periodEnd = new Date("2026-07-01T00:00:00.000Z");

    mockFindFirst.mockResolvedValueOnce(null);
    mockQueryRaw.mockResolvedValueOnce([{ coinBalance: 50 }]);
    mockCreateGrant.mockResolvedValueOnce({ id: "grant-1" });
    mockUserUpdate.mockResolvedValueOnce({ coinBalance: 150 });
    mockCoinTransactionCreate.mockResolvedValueOnce({ id: "tx-1" });

    const result = await grantProMonthlyCoinsForPeriod({
      userId,
      userSubscriptionId,
      stripeSubscriptionId,
      periodStart,
      periodEnd,
    });

    expect(result).toEqual({
      status: "granted",
      grantId: "grant-1",
      newBalance: 50 + PRO_MONTHLY_INCLUDED_COINS,
    });

    expect(mockCreateGrant).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId,
          subscriptionId: userSubscriptionId,
          stripeSubscriptionId,
          coinsGranted: PRO_MONTHLY_INCLUDED_COINS,
          periodStart,
          periodEnd,
        }),
      }),
    );

    expect(mockUserUpdate).toHaveBeenCalledWith({
      where: { id: userId },
      data: { coinBalance: 50 + PRO_MONTHLY_INCLUDED_COINS },
    });

    expect(mockCoinTransactionCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId,
        amount: PRO_MONTHLY_INCLUDED_COINS,
        reason: "PRO_MONTHLY_COINS",
      }),
    });
  });

  it("does not grant twice for the same period", async () => {
    const userId = "user-1";
    const userSubscriptionId = "subdb-1";
    const stripeSubscriptionId = "subs-1";
    const periodStart = new Date("2026-06-01T00:00:00.000Z");
    const periodEnd = new Date("2026-07-01T00:00:00.000Z");

    mockFindFirst.mockResolvedValueOnce({ id: "grant-existing" });

    const result = await grantProMonthlyCoinsForPeriod({
      userId,
      userSubscriptionId,
      stripeSubscriptionId,
      periodStart,
      periodEnd,
    });

    expect(result).toEqual({
      status: "alreadyGranted",
      grantId: "grant-existing",
    });

    expect(mockCreateGrant).not.toHaveBeenCalled();
    expect(mockQueryRaw).not.toHaveBeenCalled();
    expect(mockUserUpdate).not.toHaveBeenCalled();
    expect(mockCoinTransactionCreate).not.toHaveBeenCalled();
  });
});

