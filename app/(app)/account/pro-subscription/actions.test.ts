/* @vitest-environment node */

import { describe, expect, it, vi, beforeEach } from "vitest";

const mockAuth = vi.fn();
const mockGetActiveAccess = vi.fn();

const mockCustomersList = vi.fn();
const mockCustomersCreate = vi.fn();
const mockCheckoutSessionsCreate = vi.fn();
const mockCheckoutSessionsRetrieve = vi.fn();
const mockBillingPortalSessionsCreate = vi.fn();
const mockGetStripeCustomerId = vi.fn();

vi.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

vi.mock("@/lib/quiz/getActiveUserSubscriptionAccess", () => ({
  getActiveUserSubscriptionAccess: (...args: unknown[]) =>
    mockGetActiveAccess(...args),
}));

vi.mock("@/lib/subscription/getStripeCustomerIdForUser", () => ({
  getStripeCustomerIdForUser: (...args: unknown[]) => mockGetStripeCustomerId(...args),
}));

vi.mock("@/lib/stripe/stripe-client", () => ({
  stripe: {
    customers: {
      list: (...args: unknown[]) => mockCustomersList(...args),
      create: (...args: unknown[]) => mockCustomersCreate(...args),
    },
    checkout: {
      sessions: {
        create: (...args: unknown[]) => mockCheckoutSessionsCreate(...args),
        retrieve: (...args: unknown[]) => mockCheckoutSessionsRetrieve(...args),
      },
    },
    billingPortal: {
      sessions: {
        create: (...args: unknown[]) => mockBillingPortalSessionsCreate(...args),
      },
    },
  },
}));

import {
  createProSubscriptionCheckoutAction,
  createStripeBillingPortalSessionAction,
  getProCheckoutSessionDetails,
} from "./actions";

describe("createProSubscriptionCheckoutAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_PRO_PRICE_ID = "price_test_123";
    process.env.NEXT_PUBLIC_BASE_URL = "http://localhost:3000";
  });

  it("refuses non connected users", async () => {
    mockAuth.mockResolvedValue(null);

    const result = await createProSubscriptionCheckoutAction();

    expect(result).toEqual({ success: false, error: "Unauthorized" });
    expect(mockCheckoutSessionsCreate).not.toHaveBeenCalled();
  });

  it("creates a subscription checkout session with required metadata", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user-1", email: "user@example.com" },
    });
    mockGetActiveAccess.mockResolvedValue({
      isActive: false,
    });

    mockCustomersList.mockResolvedValue({ data: [] });
    mockCustomersCreate.mockResolvedValue({ id: "cus_1" });
    mockCheckoutSessionsCreate.mockResolvedValue({
      url: "https://checkout.stripe.test/session_1",
    });

    const result = await createProSubscriptionCheckoutAction();

    expect(result).toEqual({
      success: true,
      checkoutUrl: "https://checkout.stripe.test/session_1",
    });

    expect(mockCheckoutSessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: "subscription",
        line_items: [{ price: "price_test_123", quantity: 1 }],
        metadata: { userId: "user-1", kind: "pro_subscription" },
        subscription_data: {
          metadata: { userId: "user-1", kind: "pro_subscription" },
        },
        success_url:
          "http://localhost:3000/account/pro/success?session_id={CHECKOUT_SESSION_ID}",
        cancel_url: "http://localhost:3000/account/coins?subscription=cancelled",
      }),
    );
  });
});

describe("getProCheckoutSessionDetails", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("refuses non connected users", async () => {
    mockAuth.mockResolvedValue(null);

    const result = await getProCheckoutSessionDetails("cs_test");

    expect(result).toEqual({ success: false, error: "Unauthorized" });
  });

  it("validates subscription checkout session for current user", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockCheckoutSessionsRetrieve.mockResolvedValue({
      mode: "subscription",
      metadata: { userId: "user-1", kind: "pro_subscription" },
      payment_status: "paid",
      subscription: "sub_1",
      customer: "cus_1",
    });

    const result = await getProCheckoutSessionDetails("cs_test");

    expect(result).toEqual({
      success: true,
      isValid: true,
      paymentStatus: "paid",
      subscriptionId: "sub_1",
      customerId: "cus_1",
    });
  });

  it("rejects session owned by another user", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockCheckoutSessionsRetrieve.mockResolvedValue({
      mode: "subscription",
      metadata: { userId: "user-2", kind: "pro_subscription" },
      payment_status: "paid",
      subscription: "sub_1",
      customer: "cus_1",
    });

    const result = await getProCheckoutSessionDetails("cs_test");

    expect(result).toEqual({
      success: true,
      isValid: false,
      error: "Unauthorized session",
    });
  });
});

describe("createStripeBillingPortalSessionAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_BASE_URL = "http://localhost:3000";
  });

  it("refuses non connected users", async () => {
    mockAuth.mockResolvedValue(null);

    const result = await createStripeBillingPortalSessionAction();

    expect(result).toEqual({ success: false, error: "Unauthorized" });
    expect(mockBillingPortalSessionsCreate).not.toHaveBeenCalled();
  });

  it("returns error when no stripe customer id", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockGetStripeCustomerId.mockResolvedValue(null);

    const result = await createStripeBillingPortalSessionAction();

    expect(result).toEqual({ success: false, error: "No Stripe customer" });
    expect(mockBillingPortalSessionsCreate).not.toHaveBeenCalled();
  });

  it("creates billing portal session with customer and return_url", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockGetStripeCustomerId.mockResolvedValue("cus_abc");
    mockBillingPortalSessionsCreate.mockResolvedValue({
      url: "https://billing.stripe.com/portal/test",
    });

    const result = await createStripeBillingPortalSessionAction();

    expect(result).toEqual({
      success: true,
      portalUrl: "https://billing.stripe.com/portal/test",
    });
    expect(mockBillingPortalSessionsCreate).toHaveBeenCalledWith({
      customer: "cus_abc",
      return_url: "http://localhost:3000/account?billing=return",
    });
  });
});

