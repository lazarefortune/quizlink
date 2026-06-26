import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";

import {
  generateSignupVerificationCode,
  getPendingSignupExpiryDate,
  getPendingSignupStep,
  hashSignupVerificationCode,
  isPendingSignupExpired,
  isSignupVerificationCodeValid,
  isValidSignupName,
  isValidSignupPassword,
  deriveNameFromEmail,
  getVerificationCodeResendCooldownSeconds,
  PENDING_SIGNUP_MAX_CODE_ATTEMPTS,
} from "./pending-signup";

describe("pending-signup helpers", () => {
  const originalAuthSecret = process.env.AUTH_SECRET;

  beforeEach(() => {
    process.env.AUTH_SECRET = "test-auth-secret";
  });

  afterEach(() => {
    if (originalAuthSecret === undefined) {
      delete process.env.AUTH_SECRET;
    } else {
      process.env.AUTH_SECRET = originalAuthSecret;
    }
  });

  it("generates a 6-digit verification code", () => {
    const code = generateSignupVerificationCode();
    expect(code).toMatch(/^\d{6}$/);
  });

  it("hashes and verifies signup codes", () => {
    const code = "123456";
    const codeHash = hashSignupVerificationCode(code);
    expect(codeHash).not.toBe(code);
    expect(isSignupVerificationCodeValid(code, codeHash)).toBe(true);
    expect(isSignupVerificationCodeValid("000000", codeHash)).toBe(false);
  });

  it("computes pending signup step from state", () => {
    const now = new Date("2026-06-26T12:00:00.000Z");
    const expiresAt = new Date("2026-06-26T13:00:00.000Z");

    expect(
      getPendingSignupStep(
        { verifiedAt: null, name: null, completedAt: null, expiresAt },
        now,
      ),
    ).toBe("code");

    expect(
      getPendingSignupStep(
        { verifiedAt: now, name: null, completedAt: null, expiresAt },
        now,
      ),
    ).toBe("name");

    expect(
      getPendingSignupStep(
        { verifiedAt: now, name: "Jane", completedAt: null, expiresAt },
        now,
      ),
    ).toBe("password");

    expect(
      getPendingSignupStep(
        { verifiedAt: now, name: "Jane", completedAt: now, expiresAt },
        now,
      ),
    ).toBe("invalid");
  });

  it("detects expired pending signups", () => {
    const now = new Date("2026-06-26T12:00:00.000Z");
    expect(
      isPendingSignupExpired({ expiresAt: new Date("2026-06-26T11:59:59.000Z"), completedAt: null }, now),
    ).toBe(true);
    expect(
      isPendingSignupExpired({ expiresAt: new Date("2026-06-26T12:00:01.000Z"), completedAt: null }, now),
    ).toBe(false);
  });

  it("validates name and password rules", () => {
    expect(isValidSignupName("Jane")).toBe(true);
    expect(isValidSignupName("   ")).toBe(false);
    expect(isValidSignupPassword("12345678")).toBe(true);
    expect(isValidSignupPassword("short")).toBe(false);
  });

  it("derives a fallback name from email local part", () => {
    expect(deriveNameFromEmail("jane.doe@example.com")).toBe("jane.doe");
  });

  it("computes resend cooldown remaining seconds", () => {
    const now = new Date("2026-06-26T12:00:00.000Z");
    const lastSentAt = new Date("2026-06-26T11:59:40.000Z");
    expect(getVerificationCodeResendCooldownSeconds(lastSentAt, now)).toBe(40);
    expect(getVerificationCodeResendCooldownSeconds(now, now)).toBe(60);
  });

  it("uses max attempts constant", () => {
    expect(PENDING_SIGNUP_MAX_CODE_ATTEMPTS).toBeGreaterThan(0);
  });

  it("builds expiry dates in the future", () => {
    const now = new Date("2026-06-26T12:00:00.000Z");
    vi.setSystemTime(now);
    const expiresAt = getPendingSignupExpiryDate(now, 15);
    expect(expiresAt.getTime()).toBe(now.getTime() + 15 * 60 * 1000);
    vi.useRealTimers();
  });
});
