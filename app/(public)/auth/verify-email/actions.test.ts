import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFindUnique = vi.fn();
const mockUserUpdate = vi.fn();
const mockDeleteVerificationTokens = vi.fn();
const mockTransaction = vi.fn();
const mockSendWelcomeEmailIfNeeded = vi.fn();
const mockSendUserSignupNotificationIfNeeded = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      update: (...args: unknown[]) => mockUserUpdate(...args),
    },
    emailVerificationToken: {
      deleteMany: (...args: unknown[]) => mockDeleteVerificationTokens(...args),
    },
    $transaction: (...args: unknown[]) => mockTransaction(...args),
  },
}));

vi.mock("@/lib/sendWelcomeEmailIfNeeded", () => ({
  sendWelcomeEmailIfNeeded: (...args: unknown[]) =>
    mockSendWelcomeEmailIfNeeded(...args),
}));

vi.mock("@/lib/sendUserSignupNotificationIfNeeded", () => ({
  sendUserSignupNotificationIfNeeded: (...args: unknown[]) =>
    mockSendUserSignupNotificationIfNeeded(...args),
}));

vi.mock("@/lib/email", () => ({
  sendVerificationEmail: vi.fn(),
}));

import { verifyEmailAction } from "./actions";

describe("verifyEmailAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUserUpdate.mockResolvedValue({});
    mockDeleteVerificationTokens.mockResolvedValue({ count: 1 });
    mockTransaction.mockImplementation((ops: unknown[]) =>
      Promise.all(ops as Promise<unknown>[]),
    );
    mockSendWelcomeEmailIfNeeded.mockResolvedValue(undefined);
    mockSendUserSignupNotificationIfNeeded.mockResolvedValue(undefined);
  });

  it("verifies email and returns sign-in redirect without post-verify token", async () => {
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);
    mockFindUnique.mockResolvedValue({
      id: "user-verify-1",
      email: "u@example.com",
      emailVerifiedAt: null,
      emailVerificationTokens: [{ id: "tok-1", code: "123456", expiresAt }],
    });

    const result = await verifyEmailAction("u@example.com", "123456", "/builder/preview");

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }
    expect(result.redirectTo).toBe(
      "/auth/signin?verified=true&email=u%40example.com&callbackUrl=%2Fbuilder%2Fpreview",
    );
    expect("postVerifyLoginToken" in result).toBe(false);
    expect(mockTransaction).toHaveBeenCalledTimes(1);
    expect(mockSendWelcomeEmailIfNeeded).toHaveBeenCalledWith("user-verify-1");
  });

  it("returns sign-in redirect when email is already verified", async () => {
    mockFindUnique.mockResolvedValue({
      id: "user-verify-1",
      email: "u@example.com",
      emailVerifiedAt: new Date(),
      emailVerificationTokens: [],
    });

    const result = await verifyEmailAction("u@example.com", "123456");

    expect(result).toEqual({
      success: true,
      redirectTo: "/auth/signin?verified=true&email=u%40example.com",
      alreadyVerified: true,
    });
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it("rejects invalid verification code", async () => {
    mockFindUnique.mockResolvedValue(null);

    const result = await verifyEmailAction("nope@example.com", "000000");

    expect(result.success).toBe(false);
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it("rejects expired verification code", async () => {
    mockFindUnique.mockResolvedValue({
      id: "user-verify-1",
      email: "u@example.com",
      emailVerifiedAt: null,
      emailVerificationTokens: [],
    });

    const result = await verifyEmailAction("u@example.com", "123456");

    expect(result.success).toBe(false);
    if (result.success) {
      return;
    }
    expect(result.error).toBe("Invalid or expired verification code");
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it("rejects unsafe callbackUrl in redirect", async () => {
    mockFindUnique.mockResolvedValue({
      id: "user-verify-1",
      email: "u@example.com",
      emailVerifiedAt: new Date(),
      emailVerificationTokens: [],
    });

    const result = await verifyEmailAction("u@example.com", "123456", "https://evil.example");

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }
    expect(result.redirectTo).toBe("/auth/signin?verified=true&email=u%40example.com");
    expect(result.redirectTo).not.toContain("evil");
  });
});
