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

  it("verifies email, clears tokens, and triggers welcome + signup notification when eligible", async () => {
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);
    mockFindUnique.mockResolvedValue({
      id: "user-verify-1",
      email: "u@example.com",
      emailVerifiedAt: null,
      emailVerificationTokens: [
        { id: "tok-1", code: "123456", expiresAt },
      ],
    });

    const result = await verifyEmailAction("u@example.com", "123456");

    expect(result).toEqual({ success: true });
    expect(mockTransaction).toHaveBeenCalledTimes(1);
    expect(mockSendWelcomeEmailIfNeeded).toHaveBeenCalledWith("user-verify-1");
    expect(mockSendUserSignupNotificationIfNeeded).toHaveBeenCalledWith(
      "user-verify-1",
      "email",
    );
  });

  it("does not send welcome email or signup notification when verification fails", async () => {
    mockFindUnique.mockResolvedValue(null);

    const result = await verifyEmailAction("nope@example.com", "000000");

    expect(result.success).toBe(false);
    expect(mockTransaction).not.toHaveBeenCalled();
    expect(mockSendWelcomeEmailIfNeeded).not.toHaveBeenCalled();
    expect(mockSendUserSignupNotificationIfNeeded).not.toHaveBeenCalled();
  });

  it("does not send signup notification on replay when email is already verified", async () => {
    mockFindUnique.mockResolvedValue({
      id: "user-verify-1",
      email: "u@example.com",
      emailVerifiedAt: new Date(),
      emailVerificationTokens: [],
    });

    const result = await verifyEmailAction("u@example.com", "123456");

    expect(result).toEqual({ success: false, error: "Email already verified" });
    expect(mockTransaction).not.toHaveBeenCalled();
    expect(mockSendWelcomeEmailIfNeeded).not.toHaveBeenCalled();
    expect(mockSendUserSignupNotificationIfNeeded).not.toHaveBeenCalled();
  });
});
