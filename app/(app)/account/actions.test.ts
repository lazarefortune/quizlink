import { describe, it, expect, vi, beforeEach } from "vitest";

const mockAuth = vi.fn();
const mockUserUpdate = vi.fn();

vi.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      update: (...args: unknown[]) => mockUserUpdate(...args),
    },
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import {
  updateNotificationPreferencesAction,
  updateUserAvatarAction,
} from "./actions";

vi.mock("@/lib/user-avatar/generateUserAvatar", () => ({
  generateUserAvatar: () => "<svg>generated</svg>",
}));

describe("updateNotificationPreferencesAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockUserUpdate.mockResolvedValue({});
  });

  it("rejects invalid payload", async () => {
    const result = await updateNotificationPreferencesAction({
      notifyQuizResponses: true,
      notifyProductUpdates: "yes",
      notifyMarketing: false,
    });

    expect(result.success).toBe(false);
    if (result.success) {
      return;
    }
    expect(result.error).toBe("Invalid notification preferences");
    expect(mockUserUpdate).not.toHaveBeenCalled();
  });

  it("rejects when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const result = await updateNotificationPreferencesAction({
      notifyQuizResponses: false,
      notifyProductUpdates: true,
      notifyMarketing: false,
    });

    expect(result.success).toBe(false);
    if (result.success) {
      return;
    }
    expect(result.error).toBe("Unauthorized");
    expect(mockUserUpdate).not.toHaveBeenCalled();
  });

  it("updates only notification fields for the session user", async () => {
    const result = await updateNotificationPreferencesAction({
      notifyQuizResponses: true,
      notifyProductUpdates: false,
      notifyMarketing: true,
    });

    expect(result.success).toBe(true);
    expect(mockUserUpdate).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: {
        notifyQuizResponses: true,
        notifyProductUpdates: false,
        notifyMarketing: true,
      },
    });
  });
});

describe("updateUserAvatarAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockUserUpdate.mockResolvedValue({});
  });

  it("rejects invalid avatar config", async () => {
    const result = await updateUserAvatarAction({
      seed: "",
      options: { hair: ["invalid"] },
    });

    expect(result.success).toBe(false);
    if (result.success) {
      return;
    }
    expect(result.error).toBe("Invalid avatar configuration");
    expect(mockUserUpdate).not.toHaveBeenCalled();
  });

  it("rejects when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);

    const result = await updateUserAvatarAction({
      seed: "user-1",
      options: { hair: ["short01"] },
    });

    expect(result.success).toBe(false);
    if (result.success) {
      return;
    }
    expect(result.error).toBe("Unauthorized");
    expect(mockUserUpdate).not.toHaveBeenCalled();
  });

  it("persists generated avatar for the session user", async () => {
    const result = await updateUserAvatarAction({
      seed: "user-1",
      backgroundColor: "c8bfe8",
      options: {
        hair: ["short05"],
        eyes: ["variant04"],
        skinColor: ["da9969"],
      },
    });

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }
    expect(result.avatar).toBe("<svg>generated</svg>");
    expect(mockUserUpdate).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: {
        avatar: "<svg>generated</svg>",
        avatarConfig: JSON.stringify({
          seed: "user-1",
          backgroundColor: "c8bfe8",
          options: {
            hair: ["short05"],
            eyes: ["variant04"],
            skinColor: ["da9969"],
          },
        }),
      },
    });
  });
});
