import { describe, it, expect, vi, beforeEach } from "vitest";

const mockAuth = vi.fn();

vi.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

const mockQuizFindUnique = vi.fn();
const mockQuizLinkFindFirst = vi.fn();
const mockQuizLinkFindUnique = vi.fn();
const mockQuizLinkCreate = vi.fn();
const mockQuizLinkUpdate = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    quiz: { findUnique: (...args: unknown[]) => mockQuizFindUnique(...args) },
    quizLink: {
      findFirst: (...args: unknown[]) => mockQuizLinkFindFirst(...args),
      findUnique: (...args: unknown[]) => mockQuizLinkFindUnique(...args),
      create: (...args: unknown[]) => mockQuizLinkCreate(...args),
      update: (...args: unknown[]) => mockQuizLinkUpdate(...args),
    },
  },
}));

import { createOrGetQuizLink } from "./actions";

describe("createOrGetQuizLink", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockQuizLinkFindUnique.mockResolvedValue(null);
  });

  it("creates a general link for a private quiz owned by the user", async () => {
    mockQuizFindUnique.mockResolvedValue({
      ownerId: "user-1",
      visibility: "PRIVATE",
    });
    mockQuizLinkFindFirst.mockResolvedValue(null);
    mockQuizLinkCreate.mockResolvedValue({
      id: "link-1",
      token: "abc123token",
    });

    const result = await createOrGetQuizLink("quiz-1", true);

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }
    expect(result.quizLink.token).toBe("abc123token");
    expect(mockQuizLinkCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          quizId: "quiz-1",
          participantId: null,
        }),
      }),
    );
  });

  it("reuses existing general link (participantId null)", async () => {
    mockQuizFindUnique.mockResolvedValue({
      ownerId: "user-1",
      visibility: "PRIVATE",
    });
    mockQuizLinkFindFirst.mockResolvedValue({
      id: "existing",
      token: "existingtok",
      allowMultipleAttempts: true,
    });

    const result = await createOrGetQuizLink("quiz-1", true);

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }
    expect(result.quizLink.token).toBe("existingtok");
    expect(mockQuizLinkCreate).not.toHaveBeenCalled();
  });
});
