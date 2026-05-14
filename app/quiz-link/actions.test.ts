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

import { QUIZ_ACTION_ERROR_CODE } from "@/lib/quiz/quizActionErrorCodes";

import {
  createOrGetQuizLink,
  getOrCreatePublicQuizLink,
  getQuizLinkByToken,
  startQuizAttempt,
} from "./actions";

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
      status: "ACTIVE",
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
      status: "ACTIVE",
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

  it("refuses when quiz is not ACTIVE (e.g. DRAFT)", async () => {
    mockQuizFindUnique.mockResolvedValue({
      ownerId: "user-1",
      visibility: "PRIVATE",
      status: "DRAFT",
    });

    const result = await createOrGetQuizLink("quiz-1", true);

    expect(result.success).toBe(false);
    if (result.success) {
      return;
    }
    expect(result.error).toBe(QUIZ_ACTION_ERROR_CODE.SHARE_REQUIRES_ACTIVE);
    expect(mockQuizLinkFindFirst).not.toHaveBeenCalled();
  });
});

describe("getQuizLinkByToken", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const baseLink = {
    id: "link-1",
    quizId: "quiz-1",
    token: "tok1",
    participantId: null,
    revokedAt: null,
    expiresAt: null,
    allowMultipleAttempts: true,
    attempts: [],
    participant: null,
    quiz: {
      id: "quiz-1",
      name: "Quiz",
      visibility: "PUBLIC",
      settings: {},
      status: "ACTIVE",
      questions: [],
    },
  };

  it("returns success for ACTIVE quiz", async () => {
    mockQuizLinkFindUnique.mockResolvedValue({ ...baseLink });

    const result = await getQuizLinkByToken("tok1");

    expect(result.success).toBe(true);
  });

  it("refuses DRAFT quiz", async () => {
    mockQuizLinkFindUnique.mockResolvedValue({
      ...baseLink,
      quiz: { ...baseLink.quiz, status: "DRAFT" },
    });

    const result = await getQuizLinkByToken("tok1");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe(QUIZ_ACTION_ERROR_CODE.PLAY_DRAFT);
    }
  });

  it("refuses ARCHIVED quiz", async () => {
    mockQuizLinkFindUnique.mockResolvedValue({
      ...baseLink,
      quiz: { ...baseLink.quiz, status: "ARCHIVED" },
    });

    const result = await getQuizLinkByToken("tok1");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe(QUIZ_ACTION_ERROR_CODE.PLAY_ARCHIVED);
    }
  });
});

describe("getOrCreatePublicQuizLink", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockQuizLinkFindUnique.mockResolvedValue(null);
  });

  it("refuses DRAFT quiz even when visibility is PUBLIC", async () => {
    mockQuizFindUnique.mockResolvedValue({
      id: "quiz-1",
      visibility: "PUBLIC",
      status: "DRAFT",
    });

    const result = await getOrCreatePublicQuizLink("quiz-1");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe(QUIZ_ACTION_ERROR_CODE.PLAY_DRAFT);
    }
  });
});

describe("startQuizAttempt", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("refuses when quiz is DRAFT", async () => {
    mockQuizLinkFindUnique.mockResolvedValue({
      id: "link-1",
      expiresAt: null,
      participantId: null,
      allowMultipleAttempts: true,
      quiz: { status: "DRAFT" },
      attempts: [],
    });

    const result = await startQuizAttempt("link-1", null);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe(QUIZ_ACTION_ERROR_CODE.PLAY_DRAFT);
    }
  });
});
