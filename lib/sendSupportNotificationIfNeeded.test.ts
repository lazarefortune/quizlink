import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFindUnique = vi.fn();
const mockGetSupportNotificationSettings = vi.fn();
const mockSendSupportFeedbackNotificationEmail = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    feedback: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
    },
  },
}));

vi.mock("@/lib/settings/support-notification-settings", () => ({
  getSupportNotificationSettings: () => mockGetSupportNotificationSettings(),
}));

vi.mock("@/lib/email", () => ({
  sendSupportFeedbackNotificationEmail: (...args: unknown[]) =>
    mockSendSupportFeedbackNotificationEmail(...args),
}));

import { sendSupportNotificationIfNeeded } from "./sendSupportNotificationIfNeeded";

const baseSettings = {
  enabled: true,
  emails: ["admin@example.com"],
  notifyOnBug: true,
  notifyOnSuggestion: true,
  notifyOnFeedback: true,
};

const baseFeedback = {
  id: "fb-1",
  type: "BUG",
  message: "Hello",
  page: "/dashboard",
  userAgent: "ua",
  status: "NEW",
  createdAt: new Date("2026-05-10T12:00:00.000Z"),
  user: { email: "user@example.com", name: "Pat" },
};

describe("sendSupportNotificationIfNeeded", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSupportNotificationSettings.mockResolvedValue(baseSettings);
    mockFindUnique.mockResolvedValue(baseFeedback);
    mockSendSupportFeedbackNotificationEmail.mockResolvedValue({ success: true });
  });

  it("does not send when notifications are disabled", async () => {
    mockGetSupportNotificationSettings.mockResolvedValue({
      ...baseSettings,
      enabled: false,
    });

    await sendSupportNotificationIfNeeded("fb-1");

    expect(mockFindUnique).not.toHaveBeenCalled();
    expect(mockSendSupportFeedbackNotificationEmail).not.toHaveBeenCalled();
  });

  it("does not send when recipient list is empty", async () => {
    mockGetSupportNotificationSettings.mockResolvedValue({
      ...baseSettings,
      emails: [],
    });

    await sendSupportNotificationIfNeeded("fb-1");

    expect(mockFindUnique).not.toHaveBeenCalled();
    expect(mockSendSupportFeedbackNotificationEmail).not.toHaveBeenCalled();
  });

  it("does not send when type is not enabled", async () => {
    mockGetSupportNotificationSettings.mockResolvedValue({
      ...baseSettings,
      notifyOnBug: false,
    });
    mockFindUnique.mockResolvedValue({ ...baseFeedback, type: "BUG" });

    await sendSupportNotificationIfNeeded("fb-1");

    expect(mockSendSupportFeedbackNotificationEmail).not.toHaveBeenCalled();
  });

  it("sends when BUG is allowed and enabled", async () => {
    mockFindUnique.mockResolvedValue({ ...baseFeedback, type: "BUG" });

    await sendSupportNotificationIfNeeded("fb-1");

    expect(mockSendSupportFeedbackNotificationEmail).toHaveBeenCalledTimes(1);
    expect(mockSendSupportFeedbackNotificationEmail).toHaveBeenCalledWith({
      recipients: ["admin@example.com"],
      feedbackId: "fb-1",
      type: "BUG",
      message: "Hello",
      page: "/dashboard",
      userEmail: "user@example.com",
      userName: "Pat",
      createdAt: baseFeedback.createdAt,
      adminUrl: expect.stringMatching(/\/admin\/feedback$/),
    });
  });

  it("does not throw when email helper returns failure", async () => {
    mockSendSupportFeedbackNotificationEmail.mockResolvedValue({
      success: false,
      error: "smtp down",
    });

    await expect(sendSupportNotificationIfNeeded("fb-1")).resolves.toBeUndefined();
  });

  it("does not throw when email helper throws", async () => {
    mockSendSupportFeedbackNotificationEmail.mockRejectedValue(new Error("network"));

    await expect(sendSupportNotificationIfNeeded("fb-1")).resolves.toBeUndefined();
  });

  it("does not throw when prisma findUnique throws", async () => {
    mockFindUnique.mockRejectedValue(new Error("db"));

    await expect(sendSupportNotificationIfNeeded("fb-1")).resolves.toBeUndefined();
  });
});
