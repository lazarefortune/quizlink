import { beforeEach, describe, expect, it, vi } from "vitest";

const mockAuth = vi.fn();
const mockQuizFindUnique = vi.fn();
const mockQuizUpdate = vi.fn();
const mockRevalidatePath = vi.fn();

vi.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    quiz: {
      findUnique: (...args: unknown[]) => mockQuizFindUnique(...args),
      update: (...args: unknown[]) => mockQuizUpdate(...args),
    },
  },
}));

import { updateQuizParticipantIdentityModeAction } from "./actions";

const ownerId = "user-1";
const quizId = "quiz-1";

const baseSettings = {
  showAnswerImmediately: true,
  showAnswersAtEnd: false,
  randomizeQuestions: true,
  randomizeOptions: false,
  timeLimitPerQuestion: 30,
};

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.mockResolvedValue({ user: { id: ownerId } });
  mockQuizFindUnique.mockResolvedValue({
    ownerId,
    settings: baseSettings,
  });
  mockQuizUpdate.mockResolvedValue({});
});

describe("updateQuizParticipantIdentityModeAction", () => {
  it("rejects invalid mode", async () => {
    const result = await updateQuizParticipantIdentityModeAction(quizId, "INVALID");
    expect(result).toEqual({ success: false, error: "Invalid participant identity mode" });
    expect(mockQuizUpdate).not.toHaveBeenCalled();
  });

  it("rejects non-owner", async () => {
    mockQuizFindUnique.mockResolvedValue({
      ownerId: "other-user",
      settings: baseSettings,
    });

    const result = await updateQuizParticipantIdentityModeAction(quizId, "PSEUDONYM");
    expect(result).toEqual({ success: false, error: "Unauthorized" });
    expect(mockQuizUpdate).not.toHaveBeenCalled();
  });

  it("updates participantIdentityMode without overwriting other settings", async () => {
    const result = await updateQuizParticipantIdentityModeAction(quizId, "NAME_EMAIL");

    expect(result).toEqual({ success: true, participantIdentityMode: "NAME_EMAIL" });
    expect(mockQuizUpdate).toHaveBeenCalledWith({
      where: { id: quizId },
      data: {
        settings: {
          ...baseSettings,
          participantIdentityMode: "NAME_EMAIL",
        },
      },
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith(`/dashboard/quiz/${quizId}`);
    expect(mockRevalidatePath).toHaveBeenCalledWith(`/dashboard/quiz/${quizId}/success`);
  });
});
