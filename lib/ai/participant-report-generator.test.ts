import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  generateParticipantReportFromPayload,
  normalizeReportResponse,
} from "./participant-report-generator";
import { participantReportOutputSchema } from "./participant-report-schema";
import type { ParticipantReportPayload } from "@/lib/analytics/quiz-participant-aggregator";

const mockCreate = vi.fn();
vi.mock("./openai-client", () => ({
  getOpenAIClient: () => ({
    chat: {
      completions: {
        create: mockCreate,
      },
    },
  }),
}));

const validReportPayload: ParticipantReportPayload = {
  quiz: {
    id: "q1",
    name: "Quiz Test",
    questionsCount: 10,
    settingsSummary: "QCM, 10 min",
  },
  participant: { id: "p1", name: "Alice" },
  totals: {
    attemptsCount: 3,
    answersCount: 30,
    correctCount: 20,
    accuracyPct: 66.7,
    avgTimePerQuestionSec: 45,
    lastAttemptAt: "2025-01-01T12:00:00Z",
    trend: [
      { attemptIndex: 1, accuracyPct: 60, avgTimeSec: 50 },
      { attemptIndex: 2, accuracyPct: 70, avgTimeSec: 42 },
      { attemptIndex: 3, accuracyPct: 70, avgTimeSec: 43 },
    ],
  },
  byQuestionType: {
    MULTIPLE_CHOICE: { seen: 20, correct: 14, accuracyPct: 70 },
    TRUE_FALSE: { seen: 10, correct: 6, accuracyPct: 60 },
    CHECKBOX: {
      seen: 0,
      correct: 0,
      accuracyPct: 0,
      checkboxPatterns: { avgMissedCorrectOptions: 0, avgExtraWrongOptions: 0 },
    },
  },
  mostMissedQuestions: [],
  timePressureSignals: {
    tooFastQuestions: [],
    tooSlowQuestions: [],
  },
  examples: [],
};

const validReportJson = {
  summary: {
    overallLevel: "intermediate",
    oneSentence: "Bon potentiel avec des axes de progrès.",
    keyNumbers: ["66.7% de réussite", "3 tentatives"],
  },
  strengths: [{ title: "QCM", evidence: "70%", metric: "14/20" }],
  weaknesses: [{ title: "Vrai/Faux", evidence: "60%", metric: "6/10" }],
  recurringMistakes: [
    {
      pattern: "Confusion options",
      whyLikely: "Concepts proches.",
      howToFix: "Revoir les définitions.",
    },
  ],
  mostImportantQuestionsToReview: [
    {
      question: "Question X",
      whyMissed: "Confusion.",
      whatToRemember: "Point clé.",
    },
  ],
  studyPlan7Days: [
    { day: 1, focus: "QCM", tasks: ["5 questions"] },
    { day: 2, focus: "Vrai/Faux", tasks: ["3 questions"] },
  ],
  tips: ["Réviser régulièrement."],
  warnings: ["Peu de tentatives."],
};

