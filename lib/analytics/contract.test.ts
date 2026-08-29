import { describe, expect, it } from "vitest";
import { EVENTS } from "@/lib/analytics/contract";

describe("signup analytics contract", () => {
  it("exposes signup funnel event names", () => {
    expect(EVENTS.signup_started).toBe("signup_started");
    expect(EVENTS.signup_completed).toBe("signup_completed");
    expect(EVENTS.signup_existing_user).toBe("signup_existing_user");
    expect(EVENTS.signup_failed).toBe("signup_failed");
    expect(EVENTS.email_verification_sent).toBe("email_verification_sent");
    expect(EVENTS.email_verified).toBe("email_verified");
    expect(EVENTS.cta_click).toBe("cta_click");
  });
});
