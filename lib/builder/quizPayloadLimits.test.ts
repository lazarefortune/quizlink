import { describe, expect, it } from "vitest";
import {
  isQuestionImageFileOverMaxSize,
  MAX_QUESTION_IMAGE_FILE_BYTES,
  QUIZ_SAVE_PAYLOAD_WARN_BYTES,
  QUIZ_SAVE_SERVER_ACTION_BODY_LIMIT_BYTES,
  QUIZ_SAVE_SERVER_ACTION_BODY_SIZE_LIMIT,
} from "./quizPayloadLimits";

describe("quizPayloadLimits", () => {
  it("exposes a 10mb string aligned with Next serverActions.bodySizeLimit", () => {
    expect(QUIZ_SAVE_SERVER_ACTION_BODY_SIZE_LIMIT).toBe("10mb");
    expect(QUIZ_SAVE_SERVER_ACTION_BODY_LIMIT_BYTES).toBe(10 * 1024 * 1024);
  });

  it("warn threshold is 8 MiB", () => {
    expect(QUIZ_SAVE_PAYLOAD_WARN_BYTES).toBe(8 * 1024 * 1024);
  });

  describe("isQuestionImageFileOverMaxSize", () => {
    it("returns false at exactly the max file size", () => {
      const file = new File(
        [new Uint8Array(MAX_QUESTION_IMAGE_FILE_BYTES)],
        "q.png",
        { type: "image/png" },
      );
      expect(isQuestionImageFileOverMaxSize(file)).toBe(false);
    });

    it("returns true when file is one byte over the max", () => {
      const file = new File(
        [new Uint8Array(MAX_QUESTION_IMAGE_FILE_BYTES + 1)],
        "q.png",
        { type: "image/png" },
      );
      expect(isQuestionImageFileOverMaxSize(file)).toBe(true);
    });

    it("returns false for an empty file", () => {
      const file = new File([], "q.png", { type: "image/png" });
      expect(isQuestionImageFileOverMaxSize(file)).toBe(false);
    });
  });
});
