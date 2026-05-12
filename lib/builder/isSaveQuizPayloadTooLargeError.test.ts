import { describe, expect, it } from "vitest";
import { isSaveQuizPayloadTooLargeError } from "./isSaveQuizPayloadTooLargeError";

describe("isSaveQuizPayloadTooLargeError", () => {
  it("returns true for Next.js body exceeded message", () => {
    expect(
      isSaveQuizPayloadTooLargeError(
        new Error("Body exceeded 2mb limit"),
      ),
    ).toBe(true);
  });

  it("returns true for 413-style messages", () => {
    expect(isSaveQuizPayloadTooLargeError(new Error("status code 413"))).toBe(
      true,
    );
    expect(
      isSaveQuizPayloadTooLargeError(new Error("Request Entity Too Large")),
    ).toBe(true);
  });

  it("returns true for object-shaped errors with a message field", () => {
    expect(
      isSaveQuizPayloadTooLargeError({
        message: "Payload Too Large",
      }),
    ).toBe(true);
  });

  it("returns false for unrelated errors", () => {
    expect(isSaveQuizPayloadTooLargeError(new Error("Network error"))).toBe(
      false,
    );
    expect(isSaveQuizPayloadTooLargeError(null)).toBe(false);
    expect(isSaveQuizPayloadTooLargeError("string")).toBe(false);
  });
});
