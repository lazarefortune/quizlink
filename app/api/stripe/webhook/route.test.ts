/* @vitest-environment node */

import { describe, expect, it, vi, beforeEach } from "vitest";

const mockConstructEvent = vi.fn();
const mockHeadersGet = vi.fn();
const mockRetrieveSubscription = vi.fn();
const mockSync = vi.fn();
const mockGrant = vi.fn();
const mockCreditCoins = vi.fn();
const mockCoinTransactionFindFirst = vi.fn();
const mockIsValidPackId = vi.fn();
const mockGetCoinPack = vi.fn();

vi.mock("next/headers", () => ({
  headers: async () => ({
    get: (...args: unknown[]) => mockHeadersGet(...args),
  }),
}));

vi.mock("@/lib/stripe/stripe-client", () => ({
  stripe: {
    webhooks: {
      constructEvent: (...args: unknown[]) => mockConstructEvent(...args),
    },
    subscriptions: {
      retrieve: (...args: unknown[]) => mockRetrieveSubscription(...args),
    },
  },
}));

vi.mock("@/lib/subscription/syncStripeProSubscription", () => ({
  syncStripeProSubscription: (...args: unknown[]) => mockSync(...args),
}));

vi.mock("@/lib/subscription/grantProMonthlyCoinsIfEligible", () => ({
  grantProMonthlyCoinsIfEligible: (...args: unknown[]) => mockGrant(...args),
}));

vi.mock("@/lib/stripe/coin-packs", () => ({
  getCoinPack: (...args: unknown[]) => mockGetCoinPack(...args),
  isValidPackId: (...args: unknown[]) => mockIsValidPackId(...args),
}));

vi.mock("@/lib/coins", () => ({
  creditCoins: (...args: unknown[]) => mockCreditCoins(...args),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    coinTransaction: {
      findFirst: (...args: unknown[]) => mockCoinTransactionFindFirst(...args),
    },
  },
}));

type WebhookPost = typeof import("./route")["POST"];

let POST: WebhookPost;

const activeDbSubscription = {
  id: "dbsub-1",
  userId: "user-1",
  status: "ACTIVE",
  currentPeriodStart: new Date("2099-01-01T00:00:00.000Z"),
  currentPeriodEnd: new Date("2100-01-01T00:00:00.000Z"),
};

function stripeSubscriptionPayload() {
  const futurePeriodEnd = new Date("2100-01-01T00:00:00.000Z").getTime() / 1000;
  const futurePeriodStart = new Date("2099-01-01T00:00:00.000Z").getTime() / 1000;

  return {
    id: "stripe_sub_1",
    customer: "stripe_cus_1",
    status: "active",
    items: {
      data: [
        {
          price: { id: "price_pro_test" },
          current_period_start: futurePeriodStart,
          current_period_end: futurePeriodEnd,
        },
      ],
    },
    metadata: { kind: "pro_subscription", userId: "user-1" },
    cancel_at_period_end: false,
    canceled_at: null,
  };
}

describe("Stripe webhook Pro subscriptions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
    process.env.STRIPE_PRO_PRICE_ID = "price_pro_test";
    mockHeadersGet.mockReturnValue("sig_test");
    mockSync.mockResolvedValue({
      synced: true,
      userId: "user-1",
      userSubscription: activeDbSubscription,
    });
    mockGrant.mockResolvedValue(undefined);
    mockRetrieveSubscription.mockImplementation(async (id: string) => ({
      ...stripeSubscriptionPayload(),
      id,
    }));
  });

  it("syncs Pro on checkout.session.completed subscription mode", async () => {
    ({ POST } = await import("./route"));

    mockConstructEvent.mockReturnValue({
      type: "checkout.session.completed",
      id: "evt_checkout",
      data: {
        object: {
          id: "cs_1",
          mode: "subscription",
          metadata: { userId: "user-1", kind: "pro_subscription" },
          subscription: "stripe_sub_1",
        },
      },
    });

    const res = await POST({ text: async () => "raw_body" } as never);
    expect(await res.json()).toEqual({ received: true });

    expect(mockRetrieveSubscription).toHaveBeenCalledWith("stripe_sub_1");
    expect(mockSync).toHaveBeenCalledWith(
      expect.objectContaining({
        userIdFromMetadata: "user-1",
        stripeProPriceId: "price_pro_test",
      }),
    );
    expect(mockGrant).toHaveBeenCalled();
  });

  it("syncs Pro on customer.subscription.created without metadata.kind when price matches", async () => {
    ({ POST } = await import("./route"));

    mockConstructEvent.mockReturnValue({
      type: "customer.subscription.created",
      id: "evt_sub_created",
      data: {
        object: {
          ...stripeSubscriptionPayload(),
          metadata: { userId: "user-1" },
        },
      },
    });

    const res = await POST({ text: async () => "raw_body" } as never);
    expect(await res.json()).toEqual({ received: true });
    expect(mockSync).toHaveBeenCalled();
    expect(mockGrant).toHaveBeenCalled();
  });

  it("syncs and grants on invoice.payment_succeeded for Pro subscription", async () => {
    ({ POST } = await import("./route"));

    mockConstructEvent.mockReturnValue({
      type: "invoice.payment_succeeded",
      id: "evt_invoice",
      data: {
        object: {
          id: "in_1",
          period_start: new Date("2099-01-01T00:00:00.000Z").getTime() / 1000,
          period_end: new Date("2100-01-01T00:00:00.000Z").getTime() / 1000,
          parent: {
            type: "subscription_details",
            subscription_details: {
              subscription: "stripe_sub_1",
              metadata: null,
            },
          },
        },
      },
    });

    const res = await POST({ text: async () => "raw_body" } as never);
    expect(await res.json()).toEqual({ received: true });
    expect(mockRetrieveSubscription).toHaveBeenCalledWith("stripe_sub_1");
    expect(mockSync).toHaveBeenCalled();
    expect(mockGrant).toHaveBeenCalledWith(
      expect.objectContaining({
        stripeInvoiceId: "in_1",
      }),
    );
  });

  it("sets CANCELED on customer.subscription.deleted", async () => {
    ({ POST } = await import("./route"));

    mockConstructEvent.mockReturnValue({
      type: "customer.subscription.deleted",
      id: "evt_sub_deleted",
      data: {
        object: stripeSubscriptionPayload(),
      },
    });

    const res = await POST({ text: async () => "raw_body" } as never);
    expect(await res.json()).toEqual({ received: true });
    expect(mockSync).toHaveBeenCalledWith(
      expect.objectContaining({
        forceStatus: "CANCELED",
      }),
    );
  });

  it("still credits coins for payment mode checkout", async () => {
    ({ POST } = await import("./route"));

    mockIsValidPackId.mockResolvedValue(true);
    mockGetCoinPack.mockResolvedValue({ coins: 100 });
    mockCoinTransactionFindFirst.mockResolvedValue(null);
    mockCreditCoins.mockResolvedValue({ success: true });

    mockConstructEvent.mockReturnValue({
      type: "checkout.session.completed",
      id: "evt_coin_checkout",
      data: {
        object: {
          id: "cs_coin",
          mode: "payment",
          metadata: { userId: "user-1", packId: "starter" },
        },
      },
    });

    const res = await POST({ text: async () => "raw_body" } as never);
    expect(await res.json()).toEqual({ received: true });
    expect(mockCreditCoins).toHaveBeenCalledWith(
      "user-1",
      100,
      expect.stringContaining("cs_coin"),
      true,
      "STRIPE",
    );
    expect(mockSync).not.toHaveBeenCalled();
  });
});
