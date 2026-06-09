import { beforeEach, describe, expect, it, vi } from "vitest";

const mockUserFindUnique = vi.fn();
const mockUserUpdate = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: (...args: unknown[]) => mockUserFindUnique(...args),
      update: (...args: unknown[]) => mockUserUpdate(...args),
    },
  },
}));

import { ensureDefaultUserAvatar } from "./ensureDefaultUserAvatar";

describe("ensureDefaultUserAvatar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns existing avatar without updating", async () => {
    mockUserFindUnique.mockResolvedValue({
      avatar: "<svg>existing</svg>",
      avatarConfig: '{"seed":"user-1","options":{}}',
    });

    const result = await ensureDefaultUserAvatar("user-1");

    expect(result).toEqual({
      avatar: "<svg>existing</svg>",
      avatarConfig: '{"seed":"user-1","options":{}}',
    });
    expect(mockUserUpdate).not.toHaveBeenCalled();
  });

  it("generates and persists a default avatar when missing", async () => {
    mockUserFindUnique.mockResolvedValue({
      avatar: null,
      avatarConfig: null,
    });
    mockUserUpdate.mockImplementation(async ({ data }: { data: { avatar: string; avatarConfig: string } }) => ({
      avatar: data.avatar,
      avatarConfig: data.avatarConfig,
    }));

    const result = await ensureDefaultUserAvatar("user-2");

    expect(mockUserUpdate).toHaveBeenCalledOnce();
    expect(result?.avatar).toContain("<svg");
    expect(result?.avatarConfig).toContain('"seed":"user-2"');
  });

  it("returns null when user does not exist", async () => {
    mockUserFindUnique.mockResolvedValue(null);

    const result = await ensureDefaultUserAvatar("missing");

    expect(result).toBeNull();
    expect(mockUserUpdate).not.toHaveBeenCalled();
  });
});
