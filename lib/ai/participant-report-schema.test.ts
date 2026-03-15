import { describe, it, expect } from "vitest";
import {
  participantReportSummarySchema,
  participantReportStrengthWeaknessSchema,
  participantReportRecurringMistakeSchema,
  participantReportQuestionToReviewSchema,
  participantReportStudyDaySchema,
  participantReportOutputSchema,
} from "./participant-report-schema";

describe("participant-report-schema", () => {
  describe("participantReportSummarySchema", () => {
    it("should accept valid summary", () => {
      const valid = {
        overallLevel: "intermediate" as const,
        oneSentence: "Bon niveau global.",
        keyNumbers: ["5/10 questions", "3 tentatives"],
      };
      expect(participantReportSummarySchema.parse(valid)).toEqual(valid);
    });

    it("should accept all overallLevel values", () => {
      expect(
        participantReportSummarySchema.parse({
          overallLevel: "beginner",
          oneSentence: "x",
          keyNumbers: [],
        }).overallLevel
      ).toBe("beginner");
      expect(
        participantReportSummarySchema.parse({
          overallLevel: "advanced",
          oneSentence: "x",
          keyNumbers: [],
        }).overallLevel
      ).toBe("advanced");
    });

    it("should reject invalid overallLevel", () => {
      expect(() =>
        participantReportSummarySchema.parse({
          overallLevel: "expert",
          oneSentence: "x",
          keyNumbers: [],
        })
      ).toThrow();
    });

    it("should reject missing required fields", () => {
      expect(() => participantReportSummarySchema.parse({})).toThrow();
      expect(() =>
        participantReportSummarySchema.parse({
          oneSentence: "x",
          keyNumbers: [],
        })
      ).toThrow();
      expect(() =>
        participantReportSummarySchema.parse({
          overallLevel: "intermediate",
          keyNumbers: [],
        })
      ).toThrow();
      expect(() =>
        participantReportSummarySchema.parse({
          overallLevel: "intermediate",
          oneSentence: "x",
        })
      ).toThrow();
    });

    it("should require keyNumbers to be array of strings", () => {
      expect(() =>
        participantReportSummarySchema.parse({
          overallLevel: "intermediate",
          oneSentence: "x",
          keyNumbers: [1, 2],
        })
      ).toThrow();
      expect(
        participantReportSummarySchema.parse({
          overallLevel: "intermediate",
          oneSentence: "x",
          keyNumbers: ["a", "b"],
        }).keyNumbers
      ).toEqual(["a", "b"]);
    });
  });

  describe("participantReportStrengthWeaknessSchema", () => {
    it("should accept valid strength/weakness", () => {
      const valid = {
        title: "Maîtrise des QCM",
        evidence: "80% de réussite.",
        metric: "8/10",
      };
      expect(participantReportStrengthWeaknessSchema.parse(valid)).toEqual(valid);
    });

    it("should reject missing fields", () => {
      expect(() =>
        participantReportStrengthWeaknessSchema.parse({ title: "x" })
      ).toThrow();
      expect(() =>
        participantReportStrengthWeaknessSchema.parse({
          title: "x",
          evidence: "y",
        })
      ).toThrow();
    });
  });

  describe("participantReportRecurringMistakeSchema", () => {
    it("should accept valid recurring mistake", () => {
      const valid = {
        pattern: "Confusion A/B",
        whyLikely: "Concepts proches.",
        howToFix: "Revoir les définitions.",
      };
      expect(participantReportRecurringMistakeSchema.parse(valid)).toEqual(valid);
    });

    it("should reject missing fields", () => {
      expect(() =>
        participantReportRecurringMistakeSchema.parse({ pattern: "x" })
      ).toThrow();
    });
  });

  describe("participantReportQuestionToReviewSchema", () => {
    it("should accept valid question to review", () => {
      const valid = {
        question: "Quelle est la capitale ?",
        whyMissed: "Confusion avec une autre.",
        whatToRemember: "Paris pour la France.",
      };
      expect(participantReportQuestionToReviewSchema.parse(valid)).toEqual(valid);
    });

    it("should reject missing fields", () => {
      expect(() =>
        participantReportQuestionToReviewSchema.parse({ question: "x" })
      ).toThrow();
    });
  });

  describe("participantReportStudyDaySchema", () => {
    it("should accept valid study day", () => {
      const valid = {
        day: 1,
        focus: "Révision QCM",
        tasks: ["Faire 5 questions", "Relire le cours"],
      };
      expect(participantReportStudyDaySchema.parse(valid)).toEqual(valid);
    });

    it("should accept day 1 to 7", () => {
      for (let d = 1; d <= 7; d++) {
        expect(
          participantReportStudyDaySchema.parse({
            day: d,
            focus: "x",
            tasks: [],
          }).day
        ).toBe(d);
      }
    });

    it("should reject day outside 1-7", () => {
      expect(() =>
        participantReportStudyDaySchema.parse({
          day: 0,
          focus: "x",
          tasks: [],
        })
      ).toThrow();
      expect(() =>
        participantReportStudyDaySchema.parse({
          day: 8,
          focus: "x",
          tasks: [],
        })
      ).toThrow();
    });

    it("should require tasks to be array of strings", () => {
      expect(() =>
        participantReportStudyDaySchema.parse({
          day: 1,
          focus: "x",
          tasks: [1, 2],
        })
      ).toThrow();
    });
  });

  describe("participantReportOutputSchema", () => {
    const validReport = {
      summary: {
        overallLevel: "intermediate" as const,
        oneSentence: "Bon potentiel.",
        keyNumbers: ["5/10", "3 tentatives"],
      },
      strengths: [
        { title: "QCM", evidence: "80%", metric: "8/10" },
      ],
      weaknesses: [
        { title: "Vrai/Faux", evidence: "50%", metric: "5/10" },
      ],
      recurringMistakes: [
        {
          pattern: "Confusion A/B",
          whyLikely: "Concepts proches.",
          howToFix: "Revoir les définitions.",
        },
      ],
      mostImportantQuestionsToReview: [
        {
          question: "Capitale ?",
          whyMissed: "Confusion.",
          whatToRemember: "Paris.",
        },
      ],
      studyPlan7Days: [
        { day: 1, focus: "QCM", tasks: ["5 questions"] },
        { day: 2, focus: "Vrai/Faux", tasks: ["3 questions"] },
      ],
      tips: ["Réviser régulièrement."],
      warnings: ["Peu de tentatives."],
    };

    it("should accept valid full report", () => {
      const result = participantReportOutputSchema.parse(validReport);
      expect(result.summary.overallLevel).toBe("intermediate");
      expect(result.strengths).toHaveLength(1);
      expect(result.weaknesses).toHaveLength(1);
      expect(result.recurringMistakes).toHaveLength(1);
      expect(result.mostImportantQuestionsToReview).toHaveLength(1);
      expect(result.studyPlan7Days).toHaveLength(2);
      expect(result.tips).toEqual(["Réviser régulièrement."]);
      expect(result.warnings).toEqual(["Peu de tentatives."]);
    });

    it("should accept report with empty arrays", () => {
      const minimal = {
        ...validReport,
        strengths: [],
        weaknesses: [],
        recurringMistakes: [],
        mostImportantQuestionsToReview: [],
        studyPlan7Days: [],
        tips: [],
        warnings: [],
      };
      const result = participantReportOutputSchema.parse(minimal);
      expect(result.strengths).toEqual([]);
      expect(result.weaknesses).toEqual([]);
      expect(result.tips).toEqual([]);
      expect(result.warnings).toEqual([]);
    });

    it("should reject missing summary", () => {
      const { summary: _summary, ...rest } = validReport;
      expect(() => participantReportOutputSchema.parse(rest)).toThrow();
    });

    it("should reject missing strengths", () => {
      const { strengths: _strengths, ...rest } = validReport;
      expect(() => participantReportOutputSchema.parse(rest)).toThrow();
    });

    it("should reject invalid summary shape", () => {
      expect(() =>
        participantReportOutputSchema.parse({
          ...validReport,
          summary: { overallLevel: "intermediate", oneSentence: "x" },
        })
      ).toThrow();
    });
  });
});
