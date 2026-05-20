import { describe, it, expect } from "vitest";
import {
  submitFeedbackSchema,
  submitQuizCreationReviewSchema,
  submitUserFeedbackSchema,
  feedbackTypeSchema,
  feedbackStatusSchema,
} from "./feedback.schema";

const baseContext = {
  page: "/dashboard",
  userAgent: "Mozilla/5.0",
};

describe("feedback.schema", () => {
  describe("feedbackTypeSchema", () => {
    it("should accept legacy and new feedback types", () => {
      expect(feedbackTypeSchema.parse("BUG")).toBe("BUG");
      expect(feedbackTypeSchema.parse("SUGGESTION")).toBe("SUGGESTION");
      expect(feedbackTypeSchema.parse("FEEDBACK")).toBe("FEEDBACK");
      expect(feedbackTypeSchema.parse("APP_REVIEW")).toBe("APP_REVIEW");
      expect(feedbackTypeSchema.parse("FEATURE_REQUEST")).toBe("FEATURE_REQUEST");
      expect(feedbackTypeSchema.parse("QUIZ_CREATION_REVIEW")).toBe(
        "QUIZ_CREATION_REVIEW",
      );
      expect(feedbackTypeSchema.parse("SAVE_ERROR_REPORT")).toBe("SAVE_ERROR_REPORT");
      expect(feedbackTypeSchema.parse("SUPPORT_MESSAGE")).toBe("SUPPORT_MESSAGE");
    });

    it("should reject invalid feedback types", () => {
      expect(() => feedbackTypeSchema.parse("INVALID")).toThrow();
    });
  });

  describe("feedbackStatusSchema", () => {
    it("should accept valid status values", () => {
      expect(feedbackStatusSchema.parse("NEW")).toBe("NEW");
      expect(feedbackStatusSchema.parse("IN_PROGRESS")).toBe("IN_PROGRESS");
      expect(feedbackStatusSchema.parse("DONE")).toBe("DONE");
    });
  });

  describe("submitUserFeedbackSchema", () => {
    it("should accept APP_REVIEW with rating only", () => {
      const result = submitUserFeedbackSchema.parse({
        rating: 4,
        ...baseContext,
      });
      expect(result.rating).toBe(4);
      expect(result.message).toBeUndefined();
      expect(result.featureRequest).toBeUndefined();
    });

    it("should accept APP_REVIEW with rating and featureRequest", () => {
      const result = submitUserFeedbackSchema.parse({
        rating: 5,
        featureRequest: "Export PDF des résultats",
        ...baseContext,
      });
      expect(result.featureRequest).toBe("Export PDF des résultats");
    });

    it("should reject APP_REVIEW without rating", () => {
      expect(() =>
        submitUserFeedbackSchema.parse({
          ...baseContext,
        }),
      ).toThrow();
    });

    it("should reject rating outside 1-5", () => {
      expect(() =>
        submitUserFeedbackSchema.parse({
          rating: 6,
          ...baseContext,
        }),
      ).toThrow();
    });
  });

  describe("submitQuizCreationReviewSchema", () => {
    it("should accept QUIZ_CREATION_REVIEW input with rating and quizId", () => {
      const result = submitQuizCreationReviewSchema.parse({
        rating: 4,
        quizId: "quiz_abc123",
        ...baseContext,
      });
      expect(result.rating).toBe(4);
      expect(result.quizId).toBe("quiz_abc123");
    });

    it("should accept optional message", () => {
      const result = submitQuizCreationReviewSchema.parse({
        rating: 5,
        message: "Très fluide",
        quizId: "quiz_abc123",
        ...baseContext,
      });
      expect(result.message).toBe("Très fluide");
    });

    it("should reject without rating", () => {
      expect(() =>
        submitQuizCreationReviewSchema.parse({
          quizId: "quiz_abc123",
          ...baseContext,
        }),
      ).toThrow();
    });

    it("should reject without quizId", () => {
      expect(() =>
        submitQuizCreationReviewSchema.parse({
          rating: 3,
          ...baseContext,
        }),
      ).toThrow();
    });
  });

  describe("submitFeedbackSchema", () => {
    it("should accept APP_REVIEW with rating only", () => {
      const result = submitFeedbackSchema.parse({
        type: "APP_REVIEW",
        rating: 3,
        ...baseContext,
      });
      expect(result.type).toBe("APP_REVIEW");
      expect(result.rating).toBe(3);
      expect(result.message).toBeUndefined();
    });

    it("should reject APP_REVIEW without rating", () => {
      expect(() =>
        submitFeedbackSchema.parse({
          type: "APP_REVIEW",
          ...baseContext,
        }),
      ).toThrow();
    });

    it("should reject FEATURE_REQUEST without featureRequest", () => {
      expect(() =>
        submitFeedbackSchema.parse({
          type: "FEATURE_REQUEST",
          ...baseContext,
        }),
      ).toThrow();
    });

    it("should accept FEATURE_REQUEST with featureRequest", () => {
      const result = submitFeedbackSchema.parse({
        type: "FEATURE_REQUEST",
        featureRequest: "Mode sombre dans le builder",
        ...baseContext,
      });
      expect(result.featureRequest).toBe("Mode sombre dans le builder");
    });

    it("should accept legacy BUG with message", () => {
      const result = submitFeedbackSchema.parse({
        type: "BUG",
        message: "Something is broken here",
        ...baseContext,
      });
      expect(result.message).toBe("Something is broken here");
    });

    it("should accept legacy FEEDBACK with message", () => {
      expect(() =>
        submitFeedbackSchema.parse({
          type: "FEEDBACK",
          message: "General feedback note",
          ...baseContext,
        }),
      ).not.toThrow();
    });

    it("should accept SUPPORT_MESSAGE with message", () => {
      const result = submitFeedbackSchema.parse({
        type: "SUPPORT_MESSAGE",
        message: "How do I share my quiz?",
        ...baseContext,
      });
      expect(result.message).toBe("How do I share my quiz?");
    });

    it("should accept SAVE_ERROR_REPORT with metadata only", () => {
      const result = submitFeedbackSchema.parse({
        type: "SAVE_ERROR_REPORT",
        metadata: { errorCode: "PAYLOAD_TOO_LARGE" },
        ...baseContext,
      });
      expect(result.metadata).toEqual({ errorCode: "PAYLOAD_TOO_LARGE" });
    });

    it("should reject rating outside 1-5", () => {
      expect(() =>
        submitFeedbackSchema.parse({
          type: "APP_REVIEW",
          rating: 0,
          ...baseContext,
        }),
      ).toThrow();
    });

    it("should reject message longer than 1500 characters", () => {
      expect(() =>
        submitFeedbackSchema.parse({
          type: "BUG",
          message: "a".repeat(1501),
          ...baseContext,
        }),
      ).toThrow();
    });

    it("should reject metadata with forbidden keys", () => {
      expect(() =>
        submitFeedbackSchema.parse({
          type: "SAVE_ERROR_REPORT",
          metadata: { sessionToken: "secret" },
          ...baseContext,
        }),
      ).toThrow();
    });
  });
});
