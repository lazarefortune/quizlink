import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFindUnique = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    quizLink: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
    },
  },
}));

import {
  getAnonymousQuizPlayData,
  validateAnonymousQuizAnswers,
} from "./anonymous-quiz-actions";

describe("getAnonymousQuizPlayData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns options without isCorrect for public links", async () => {
    mockFindUnique.mockResolvedValue({
      participantId: null,
      revokedAt: null,
      expiresAt: null,
      quiz: {
        id: "quiz-1",
        name: "Test",
        status: "ACTIVE",
        settings: {},
        questions: [
          {
            id: "q1",
            type: "MULTIPLE_CHOICE",
            label: "Q1",
            image: null,
            imageKey: null,
            explanation: null,
            order: 0,
            options: [
              { id: "o1", label: "A", isCorrect: true },
              { id: "o2", label: "B", isCorrect: false },
            ],
          },
        ],
      },
    });

    const result = await getAnonymousQuizPlayData("tok123");

    expect(result.success).toBe(true);
    if (!result.success) return;

    const opt = result.data.questions[0]?.options[0];
    expect(opt).toEqual({ id: "o1", label: "A" });
    expect("isCorrect" in (opt ?? {})).toBe(false);
  });

  it("rejects when link is tied to a participant", async () => {
    mockFindUnique.mockResolvedValue({
      participantId: "p1",
      revokedAt: null,
      expiresAt: null,
      quiz: { id: "q", name: "n", status: "ACTIVE", settings: {}, questions: [] },
    });

    const result = await getAnonymousQuizPlayData("tok");
    expect(result.success).toBe(false);
  });
});

const anonymousLinkQuizFixture = {
  participantId: null,
  revokedAt: null,
  expiresAt: null,
  quiz: {
    id: "quiz-1",
    name: "Test",
    status: "ACTIVE",
    settings: {},
    questions: [
      {
        id: "q1",
        type: "MULTIPLE_CHOICE",
        label: "Question one",
        image: null,
        imageKey: null,
        explanation: "Because science",
        order: 0,
        options: [
          { id: "o1", label: "Alpha", isCorrect: true },
          { id: "o2", label: "Beta", isCorrect: false },
        ],
      },
      {
        id: "q2",
        type: "MULTIPLE_CHOICE",
        label: "Question two",
        image: null,
        imageKey: null,
        explanation: null,
        order: 1,
        options: [
          { id: "o3", label: "Yes", isCorrect: true },
          { id: "o4", label: "No", isCorrect: false },
        ],
      },
    ],
  },
};

describe("validateAnonymousQuizAnswers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns enriched detail rows with labels and explanation", async () => {
    mockFindUnique.mockResolvedValue(anonymousLinkQuizFixture);

    const result = await validateAnonymousQuizAnswers("tok123", [
      { questionId: "q1", selectedOptionIds: ["o2"] },
      { questionId: "q2", selectedOptionIds: ["o3"] },
    ]);

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.correctAnswersCount).toBe(1);
    expect(result.details).toHaveLength(2);

    expect(result.details[0]).toEqual({
      questionId: "q1",
      questionLabel: "Question one",
      questionImage: null,
      isCorrect: false,
      selectedOptionIds: ["o2"],
      selectedOptionLabels: ["Beta"],
      correctOptionIds: ["o1"],
      correctOptionLabels: ["Alpha"],
      explanation: "Because science",
    });

    expect(result.details[1]).toEqual({
      questionId: "q2",
      questionLabel: "Question two",
      questionImage: null,
      isCorrect: true,
      selectedOptionIds: ["o3"],
      selectedOptionLabels: ["Yes"],
      correctOptionIds: ["o3"],
      correctOptionLabels: ["Yes"],
      explanation: null,
    });
  });

  it("treats missing selection as incorrect with empty labels", async () => {
    mockFindUnique.mockResolvedValue(anonymousLinkQuizFixture);

    const result = await validateAnonymousQuizAnswers("tok123", [
      { questionId: "q1", selectedOptionIds: [] },
    ]);

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.details[0]?.isCorrect).toBe(false);
    expect(result.details[0]?.selectedOptionIds).toEqual([]);
    expect(result.details[0]?.selectedOptionLabels).toEqual([]);
  });

  it("refuses when quiz is DRAFT", async () => {
    mockFindUnique.mockResolvedValue({
      ...anonymousLinkQuizFixture,
      quiz: { ...anonymousLinkQuizFixture.quiz, status: "DRAFT" },
    });

    const result = await validateAnonymousQuizAnswers("tok123", [
      { questionId: "q1", selectedOptionIds: ["o1"] },
    ]);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("QUIZ_PLAY_DRAFT");
    }
  });
});
