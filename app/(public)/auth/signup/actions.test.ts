import { describe, it, expect, vi, beforeEach } from "vitest";

const mockUserFindUnique = vi.fn();
const mockPendingSignupUpsert = vi.fn();
const mockPendingSignupFindUnique = vi.fn();
const mockPendingSignupUpdate = vi.fn();
const mockUserCreate = vi.fn();
const mockTransaction = vi.fn();
const mockBcryptHash = vi.fn();
const mockSendVerificationEmail = vi.fn();
const mockInitializeUserCoins = vi.fn();
const mockRecordUserLifecycleEvent = vi.fn();
const mockEnsureDefaultUserAvatar = vi.fn();
const mockSendWelcomeEmailIfNeeded = vi.fn();
const mockSendUserSignupNotificationIfNeeded = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: (...args: unknown[]) => mockUserFindUnique(...args),
      create: (...args: unknown[]) => mockUserCreate(...args),
    },
    pendingSignup: {
      upsert: (...args: unknown[]) => mockPendingSignupUpsert(...args),
      findUnique: (...args: unknown[]) => mockPendingSignupFindUnique(...args),
      update: (...args: unknown[]) => mockPendingSignupUpdate(...args),
    },
    $transaction: (...args: unknown[]) => mockTransaction(...args),
  },
}));

vi.mock("bcryptjs", () => ({
  default: {
    hash: (...args: unknown[]) => mockBcryptHash(...args),
  },
}));

vi.mock("@/lib/email", () => ({
  sendVerificationEmail: (...args: unknown[]) => mockSendVerificationEmail(...args),
}));

vi.mock("@/lib/coins", () => ({
  initializeUserCoins: (...args: unknown[]) => mockInitializeUserCoins(...args),
}));

vi.mock("@/lib/userLifecycleEvents", () => ({
  recordUserLifecycleEvent: (...args: unknown[]) => mockRecordUserLifecycleEvent(...args),
  USER_LIFECYCLE_EVENT_TYPES: { SIGNUP: "SIGNUP" },
}));

vi.mock("@/lib/user-avatar/ensureDefaultUserAvatar", () => ({
  ensureDefaultUserAvatar: (...args: unknown[]) => mockEnsureDefaultUserAvatar(...args),
}));

vi.mock("@/lib/sendWelcomeEmailIfNeeded", () => ({
  sendWelcomeEmailIfNeeded: (...args: unknown[]) => mockSendWelcomeEmailIfNeeded(...args),
}));

vi.mock("@/lib/sendUserSignupNotificationIfNeeded", () => ({
  sendUserSignupNotificationIfNeeded: (...args: unknown[]) =>
    mockSendUserSignupNotificationIfNeeded(...args),
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

import {
  startEmailSignupAction,
  saveSignupNameAction,
  completeSignupAction,
  getSignupStepAccessAction,
} from "./actions";
import { SIGNUP_ERROR_CODES } from "@/lib/auth/signup-error-codes";
import { CURRENT_PRIVACY_VERSION, CURRENT_TERMS_VERSION } from "@/lib/legal-versions";
import { hashSignupVerificationCode } from "@/lib/auth/pending-signup";

describe("startEmailSignupAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.AUTH_SECRET = "test-auth-secret";
    mockUserFindUnique.mockResolvedValue(null);
    mockPendingSignupUpsert.mockResolvedValue({ id: "pending-1" });
    mockSendVerificationEmail.mockResolvedValue({ success: true });
  });

  it("creates a pending signup without creating a user", async () => {
    const result = await startEmailSignupAction("jane@example.com", "fr", "/dashboard");

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }
    expect(result.redirectTo).toBe("/auth/verify-email?email=jane%40example.com&callbackUrl=%2Fdashboard");
    expect(mockPendingSignupUpsert).toHaveBeenCalledTimes(1);
    expect(mockUserCreate).not.toHaveBeenCalled();
    expect(mockSendVerificationEmail).toHaveBeenCalledTimes(1);
  });

  it("returns an error when email already exists without redirecting to verification", async () => {
    mockUserFindUnique.mockResolvedValue({ id: "existing-user" });

    const result = await startEmailSignupAction("jane@example.com", "fr");

    expect(result.success).toBe(false);
    if (result.success) {
      return;
    }
    expect(result.error).toBe(SIGNUP_ERROR_CODES.EMAIL_ALREADY_IN_USE);
    expect(mockPendingSignupUpsert).not.toHaveBeenCalled();
    expect(mockSendVerificationEmail).not.toHaveBeenCalled();
  });
});

describe("saveSignupNameAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPendingSignupFindUnique.mockResolvedValue({
      id: "pending-1",
      email: "jane@example.com",
      verifiedAt: new Date(),
      name: null,
      completedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
      attempts: 0,
    });
    mockPendingSignupUpdate.mockResolvedValue({});
  });

  it("stores the name when signup email is verified", async () => {
    const result = await saveSignupNameAction("jane@example.com", "Jane", "/dashboard");

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }
    expect(result.redirectTo).toBe("/auth/signup/password?email=jane%40example.com&callbackUrl=%2Fdashboard");
    expect(mockPendingSignupUpdate).toHaveBeenCalledWith({
      where: { email: "jane@example.com" },
      data: { name: "Jane" },
    });
  });

  it("refuses when signup email is not verified", async () => {
    mockPendingSignupFindUnique.mockResolvedValue({
      id: "pending-1",
      email: "jane@example.com",
      verifiedAt: null,
      name: null,
      completedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
      attempts: 0,
    });

    const result = await saveSignupNameAction("jane@example.com", "Jane");

    expect(result.success).toBe(false);
    expect(mockPendingSignupUpdate).not.toHaveBeenCalled();
  });
});

