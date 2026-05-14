import { describe, expect, it } from "vitest";
import { resolveEffectiveShuffleSettings } from "./shuffleSettings";

describe("resolveEffectiveShuffleSettings", () => {
  it("defaults randomizeOptions to randomizeQuestions when randomizeOptions is absent", () => {
    expect(
      resolveEffectiveShuffleSettings({
        randomizeQuestions: true,
      }),
    ).toEqual({ randomizeQuestions: true, randomizeOptions: true });

    expect(
      resolveEffectiveShuffleSettings({
        randomizeQuestions: false,
      }),
    ).toEqual({ randomizeQuestions: false, randomizeOptions: false });
  });

  it("uses explicit randomizeOptions when present", () => {
    expect(
      resolveEffectiveShuffleSettings({
        randomizeQuestions: true,
        randomizeOptions: false,
      }),
    ).toEqual({ randomizeQuestions: true, randomizeOptions: false });

    expect(
      resolveEffectiveShuffleSettings({
        randomizeQuestions: false,
        randomizeOptions: true,
      }),
    ).toEqual({ randomizeQuestions: false, randomizeOptions: true });
  });
});
