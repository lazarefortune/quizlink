import { describe, expect, it } from "vitest";
import { getQuestionImageSrc, hasQuestionImage } from "./question-image-src";

describe("getQuestionImageSrc", () => {
  it("prefers imageKey over legacy image", () => {
    expect(
      getQuestionImageSrc({
        imageKey: "u/q/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.webp",
        image: "data:image/png;base64,xxx",
      }),
    ).toBe(
      "/api/question-images/u/q/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.webp",
    );
  });

  it("encodes path segments", () => {
    expect(
      getQuestionImageSrc({
        imageKey: "user_a/quiz_b/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.png",
        image: null,
      }),
    ).toBe(
      "/api/question-images/user_a/quiz_b/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.png",
    );
  });

  it("falls back to legacy image when no imageKey", () => {
    expect(getQuestionImageSrc({ image: "data:image/jpeg;base64,abcd" })).toBe(
      "data:image/jpeg;base64,abcd",
    );
  });

  it("returns null when neither is set", () => {
    expect(getQuestionImageSrc({})).toBeNull();
    expect(getQuestionImageSrc({ image: "  ", imageKey: "" })).toBeNull();
  });
});

describe("hasQuestionImage", () => {
  it("detects imageKey", () => {
    expect(
      hasQuestionImage({
        imageKey: "a/b/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.webp",
      }),
    ).toBe(true);
  });
});
