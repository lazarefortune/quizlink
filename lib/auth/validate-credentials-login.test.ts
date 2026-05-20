import { describe, expect, it } from "vitest";

import { getCredentialsLoginRejection } from "./validate-credentials-login";

describe("getCredentialsLoginRejection", () => {
  it("rejects when user is missing", () => {
    expect(getCredentialsLoginRejection(null)).toBe("USER_NOT_FOUND");
    expect(getCredentialsLoginRejection(undefined)).toBe("USER_NOT_FOUND");
  });

  it("rejects when user has no password hash", () => {
    expect(
      getCredentialsLoginRejection({ passwordHash: null, emailVerifiedAt: new Date() }),
    ).toBe("NO_PASSWORD");
  });

  it("rejects when email is not verified", () => {
    expect(
      getCredentialsLoginRejection({ passwordHash: "hashed", emailVerifiedAt: null }),
    ).toBe("EMAIL_NOT_VERIFIED");
  });

  it("allows credentials sign-in when email is verified", () => {
    expect(
      getCredentialsLoginRejection({
        passwordHash: "hashed",
        emailVerifiedAt: new Date("2026-01-01"),
      }),
    ).toBeNull();
  });
});
