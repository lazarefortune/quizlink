import { describe, it, expect } from "vitest";

import { sendAdminTestEmailInputSchema } from "./admin-test-email.schema";

describe("sendAdminTestEmailInputSchema", () => {
  it("accepts valid input", () => {
    const parsed = sendAdminTestEmailInputSchema.safeParse({
      template: "welcome",
      locale: "fr",
      recipientEmail: "admin@test.com",
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects invalid template", () => {
    const parsed = sendAdminTestEmailInputSchema.safeParse({
      template: "unknown",
      locale: "fr",
    });

    expect(parsed.success).toBe(false);
  });

  it("rejects invalid recipient email", () => {
    const parsed = sendAdminTestEmailInputSchema.safeParse({
      template: "verification",
      locale: "en",
      recipientEmail: "not-an-email",
    });

    expect(parsed.success).toBe(false);
  });
});