describe("completeSignupAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.AUTH_SECRET = "test-auth-secret";
    mockPendingSignupFindUnique.mockResolvedValue({
      id: "pending-1",
      email: "jane@example.com",
      verifiedAt: new Date("2026-06-26T10:00:00.000Z"),
      name: "Jane",
      completedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
      attempts: 0,
      preferredLanguage: "fr",
    });
    mockUserFindUnique.mockResolvedValue(null);
    mockBcryptHash.mockResolvedValue("hashed-password");
    mockTransaction.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) =>
      callback({
        user: {
          create: mockUserCreate,
        },
        pendingSignup: {
          update: mockPendingSignupUpdate,
        },
      }),
    );
    mockUserCreate.mockResolvedValue({ id: "user-1", email: "jane@example.com" });
    mockPendingSignupUpdate.mockResolvedValue({});
    mockInitializeUserCoins.mockResolvedValue(undefined);
    mockRecordUserLifecycleEvent.mockResolvedValue(undefined);
    mockEnsureDefaultUserAvatar.mockResolvedValue(undefined);
    mockSendWelcomeEmailIfNeeded.mockResolvedValue(undefined);
    mockSendUserSignupNotificationIfNeeded.mockResolvedValue(undefined);
  });

  it("creates the final user with legal acceptance and safe redirect", async () => {
    const result = await completeSignupAction("jane@example.com", "password123", "/dashboard");

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }
    expect(result.email).toBe("jane@example.com");
    expect(result.redirectTo).toBe("/dashboard");
    expect(mockUserCreate).toHaveBeenCalledTimes(1);
    const createArg = mockUserCreate.mock.calls[0][0];
    expect(createArg.data.termsVersion).toBe(CURRENT_TERMS_VERSION);
    expect(createArg.data.privacyVersion).toBe(CURRENT_PRIVACY_VERSION);
    expect(createArg.data.emailVerifiedAt).toEqual(new Date("2026-06-26T10:00:00.000Z"));
    expect(mockInitializeUserCoins).toHaveBeenCalledWith("user-1");
    expect(mockSendWelcomeEmailIfNeeded).toHaveBeenCalledWith("user-1");
  });

  it("refuses when name is missing", async () => {
    mockPendingSignupFindUnique.mockResolvedValue({
      id: "pending-1",
      email: "jane@example.com",
      verifiedAt: new Date(),
      name: null,
      completedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
      attempts: 0,
      preferredLanguage: "fr",
    });

    const result = await completeSignupAction("jane@example.com", "password123");

    expect(result.success).toBe(false);
    expect(mockUserCreate).not.toHaveBeenCalled();
  });

  it("rejects unsafe callbackUrl", async () => {
    const result = await completeSignupAction(
      "jane@example.com",
      "password123",
      "https://evil.example",
    );

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }
    expect(result.redirectTo).toBe("/dashboard");
  });
});

describe("getSignupStepAccessAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("blocks direct access to password step when email is not verified", async () => {
    mockPendingSignupFindUnique.mockResolvedValue({
      id: "pending-1",
      email: "jane@example.com",
      verifiedAt: null,
      name: null,
      completedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
      attempts: 0,
    });

    const result = await getSignupStepAccessAction("jane@example.com", "password");

    expect(result.allowed).toBe(false);
    if (result.allowed) {
      return;
    }
    expect(result.redirectTo).toContain("/auth/verify-email");
  });

  it("blocks access when pending signup is completed", async () => {
    mockPendingSignupFindUnique.mockResolvedValue({
      id: "pending-1",
      email: "jane@example.com",
      verifiedAt: new Date(),
      name: "Jane",
      completedAt: new Date(),
      expiresAt: new Date(Date.now() + 60_000),
      attempts: 0,
    });

    const result = await getSignupStepAccessAction("jane@example.com", "password");

    expect(result.allowed).toBe(false);
    if (result.allowed) {
      return;
    }
    expect(result.redirectTo).toBe("/auth/signup");
  });
});

describe("pending signup code hashing integration", () => {
  it("stores hashed codes in pending signup upsert", async () => {
    process.env.AUTH_SECRET = "test-auth-secret";
    mockUserFindUnique.mockResolvedValue(null);
    mockPendingSignupUpsert.mockResolvedValue({ id: "pending-1" });
    mockSendVerificationEmail.mockResolvedValue({ success: true });

    await startEmailSignupAction("jane@example.com", "fr");

    const upsertArg = mockPendingSignupUpsert.mock.calls[0][0];
    const sentCode = mockSendVerificationEmail.mock.calls[0][1] as string;
    expect(upsertArg.create.codeHash).toBe(hashSignupVerificationCode(sentCode));
    expect(upsertArg.create.codeHash).not.toBe(sentCode);
  });
});
