import { beforeEach, describe, expect, it, vi } from "vitest";
import type Stripe from "stripe";

const mockFindFirst = vi.fn();
const mockUpsert = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    userSubscription: {
      findFirst: (...args: unknown[]) => mockFindFirst(...args),
      upsert: (...args: unknown[]) => mockUpsert(...args),
    },
  },
}));

import { syncStripeProSubscription } from "./syncStripeProSubscription";

function buildSubscription(
  overrides: Partial<Stripe.Subscription> = {},
): Stripe.Subscription {
  return {
    id: "sub_stripe_1",
    customer: "cus_1",
    status: "active",
    metadata: {},
    cancel_at_period_end: false,
    canceled_at: null,
    items: {
      data: [
        {
          current_period_start: 1_700_000_000,
          current_period_end: 1_702_592_000,
          price: { id: "price_pro_test" },
        },
      ],
    },
    ...overrides,
  } as Stripe.Subscription;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockFindFirst.mockResolvedValue(null);
  mockUpsert.mockResolvedValue({
    id: "dbsub-1",
    userId: "user-1",
    status: "ACTIVE",
    currentPeriodStart: new Date(1_700_000_000_000),
    currentPeriodEnd: new Date(1_702_592_000_000),
  });
});

describe("syncStripeProSubscription", () => {
  it("syncs using userId from checkout metadata", async () => {
    const result = await syncStripeProSubscription({
      stripeSubscription: buildSubscription(),
      userIdFromMetadata: "user-1",
      stripeProPriceId: "price_pro_test",
    });

    expect(result.synced).toBe(true);
    if (!result.synced) return;
    expect(result.userId).toBe("user-1");
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { stripeSubscriptionId: "sub_stripe_1" },
        create: expect.objectContaining({ userId: "user-1", status: "ACTIVE" }),
      }),
    );
  });

  it("syncs Pro subscription matched by price id without metadata.kind", async () => {
    const result = await syncStripeProSubscription({
      stripeSubscription: buildSubscription({ metadata: {} }),
      userIdFromMetadata: "user-2",
      stripeProPriceId: "price_pro_test",
    });

    expect(result.synced).toBe(true);
  });

  it("resolves userId from existing subscription record", async () => {
    mockFindFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ userId: "user-existing" });

    const result = await syncStripeProSubscription({
      stripeSubscription: buildSubscription({ metadata: {} }),
      stripeProPriceId: "price_pro_test",
    });

    expect(result.synced).toBe(true);
    if (!result.synced) return;
    expect(result.userId).toBe("user-existing");
  });

  it("returns missing_user_id when Pro subscription cannot be linked", async () => {
    const result = await syncStripeProSubscription({
      stripeSubscription: buildSubscription({
        metadata: { kind: "pro_subscription" },
      }),
      stripeProPriceId: "price_pro_test",
    });

    expect(result).toEqual({ synced: false, reason: "missing_user_id" });
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it("ignores non-Pro subscriptions", async () => {
    const result = await syncStripeProSubscription({
      stripeSubscription: {
        ...buildSubscription(),
        items: {
          data: [
            {
              current_period_start: 1,
              current_period_end: 2,
              price: { id: "price_other" },
            },
          ],
        },
      } as unknown as Stripe.Subscription,
      userIdFromMetadata: "user-1",
      stripeProPriceId: "price_pro_test",
    });

    expect(result).toEqual({ synced: false, reason: "not_pro_subscription" });
  });
});
