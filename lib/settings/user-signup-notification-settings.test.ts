import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFindUnique = vi.fn();
const mockUpsert = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    appSetting: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      upsert: (...args: unknown[]) => mockUpsert(...args),
    },
  },
}));

import { APP_SETTING_KEYS } from "@/lib/settings/app-setting-keys";
import {
  getUserSignupNotificationSettings,
  updateUserSignupNotificationSettings,
  userSignupNotificationSettingsSchema,
  USER_SIGNUP_NOTIFICATION_SETTINGS_DEFAULTS,
} from "@/lib/settings/user-signup-notification-settings";

describe("userSignupNotificationSettingsSchema", () => {
  const validBase = {
    enabled: true,
    emails: ["hello@example.com"],
    notifyOnEmailSignup: true,
    notifyOnGoogleSignup: false,
  };

  it("should trim emails", () => {
    const result = userSignupNotificationSettingsSchema.parse({
      ...validBase,
      emails: ["  a@b.co  ", "c@d.co"],
    });
    expect(result.emails).toEqual(["a@b.co", "c@d.co"]);
  });

  it("should deduplicate emails case-insensitively", () => {
    const result = userSignupNotificationSettingsSchema.parse({
      ...validBase,
      emails: ["A@X.COM", "a@x.com", "B@Y.COM"],
    });
    expect(result.emails).toEqual(["A@X.COM", "B@Y.COM"]);
  });

  it("should reject invalid emails", () => {
    expect(() =>
      userSignupNotificationSettingsSchema.parse({
        ...validBase,
        emails: ["not-an-email"],
      }),
    ).toThrow();
  });

  it("should reject more than 10 emails after deduplication", () => {
    const emails = Array.from({ length: 11 }, (_, i) => `u${i}@x.com`);
    expect(() =>
      userSignupNotificationSettingsSchema.parse({
        ...validBase,
        emails,
      }),
    ).toThrow();
  });
});

describe("getUserSignupNotificationSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return defaults when setting is absent", async () => {
    mockFindUnique.mockResolvedValue(null);

    const result = await getUserSignupNotificationSettings();

    expect(result).toEqual(USER_SIGNUP_NOTIFICATION_SETTINGS_DEFAULTS);
    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { key: APP_SETTING_KEYS.USER_SIGNUP_NOTIFICATIONS },
      select: { value: true },
    });
  });

  it("should return defaults when stored JSON is invalid", async () => {
    mockFindUnique.mockResolvedValue({ value: { enabled: "yes" } });

    const result = await getUserSignupNotificationSettings();

    expect(result).toEqual(USER_SIGNUP_NOTIFICATION_SETTINGS_DEFAULTS);
  });

  it("should return parsed value when stored JSON is valid", async () => {
    const stored = {
      enabled: true,
      emails: ["a@b.co"],
      notifyOnEmailSignup: false,
      notifyOnGoogleSignup: true,
    };
    mockFindUnique.mockResolvedValue({ value: stored });

    const result = await getUserSignupNotificationSettings();

    expect(result).toEqual(stored);
  });
});

describe("updateUserSignupNotificationSettings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpsert.mockResolvedValue(undefined);
  });

  it("should persist via upsert with validated payload", async () => {
    const input = {
      enabled: true,
      emails: ["  x@y.com ", "x@y.com"],
      notifyOnEmailSignup: true,
      notifyOnGoogleSignup: false,
    };

    const result = await updateUserSignupNotificationSettings(input);

    expect(result.emails).toEqual(["x@y.com"]);
    expect(mockUpsert).toHaveBeenCalledTimes(1);
    expect(mockUpsert).toHaveBeenCalledWith({
      where: { key: APP_SETTING_KEYS.USER_SIGNUP_NOTIFICATIONS },
      create: {
        key: APP_SETTING_KEYS.USER_SIGNUP_NOTIFICATIONS,
        value: {
          enabled: true,
          emails: ["x@y.com"],
          notifyOnEmailSignup: true,
          notifyOnGoogleSignup: false,
        },
      },
      update: {
        value: {
          enabled: true,
          emails: ["x@y.com"],
          notifyOnEmailSignup: true,
          notifyOnGoogleSignup: false,
        },
      },
    });
  });
});
