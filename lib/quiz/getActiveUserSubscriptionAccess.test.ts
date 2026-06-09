/* @vitest-environment node */

import { describe, expect, it, vi, beforeEach } from "vitest";

const mockFindFirst = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    userSubscription: {
      findFirst: (...args: unknown[]) => mockFindFirst(...args),
    },
  },
}));

import { getActiveUserSubscriptionAccess } from "./getActiveUserSubscriptionAccess";

describe("getActiveUserSubscriptionAccess", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-01T00:00:00.000Z"));
  });

  it("returns inactive when no subscription exists", async () => {
    mockFindFirst.mockResolvedValueOnce(null);

    const result = await getActiveUserSubscriptionAccess("user-1");

    expect(result).toEqual({
      isActive: false,
      plan: null,
      status: null,
      currentPeriodEnd: null,
      subscriptionId: null,
      expiresAt: null,
    });
  });

  it("returns active when PRO + ACTIVE and currentPeriodEnd is in the future", async () => {
    const future = new Date("2027-01-01T00:00:00.000Z");

    mockFindFirst.mockResolvedValueOnce({
      id: "sub-1",
      plan: "PRO",
      status: "ACTIVE",
      currentPeriodEnd: future,
    });

    const result = await getActiveUserSubscriptionAccess("user-1");

    expect(result.isActive).toBe(true);
    expect(result.plan).toBe("PRO");
    expect(result.status).toBe("ACTIVE");
    expect(result.currentPeriodEnd).toEqual(future);
    expect(result.subscriptionId).toBe("sub-1");
    expect(result.expiresAt).toEqual(future);
  });

  it("returns inactive when status is CANCELED (even if currentPeriodEnd is in the future)", async () => {
    const future = new Date("2027-01-01T00:00:00.000Z");

    mockFindFirst.mockResolvedValueOnce({
      id: "sub-2",
      plan: "PRO",
      status: "CANCELED",
      currentPeriodEnd: future,
    });

    const result = await getActiveUserSubscriptionAccess("user-1");

    expect(result).toEqual({
      isActive: false,
      plan: null,
      status: null,
      currentPeriodEnd: null,
      subscriptionId: null,
      expiresAt: null,
    });
  });
});

