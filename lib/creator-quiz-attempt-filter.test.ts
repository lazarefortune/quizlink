import { describe, expect, it } from "vitest";
import { creatorCountedAttemptWhere } from "./creator-quiz-attempt-filter";

describe("creatorCountedAttemptWhere", () => {
  it("requires a non-null participantId for counted attempts", () => {
    expect(creatorCountedAttemptWhere).toEqual({
      participantId: { not: null },
    });
  });
});
