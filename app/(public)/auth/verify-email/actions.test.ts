import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFindUniqueUser = vi.fn();
const mockFindUniquePendingSignup = vi.fn();
const mockUserUpdate = vi.fn();
const mockPendingSignupUpdate = vi.fn();
const mockDeleteVerificationTokens = vi.fn();
const mockTransaction = vi.fn();
const mockSendWelcomeEmailIfNeeded = vi.fn();
const mockSendUserSignupNotificationIfNeeded = vi.fn();
const mockSendVerificationEmail = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: (...args: unknown[]) => mockFindUniqueUser(...args),
      update: (...args: unknown[]) => mockUserUpdate(...args),
    },
    pendingSignup: {
      findUnique: (...args: unknown[]) => mockFindUniquePendingSignup(...args),
      update: (...args: unknown[]) => mockPendingSignupUpdate(...args),
    },
    emailVerificationToken: {
      deleteMany: (...args: unknown[]) => mockDeleteVerificationTokens(...args),
      create: vi.fn(),
    },
    $transaction: (...args: unknown[]) => mockTransaction(...args),
  },
}));

vi.mock("@/lib/sendWelcomeEmailIfNeeded", () => ({
  sendWelcomeEmailIfNeeded: (...args: unknown[]) => mockSendWelcomeEmailIfNeeded(...args),
}));

vi.mock("@/lib/sendUserSignupNotificationIfNeeded", () => ({
  sendUserSignupNotificationIfNeeded: (...args: unknown[]) =>
    mockSendUserSignupNotificationIfNeeded(...args),
}));

vi.mock("@/lib/email", () => ({
  sendVerificationEmail: (...args: unknown[]) => mockSendVerificationEmail(...args),
}));

vi.mock("@/lib/analytics/track-server", () => ({
  trackServer: vi.fn(async () => undefined),
  captureServerException: vi.fn(async () => undefined),
}));

vi.mock("@/lib/analytics/posthog-distinct-id-server", () => ({
  getPostHogDistinctIdFromCookies: vi.fn(async () => "test-distinct"),
}));

vi.mock("@/lib/observability/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    flush: vi.fn(async () => undefined),
  },
}));

vi.mock("@/lib/observability/flush", () => ({
  scheduleObservabilityFlush: vi.fn(),
}));

import { verifyEmailAction, resendVerificationCodeAction } from "./actions";
import { hashSignupVerificationCode } from "@/lib/auth/pending-signup";

describe("verifyEmailAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.AUTH_SECRET = "test-auth-secret";
    mockUserUpdate.mockResolvedValue({});
    mockPendingSignupUpdate.mockResolvedValue({});
    mockDeleteVerificationTokens.mockResolvedValue({ count: 1 });
    mockTransaction.mockImplementation((ops: unknown[]) => Promise.all(ops as Promise<unknown>[]));
    mockSendWelcomeEmailIfNeeded.mockResolvedValue(undefined);
    mockSendUserSignupNotificationIfNeeded.mockResolvedValue(undefined);
    mockFindUniquePendingSignup.mockResolvedValue(null);
  });

  it("verifies pending signup code and redirects to name step without creating a user", async () => {
    const expiresAt = new Date(Date.now() + 60_000);
    mockFindUniquePendingSignup.mockResolvedValue({
      id: "pending-1",
      email: "u@example.com",
      codeHash: hashSignupVerificationCode("123456"),
      verifiedAt: null,
      completedAt: null,
      expiresAt,
      attempts: 0,
    });

    const result = await verifyEmailAction("u@example.com", "123456", "/builder/preview");

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }
    expect(result.redirectTo).toBe(
      "/auth/signup/name?email=u%40example.com&callbackUrl=%2Fbuilder%2Fpreview",
    );
    expect(mockPendingSignupUpdate).toHaveBeenCalledWith({
      where: { email: "u@example.com" },
      data: {
        verifiedAt: expect.any(Date),
        attempts: 0,
      },
    });
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it("verifies legacy user email and returns sign-in redirect", async () => {
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);
    mockFindUniqueUser.mockResolvedValue({
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
    expect(mockTransaction).toHaveBeenCalledTimes(1);
    expect(mockSendWelcomeEmailIfNeeded).toHaveBeenCalledWith("user-verify-1");
  });

  it("rejects invalid pending signup code", async () => {
    const expiresAt = new Date(Date.now() + 60_000);
    mockFindUniquePendingSignup.mockResolvedValue({
      id: "pending-1",
      email: "u@example.com",
      codeHash: hashSignupVerificationCode("123456"),
      verifiedAt: null,
      completedAt: null,
      expiresAt,
      attempts: 0,
    });

    const result = await verifyEmailAction("u@example.com", "000000");

    expect(result.success).toBe(false);
    expect(mockPendingSignupUpdate).toHaveBeenCalledWith({
      where: { email: "u@example.com" },
      data: { attempts: 1 },
    });
  });

  it("rejects expired pending signup code", async () => {
    const expiresAt = new Date(Date.now() - 1_000);
    mockFindUniquePendingSignup.mockResolvedValue({
      id: "pending-1",
      email: "u@example.com",
      codeHash: hashSignupVerificationCode("123456"),
      verifiedAt: null,
      completedAt: null,
      expiresAt,
      attempts: 0,
    });

    const result = await verifyEmailAction("u@example.com", "123456");

    expect(result.success).toBe(false);
    if (result.success) {
      return;
    }
    expect(result.canResend).toBe(true);
  });

  it("rejects unsafe callbackUrl in legacy redirect", async () => {
    mockFindUniqueUser.mockResolvedValue({
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

describe("resendVerificationCodeAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.AUTH_SECRET = "test-auth-secret";
    mockPendingSignupUpdate.mockResolvedValue({});
    mockSendVerificationEmail.mockResolvedValue({ success: true });
  });

  it("blocks resend during cooldown for pending signup", async () => {
    mockFindUniquePendingSignup.mockResolvedValue({
      id: "pending-1",
      email: "u@example.com",
      verifiedAt: null,
      completedAt: null,
      lastCodeSentAt: new Date(),
      attempts: 0,
    });

    const result = await resendVerificationCodeAction("u@example.com", "fr");

    expect(result.success).toBe(false);
    if (result.success) {
      return;
    }
    expect(result.error).toBe("RESEND_COOLDOWN");
    expect(result.retryAfterSeconds).toBeGreaterThan(0);
    expect(mockPendingSignupUpdate).not.toHaveBeenCalled();
    expect(mockSendVerificationEmail).not.toHaveBeenCalled();
  });

  it("resends code after cooldown elapsed", async () => {
    mockFindUniquePendingSignup.mockResolvedValue({
      id: "pending-1",
      email: "u@example.com",
      verifiedAt: null,
      completedAt: null,
      lastCodeSentAt: new Date(Date.now() - 61_000),
      attempts: 0,
    });

    const result = await resendVerificationCodeAction("u@example.com", "fr");

    expect(result.success).toBe(true);
    expect(mockPendingSignupUpdate).toHaveBeenCalledTimes(1);
    expect(mockSendVerificationEmail).toHaveBeenCalledTimes(1);
  });
});
