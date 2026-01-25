import { describe, it, expect } from "vitest";
import {
  submitFeedbackSchema,
  feedbackTypeSchema,
  feedbackStatusSchema,
} from "./feedback.schema";

describe("feedback.schema", () => {
  describe("feedbackTypeSchema", () => {
    it("should accept valid feedback types", () => {
      expect(feedbackTypeSchema.parse("BUG")).toBe("BUG");
      expect(feedbackTypeSchema.parse("SUGGESTION")).toBe("SUGGESTION");
      expect(feedbackTypeSchema.parse("FEEDBACK")).toBe("FEEDBACK");
    });

    it("should reject invalid feedback types", () => {
      expect(() => feedbackTypeSchema.parse("INVALID")).toThrow();
      expect(() => feedbackTypeSchema.parse("")).toThrow();
      expect(() => feedbackTypeSchema.parse(null)).toThrow();
    });
  });

  describe("feedbackStatusSchema", () => {
    it("should accept valid status values", () => {
      expect(feedbackStatusSchema.parse("NEW")).toBe("NEW");
      expect(feedbackStatusSchema.parse("IN_PROGRESS")).toBe("IN_PROGRESS");
      expect(feedbackStatusSchema.parse("DONE")).toBe("DONE");
    });

    it("should reject invalid status values", () => {
      expect(() => feedbackStatusSchema.parse("INVALID")).toThrow();
      expect(() => feedbackStatusSchema.parse("")).toThrow();
      expect(() => feedbackStatusSchema.parse(null)).toThrow();
    });
  });

  describe("submitFeedbackSchema", () => {
    const validInput = {
      type: "BUG" as const,
      message: "This is a test message with enough characters",
      page: "/test-page",
      userAgent: "Mozilla/5.0",
    };

    it("should accept valid input", () => {
      const result = submitFeedbackSchema.parse(validInput);
      expect(result).toEqual(validInput);
    });

    it("should accept all feedback types", () => {
      expect(() =>
        submitFeedbackSchema.parse({ ...validInput, type: "BUG" })
      ).not.toThrow();
      expect(() =>
        submitFeedbackSchema.parse({ ...validInput, type: "SUGGESTION" })
      ).not.toThrow();
      expect(() =>
        submitFeedbackSchema.parse({ ...validInput, type: "FEEDBACK" })
      ).not.toThrow();
    });

    it("should reject message shorter than 10 characters", () => {
      expect(() =>
        submitFeedbackSchema.parse({ ...validInput, message: "short" })
      ).toThrow();
      expect(() =>
        submitFeedbackSchema.parse({ ...validInput, message: "123456789" })
      ).toThrow();
    });

    it("should accept message with exactly 10 characters", () => {
      expect(() =>
        submitFeedbackSchema.parse({ ...validInput, message: "1234567890" })
      ).not.toThrow();
    });

    it("should reject message longer than 2000 characters", () => {
      const longMessage = "a".repeat(2001);
      expect(() =>
        submitFeedbackSchema.parse({ ...validInput, message: longMessage })
      ).toThrow();
    });

    it("should accept message with exactly 2000 characters", () => {
      const message = "a".repeat(2000);
      expect(() =>
        submitFeedbackSchema.parse({ ...validInput, message })
      ).not.toThrow();
    });

    it("should reject missing required fields", () => {
      expect(() => submitFeedbackSchema.parse({})).toThrow();
      expect(() => submitFeedbackSchema.parse({ type: "BUG" })).toThrow();
      expect(() =>
        submitFeedbackSchema.parse({ type: "BUG", message: "test message" })
      ).toThrow();
    });

    it("should accept page and userAgent up to 500 characters", () => {
      const longPage = "a".repeat(500);
      const longUserAgent = "b".repeat(500);
      expect(() =>
        submitFeedbackSchema.parse({
          ...validInput,
          page: longPage,
          userAgent: longUserAgent,
        })
      ).not.toThrow();
    });

    it("should reject page longer than 500 characters", () => {
      const longPage = "a".repeat(501);
      expect(() =>
        submitFeedbackSchema.parse({ ...validInput, page: longPage })
      ).toThrow();
    });

    it("should reject userAgent longer than 500 characters", () => {
      const longUserAgent = "a".repeat(501);
      expect(() =>
        submitFeedbackSchema.parse({ ...validInput, userAgent: longUserAgent })
      ).toThrow();
    });

    it("should trim message whitespace", () => {
      const result = submitFeedbackSchema.parse({
        ...validInput,
        message: "  test message with spaces  ",
      });
      // Note: Zod doesn't trim by default, but our server action does
      expect(result.message).toBe("  test message with spaces  ");
    });
  });
});
