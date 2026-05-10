import { describe, it, expect, vi, beforeEach } from "vitest";
import { ZodError } from "zod";

const mockAuth = vi.fn();
const mockUpdateSupportNotificationSettings = vi.fn();
const mockRevalidatePath = vi.fn();

vi.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

vi.mock("@/lib/settings/support-notification-settings", () => ({
  updateSupportNotificationSettings: (...args: unknown[]) =>
    mockUpdateSupportNotificationSettings(...args),
}));

vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}));

import { updateSupportNotificationSettingsAction } from "./actions";

const validPayload = {
  enabled: true,
  emails: ["a@b.co"],
  notifyOnBug: true,
  notifyOnSuggestion: false,
  notifyOnFeedback: true,
};

describe("updateSupportNotificationSettingsAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({
      user: { id: "admin-1", role: "ADMIN" },
    });
    mockUpdateSupportNotificationSettings.mockResolvedValue(validPayload);
  });

  it("returns unauthorized when there is no session user id", async () => {
    mockAuth.mockResolvedValue({ user: null });

    const result = await updateSupportNotificationSettingsAction(validPayload);

    expect(result).toEqual({ success: false, error: "Unauthorized" });
    expect(mockUpdateSupportNotificationSettings).not.toHaveBeenCalled();
    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });

  it("returns unauthorized when role is not ADMIN", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user-1", role: "USER" },
    });

    const result = await updateSupportNotificationSettingsAction(validPayload);

    expect(result).toEqual({ success: false, error: "Unauthorized" });
    expect(mockUpdateSupportNotificationSettings).not.toHaveBeenCalled();
  });

  it("persists settings and revalidates when admin is valid", async () => {
    const result = await updateSupportNotificationSettingsAction(validPayload);

    expect(result).toEqual({ success: true });
    expect(mockUpdateSupportNotificationSettings).toHaveBeenCalledWith(validPayload);
    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/settings");
  });

  it("returns zod message when update throws ZodError", async () => {
    mockUpdateSupportNotificationSettings.mockImplementation(() => {
      throw new ZodError([
        {
          code: "custom",
          message: "Email invalide",
          path: ["emails", 0],
        },
      ]);
    });

    const result = await updateSupportNotificationSettingsAction(validPayload);

    expect(result).toEqual({ success: false, error: "Email invalide" });
    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });

  it("returns generic error when update throws unexpectedly", async () => {
    mockUpdateSupportNotificationSettings.mockRejectedValue(new Error("db down"));

    const result = await updateSupportNotificationSettingsAction(validPayload);

    expect(result).toEqual({ success: false, error: "Failed to save settings" });
    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });
});
