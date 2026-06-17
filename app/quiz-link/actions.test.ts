import { describe, it, expect, vi, beforeEach } from "vitest";

const mockAuth = vi.fn();
const mockResolveQuizPlayAccess = vi.fn();

vi.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

vi.mock("@/lib/quiz/resolveQuizPlayAccess", () => ({
  resolveQuizPlayAccess: (...args: unknown[]) => mockResolveQuizPlayAccess(...args),
  getQuizPlayBlockErrorCode: (access: { canAcceptResponses: boolean }) =>
    access.canAcceptResponses ? null : "QUIZ_FREE_RESPONSE_LIMIT_REACHED",
}));

const mockQuizFindUnique = vi.fn();
const mockQuizLinkFindFirst = vi.fn();
const mockQuizLinkFindUnique = vi.fn();
const mockQuizLinkCreate = vi.fn();
const mockQuizLinkUpdate = vi.fn();
const mockQuizAttemptCreate = vi.fn();
const mockEnsureQuizLinkResponseActivityStarted = vi.fn();
const mockIncrementQuizStartedAggregate = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    quiz: { findUnique: (...args: unknown[]) => mockQuizFindUnique(...args) },
    quizLink: {
      findFirst: (...args: unknown[]) => mockQuizLinkFindFirst(...args),
      findUnique: (...args: unknown[]) => mockQuizLinkFindUnique(...args),
      create: (...args: unknown[]) => mockQuizLinkCreate(...args),
      update: (...args: unknown[]) => mockQuizLinkUpdate(...args),
    },
    quizAttempt: {
      create: (...args: unknown[]) => mockQuizAttemptCreate(...args),
    },
  },
}));

vi.mock("@/lib/quiz/quizLinkActivityPersistence", () => ({
  ensureQuizLinkResponseActivityStarted: (...args: unknown[]) =>
    mockEnsureQuizLinkResponseActivityStarted(...args),
}));

vi.mock("@/lib/quiz/quiz-response-aggregates", () => ({
  incrementQuizStartedAggregate: (...args: unknown[]) =>
    mockIncrementQuizStartedAggregate(...args),
}));

import { QUIZ_ACTION_ERROR_CODE } from "@/lib/quiz/quizActionErrorCodes";

import {
  createOrGetQuizLink,
  getOrCreatePublicQuizLink,
  getQuizLinkByToken,
  startQuizAttempt,
} from "./actions";

