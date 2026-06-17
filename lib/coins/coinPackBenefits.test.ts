import { describe, expect, it } from "vitest";

import {
  COINS_PER_AI_GENERATION,
  resolveCoinPackBenefitCounts,
} from "./coinPackBenefits";
import { QUIZ_UNLOCK_COIN_COST } from "@/lib/quiz/quizUnlockConstants";

describe("resolveCoinPackBenefitCounts", () => {
  it("returns zero benefits for zero or negative coins", () => {
    expect(resolveCoinPackBenefitCounts(0)).toEqual({
      aiGenerations: 0,
      quizUnlocks: 0,
    });
    expect(resolveCoinPackBenefitCounts(-10)).toEqual({
      aiGenerations: 0,
      quizUnlocks: 0,
    });
  });

  it("computes AI generations from the real per-generation cost", () => {
    expect(resolveCoinPackBenefitCounts(4).aiGenerations).toBe(2);
    expect(resolveCoinPackBenefitCounts(5).aiGenerations).toBe(2);
    expect(resolveCoinPackBenefitCounts(COINS_PER_AI_GENERATION).aiGenerations).toBe(1);
  });

  it("computes quiz unlocks from the real unlock cost", () => {
    expect(resolveCoinPackBenefitCounts(QUIZ_UNLOCK_COIN_COST).quizUnlocks).toBe(1);
    expect(resolveCoinPackBenefitCounts(QUIZ_UNLOCK_COIN_COST + 10).quizUnlocks).toBe(1);
    expect(resolveCoinPackBenefitCounts(QUIZ_UNLOCK_COIN_COST * 3).quizUnlocks).toBe(3);
  });
});