describe("participant-report-generator", () => {
  describe("normalizeReportResponse", () => {
    it("should return object as-is when it has summary and all keys", () => {
      const normalized = normalizeReportResponse(validReportJson);
      const result = participantReportOutputSchema.safeParse(normalized);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.summary.overallLevel).toBe("intermediate");
        expect(result.data.strengths).toHaveLength(1);
        expect(result.data.tips).toEqual(["Réviser régulièrement."]);
      }
    });

    it("should fill missing arrays with empty arrays", () => {
      const partial = {
        summary: validReportJson.summary,
      };
      const normalized = normalizeReportResponse(partial) as Record<string, unknown>;
      expect(normalized.summary).toEqual(validReportJson.summary);
      expect(normalized.strengths).toEqual([]);
      expect(normalized.weaknesses).toEqual([]);
      expect(normalized.recurringMistakes).toEqual([]);
      expect(normalized.mostImportantQuestionsToReview).toEqual([]);
      expect(normalized.studyPlan7Days).toEqual([]);
      expect(normalized.tips).toEqual([]);
      expect(normalized.warnings).toEqual([]);
    });

    it("should provide default summary when summary is missing", () => {
      const noSummary = {
        strengths: [],
        weaknesses: [],
        recurringMistakes: [],
        mostImportantQuestionsToReview: [],
        studyPlan7Days: [],
        tips: [],
        warnings: [],
      };
      const normalized = normalizeReportResponse(noSummary) as Record<
        string,
        unknown
      >;
      expect(normalized.summary).toEqual({
        overallLevel: "intermediate",
        oneSentence: "",
        keyNumbers: [],
      });
    });

    it("should accept French keys (résumé, forces, faiblesses, etc.)", () => {
      const french = {
        résumé: validReportJson.summary,
        forces: validReportJson.strengths,
        faiblesses: validReportJson.weaknesses,
        erreursRecurrentes: validReportJson.recurringMistakes,
        questionsARevoir: validReportJson.mostImportantQuestionsToReview,
        planEtude7Jours: validReportJson.studyPlan7Days,
        conseils: validReportJson.tips,
        avertissements: validReportJson.warnings,
      };
      const normalized = normalizeReportResponse(french);
      const result = participantReportOutputSchema.safeParse(normalized);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.summary).toEqual(validReportJson.summary);
        expect(result.data.strengths).toEqual(validReportJson.strengths);
        expect(result.data.tips).toEqual(validReportJson.tips);
      }
    });

    it("should unwrap report from common wrapper keys", () => {
      const wrapped = {
        report: validReportJson,
      };
      const normalized = normalizeReportResponse(wrapped);
      const result = participantReportOutputSchema.safeParse(normalized);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.summary.overallLevel).toBe("intermediate");
      }
    });

    it("should unwrap from data key", () => {
      const wrapped = { data: validReportJson };
      const normalized = normalizeReportResponse(wrapped);
      const result = participantReportOutputSchema.safeParse(normalized);
      expect(result.success).toBe(true);
    });

    it("should return input unchanged for null or non-object input", () => {
      expect(normalizeReportResponse(null)).toBe(null);
      expect(normalizeReportResponse(42)).toBe(42);
    });
  });

  describe("generateParticipantReportFromPayload", () => {
    beforeEach(() => {
      mockCreate.mockReset();
    });

    it("should return parsed report when API returns valid JSON", async () => {
      mockCreate.mockResolvedValue({
        id: "test",
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content: JSON.stringify(validReportJson),
            },
            finish_reason: "stop",
            logprobs: null,
          },
        ],
        created: 0,
        model: "",
        object: "chat.completion",
        usage: null,
        system_fingerprint: null,
      } as never);

      const result = await generateParticipantReportFromPayload(
        validReportPayload
      );
      expect(result.summary.overallLevel).toBe("intermediate");
      expect(result.strengths).toHaveLength(1);
      expect(result.tips).toContain("Réviser régulièrement.");
    });

    it("should strip markdown code block from response", async () => {
      const wrapped = "```json\n" + JSON.stringify(validReportJson) + "\n```";
      mockCreate.mockResolvedValue({
        id: "test",
        choices: [
          {
            index: 0,
            message: { role: "assistant", content: wrapped },
            finish_reason: "stop",
            logprobs: null,
          },
        ],
        created: 0,
        model: "",
        object: "chat.completion",
        usage: null,
        system_fingerprint: null,
      } as never);

      const result = await generateParticipantReportFromPayload(
        validReportPayload
      );
      expect(result.summary.oneSentence).toBe(
        "Bon potentiel avec des axes de progrès."
      );
    });

    it("should throw when API returns empty content", async () => {
      mockCreate.mockResolvedValue({
        id: "test",
        choices: [
          {
            index: 0,
            message: { role: "assistant", content: null },
            finish_reason: "stop",
            logprobs: null,
          },
        ],
        created: 0,
        model: "",
        object: "chat.completion",
        usage: null,
        system_fingerprint: null,
      } as never);

      await expect(
        generateParticipantReportFromPayload(validReportPayload)
      ).rejects.toThrow("No response from OpenAI");
    });

    it("should throw when API returns invalid JSON", async () => {
      mockCreate.mockResolvedValue({
        id: "test",
        choices: [
          {
            index: 0,
            message: { role: "assistant", content: "not valid json {" },
            finish_reason: "stop",
            logprobs: null,
          },
        ],
        created: 0,
        model: "",
        object: "chat.completion",
        usage: null,
        system_fingerprint: null,
      } as never);

      await expect(
        generateParticipantReportFromPayload(validReportPayload)
      ).rejects.toThrow("Invalid JSON from OpenAI");
    });

    it("should normalize and validate when API returns wrapped or French keys", async () => {
      const wrappedFrench = {
        report: {
          résumé: validReportJson.summary,
          forces: validReportJson.strengths,
          faiblesses: validReportJson.weaknesses,
          erreursRecurrentes: validReportJson.recurringMistakes,
          questionsARevoir: validReportJson.mostImportantQuestionsToReview,
          planEtude7Jours: validReportJson.studyPlan7Days,
          conseils: validReportJson.tips,
          avertissements: validReportJson.warnings,
        },
      };
      mockCreate.mockResolvedValue({
        id: "test",
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content: JSON.stringify(wrappedFrench),
            },
            finish_reason: "stop",
            logprobs: null,
          },
        ],
        created: 0,
        model: "",
        object: "chat.completion",
        usage: null,
        system_fingerprint: null,
      } as never);

      const result = await generateParticipantReportFromPayload(
        validReportPayload
      );
      expect(result.summary).toEqual(validReportJson.summary);
      expect(result.strengths).toEqual(validReportJson.strengths);
      expect(result.tips).toEqual(validReportJson.tips);
    });
  });
});
