import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFindUnique = vi.fn();
const mockUpdateMany = vi.fn();
const mockSendWelcomeEmail = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      updateMany: (...args: unknown[]) => mockUpdateMany(...args),
    },
  },
}));

vi.mock("@/lib/email", () => ({
  sendWelcomeEmail: (...args: unknown[]) => mockSendWelcomeEmail(...args),
}));

import { sendWelcomeEmailIfNeeded } from "./sendWelcomeEmailIfNeeded";

describe("sendWelcomeEmailIfNeeded", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSendWelcomeEmail.mockResolvedValue({ success: true });
    mockUpdateMany.mockResolvedValue({ count: 1 });
  });

  it("does nothing when welcome email was already sent", async () => {
    mockFindUnique.mockResolvedValue({
      welcomeEmailSentAt: new Date(),
      email: "a@b.com",
      name: "Ann",
      coinBalance: 3,
      preferredLanguage: "fr",
      passwordHash: "x",
      emailVerifiedAt: new Date(),
    });

    await sendWelcomeEmailIfNeeded("user-1");

    expect(mockSendWelcomeEmail).not.toHaveBeenCalled();
    expect(mockUpdateMany).not.toHaveBeenCalled();
  });

  it("does not send for email/password accounts before email is verified", async () => {
    mockFindUnique.mockResolvedValue({
      welcomeEmailSentAt: null,
      email: "a@b.com",
      name: "Ann",
      coinBalance: 2,
      preferredLanguage: "fr",
      passwordHash: "hashed",
      emailVerifiedAt: null,
    });

    await sendWelcomeEmailIfNeeded("user-1");

    expect(mockSendWelcomeEmail).not.toHaveBeenCalled();
    expect(mockUpdateMany).not.toHaveBeenCalled();
  });

  it("sends and persists welcomeEmailSentAt for OAuth-style accounts without password", async () => {
    mockFindUnique.mockResolvedValue({
      welcomeEmailSentAt: null,
      email: "g@example.com",
      name: "G",
      coinBalance: 5,
      preferredLanguage: "en",
      passwordHash: null,
      emailVerifiedAt: null,
    });

    await sendWelcomeEmailIfNeeded("user-2");

    expect(mockSendWelcomeEmail).toHaveBeenCalledWith({
      to: "g@example.com",
      name: "G",
      coinBalance: 5,
      locale: "en",
    });
    expect(mockUpdateMany).toHaveBeenCalledWith({
      where: { id: "user-2", welcomeEmailSentAt: null },
      data: { welcomeEmailSentAt: expect.any(Date) },
    });
  });

  it("sends for email/password accounts once email is verified", async () => {
    mockFindUnique.mockResolvedValue({
      welcomeEmailSentAt: null,
      email: "c@d.com",
      name: "C",
      coinBalance: 1,
      preferredLanguage: "fr",
      passwordHash: "hashed",
      emailVerifiedAt: new Date(),
    });

    await sendWelcomeEmailIfNeeded("user-3");

    expect(mockSendWelcomeEmail).toHaveBeenCalledTimes(1);
    expect(mockUpdateMany).toHaveBeenCalledTimes(1);
  });

  it("does not set welcomeEmailSentAt when sendWelcomeEmail fails", async () => {
    mockFindUnique.mockResolvedValue({
      welcomeEmailSentAt: null,
      email: "x@y.com",
      name: "X",
      coinBalance: 0,
      preferredLanguage: "fr",
      passwordHash: null,
      emailVerifiedAt: new Date(),
    });
    mockSendWelcomeEmail.mockResolvedValue({
      success: false,
      error: "Failed to send email",
    });
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await sendWelcomeEmailIfNeeded("user-4");

    expect(mockUpdateMany).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("does nothing when user is missing", async () => {
    mockFindUnique.mockResolvedValue(null);

    await sendWelcomeEmailIfNeeded("missing");

    expect(mockSendWelcomeEmail).not.toHaveBeenCalled();
  });
});