function quotaPlayAccess(overrides: {
  canAcceptResponses: boolean;
  completedResponses?: number;
}) {
  return {
    completedResponses: overrides.completedResponses ?? 0,
    freeLimit: 20,
    remainingFreeResponses: overrides.canAcceptResponses ? 1 : 0,
    hasReachedFreeLimit: !overrides.canAcceptResponses,
    isProActive: false,
    isQuizUnlockedWithCoins: false,
    isUnlocked: false,
    canAcceptResponses: overrides.canAcceptResponses,
    canViewAllDetails: false,
    canViewAdvancedStats: false,
  };
}

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
    responsesStartedAt: null,
    attempts: [],
    participant: null,
    quiz: {
      id: "quiz-1",
      ownerId: "owner-1",
      name: "Quiz",
      visibility: "PUBLIC",
      settings: {},
      status: "ACTIVE",
      questions: [],
    },
  };

  it("returns success for ACTIVE quiz", async () => {
    mockQuizLinkFindUnique.mockResolvedValue({ ...baseLink });
    mockResolveQuizPlayAccess.mockResolvedValue(
      quotaPlayAccess({ canAcceptResponses: true, completedResponses: 5 }),
    );

    const result = await getQuizLinkByToken("tok1");

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.quizLink.isAcceptingResponses).toBe(true);
    expect(mockResolveQuizPlayAccess).toHaveBeenCalledWith({
      quizId: "quiz-1",
      ownerId: "owner-1",
    });
  });

  it("sets isAcceptingResponses false when free quota is reached", async () => {
    mockQuizLinkFindUnique.mockResolvedValue({ ...baseLink });
    mockResolveQuizPlayAccess.mockResolvedValue(
      quotaPlayAccess({ canAcceptResponses: false, completedResponses: 20 }),
    );

    const result = await getQuizLinkByToken("tok1");

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.quizLink.isAcceptingResponses).toBe(false);
  });

  it("sets isAcceptingResponses true when quota reached but coin-unlocked", async () => {
    mockQuizLinkFindUnique.mockResolvedValue({ ...baseLink });
    mockResolveQuizPlayAccess.mockResolvedValue({
      ...quotaPlayAccess({ canAcceptResponses: true, completedResponses: 20 }),
      isQuizUnlockedWithCoins: true,
      isUnlocked: true,
    });

    const result = await getQuizLinkByToken("tok1");

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.quizLink.isAcceptingResponses).toBe(true);
  });

  it("sets isAcceptingResponses true when quota reached but Pro is active", async () => {
    mockQuizLinkFindUnique.mockResolvedValue({ ...baseLink });
    mockResolveQuizPlayAccess.mockResolvedValue({
      ...quotaPlayAccess({ canAcceptResponses: true, completedResponses: 20 }),
      isProActive: true,
      isUnlocked: true,
    });

    const result = await getQuizLinkByToken("tok1");

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.quizLink.isAcceptingResponses).toBe(true);
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
    expect(mockResolveQuizPlayAccess).not.toHaveBeenCalled();
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
    mockEnsureQuizLinkResponseActivityStarted.mockResolvedValue(undefined);
    mockIncrementQuizStartedAggregate.mockResolvedValue(undefined);
  });

  const baseQuizLinkRow = {
    id: "link-1",
    quizId: "quiz-1",
    expiresAt: null,
    participantId: null,
    allowMultipleAttempts: true,
    quiz: { id: "quiz-1", status: "ACTIVE", ownerId: "owner-1" },
    attempts: [],
  };

  it("refuses when quiz is DRAFT", async () => {
    mockQuizLinkFindUnique.mockResolvedValue({
      ...baseQuizLinkRow,
      quiz: { ...baseQuizLinkRow.quiz, status: "DRAFT" },
    });

    const result = await startQuizAttempt("link-1", null);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe(QUIZ_ACTION_ERROR_CODE.PLAY_DRAFT);
    }
  });

  it("allows start at 19 completed responses", async () => {
    mockQuizLinkFindUnique.mockResolvedValue(baseQuizLinkRow);
    mockResolveQuizPlayAccess.mockResolvedValue(
      quotaPlayAccess({ canAcceptResponses: true, completedResponses: 19 }),
    );
    mockQuizAttemptCreate.mockResolvedValue({
      id: "att-1",
      quizLinkId: "link-1",
      participantId: null,
    });

    const result = await startQuizAttempt("link-1", null);

    expect(result.success).toBe(true);
    expect(mockQuizAttemptCreate).toHaveBeenCalled();
  });

  it("refuses start at 20 completed responses without unlock or Pro", async () => {
    mockQuizLinkFindUnique.mockResolvedValue(baseQuizLinkRow);
    mockResolveQuizPlayAccess.mockResolvedValue(
      quotaPlayAccess({ canAcceptResponses: false, completedResponses: 20 }),
    );

    const result = await startQuizAttempt("link-1", null);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe(QUIZ_ACTION_ERROR_CODE.FREE_RESPONSE_LIMIT_REACHED);
    }
    expect(mockQuizAttemptCreate).not.toHaveBeenCalled();
  });

  it("allows start at 20 completed when coin-unlocked", async () => {
    mockQuizLinkFindUnique.mockResolvedValue(baseQuizLinkRow);
    mockResolveQuizPlayAccess.mockResolvedValue({
      ...quotaPlayAccess({ canAcceptResponses: true, completedResponses: 20 }),
      isQuizUnlockedWithCoins: true,
      isUnlocked: true,
    });
    mockQuizAttemptCreate.mockResolvedValue({
      id: "att-2",
      quizLinkId: "link-1",
      participantId: null,
    });

    const result = await startQuizAttempt("link-1", null);

    expect(result.success).toBe(true);
    expect(mockQuizAttemptCreate).toHaveBeenCalled();
  });

  it("allows start at 20 completed when Pro is active", async () => {
    mockQuizLinkFindUnique.mockResolvedValue(baseQuizLinkRow);
    mockResolveQuizPlayAccess.mockResolvedValue({
      ...quotaPlayAccess({ canAcceptResponses: true, completedResponses: 20 }),
      isProActive: true,
      isUnlocked: true,
    });
    mockQuizAttemptCreate.mockResolvedValue({
      id: "att-3",
      quizLinkId: "link-1",
      participantId: null,
    });

    const result = await startQuizAttempt("link-1", null);

    expect(result.success).toBe(true);
    expect(mockQuizAttemptCreate).toHaveBeenCalled();
  });

  it("allows start when Pro is active despite quota at limit", async () => {
    mockResolveQuizPlayAccess.mockResolvedValue({
      ...quotaPlayAccess({ canAcceptResponses: true, completedResponses: 25 }),
      isProActive: true,
      isUnlocked: true,
    });
    mockQuizAttemptCreate.mockResolvedValue({
      id: "att-pro",
      quizLinkId: "link-1",
      participantId: null,
    });

    const result = await startQuizAttempt("link-1", null);

    expect(result.success).toBe(true);
    expect(mockQuizAttemptCreate).toHaveBeenCalled();
  });
});
