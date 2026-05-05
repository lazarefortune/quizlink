import { describe, expect, it, vi } from "vitest";

import {
  persistSuccessfulLogin,
  recordUserAuthEvent,
  USER_AUTH_EVENT_TYPES,
  USER_AUTH_PROVIDERS,
} from "./userAuthEvents";

describe("userAuthEvents", () => {
  it("records an auth event with audit fields", async () => {
    const create = vi.fn().mockResolvedValue({ id: "evt_1" });
    const db = {
      userAuthEvent: {
        create,
      },
    };

    await recordUserAuthEvent(db as never, {
      userId: "user_1",
      eventType: USER_AUTH_EVENT_TYPES.LOGIN_FAILURE,
      authProvider: USER_AUTH_PROVIDERS.CREDENTIALS,
      audit: {
        ipAddressHash: "ab".repeat(32),
        userAgent: "Vitest",
      },
      failureReason: "CREDENTIALS_REJECTED",
    });

    expect(create).toHaveBeenCalledWith({
      data: {
        userId: "user_1",
        eventType: USER_AUTH_EVENT_TYPES.LOGIN_FAILURE,
        authProvider: USER_AUTH_PROVIDERS.CREDENTIALS,
        ipAddressHash: "ab".repeat(32),
        userAgent: "Vitest",
        failureReason: "CREDENTIALS_REJECTED",
      },
    });
  });

  it("persists login success and updates lastLoginAt in a transaction", async () => {
    const createEvent = vi.fn().mockResolvedValue({ id: "evt_2" });
    const updateUser = vi.fn().mockResolvedValue({ id: "user_1" });

    const tx = {
      userAuthEvent: {
        create: createEvent,
      },
      user: {
        update: updateUser,
      },
    };

    const transaction = vi.fn(async (callback: (arg: typeof tx) => Promise<void>) => {
      await callback(tx);
    });

    const db = {
      $transaction: transaction,
    };

    await persistSuccessfulLogin(db as never, {
      userId: "user_1",
      authProvider: USER_AUTH_PROVIDERS.GOOGLE,
      audit: {
        ipAddressHash: null,
        userAgent: null,
      },
    });

    expect(transaction).toHaveBeenCalledTimes(1);
    expect(createEvent).toHaveBeenCalledWith({
      data: {
        userId: "user_1",
        eventType: USER_AUTH_EVENT_TYPES.LOGIN_SUCCESS,
        authProvider: USER_AUTH_PROVIDERS.GOOGLE,
        ipAddressHash: null,
        userAgent: null,
      },
    });
    expect(updateUser).toHaveBeenCalledWith({
      where: { id: "user_1" },
      data: { lastLoginAt: expect.any(Date) },
    });
  });
});
