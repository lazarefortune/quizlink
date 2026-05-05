import { describe, expect, it, vi } from "vitest";

import {
  getTotalSignupsEver,
  recordUserLifecycleEvent,
  USER_LIFECYCLE_EVENT_TYPES,
} from "./userLifecycleEvents";

describe("userLifecycleEvents", () => {
  it("records a lifecycle event with the provided user id and type", async () => {
    const create = vi.fn().mockResolvedValue({ id: "evt_1" });
    const db = {
      userLifecycleEvent: {
        create,
      },
    };

    await recordUserLifecycleEvent(db as never, "user_1", USER_LIFECYCLE_EVENT_TYPES.SIGNUP);

    expect(create).toHaveBeenCalledWith({
      data: {
        userId: "user_1",
        eventType: USER_LIFECYCLE_EVENT_TYPES.SIGNUP,
      },
    });
  });

  it("counts only signup events for total signups metric", async () => {
    const count = vi.fn().mockResolvedValue(42);
    const db = {
      userLifecycleEvent: {
        count,
      },
    };

    const totalSignups = await getTotalSignupsEver(db as never);

    expect(totalSignups).toBe(42);
    expect(count).toHaveBeenCalledWith({
      where: {
        eventType: USER_LIFECYCLE_EVENT_TYPES.SIGNUP,
      },
    });
  });
});
