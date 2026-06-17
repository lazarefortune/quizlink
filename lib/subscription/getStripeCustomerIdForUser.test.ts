import { beforeEach, describe, expect, it, vi } from "vitest";

const mockFindFirst = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    userSubscription: {
      findFirst: (...args: unknown[]) => mockFindFirst(...args),
    },
  },
}));

import { getStripeCustomerIdForUser } from "./getStripeCustomerIdForUser";

describe("getStripeCustomerIdForUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns latest stripe customer id for user", async () => {
    mockFindFirst.mockResolvedValue({ stripeCustomerId: "cus_latest" });

    const result = await getStripeCustomerIdForUser("user-1");

    expect(result).toBe("cus_latest");
    expect(mockFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: "user-1",
          stripeCustomerId: { not: null },
        },
      }),
    );
  });

  it("returns null when no subscription record", async () => {
    mockFindFirst.mockResolvedValue(null);

    const result = await getStripeCustomerIdForUser("user-1");

    expect(result).toBeNull();
  });
});
