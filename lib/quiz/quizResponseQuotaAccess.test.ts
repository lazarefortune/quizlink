import { describe, expect, it } from "vitest";

import {
  canAcceptQuizResponses,
  canViewAdvancedQuizStats,
  canViewAllQuizDetails,
  resolveQuizResponseQuotaState,
} from "./quizResponseQuotaAccess";
import { FREE_QUIZ_RESPONSE_LIMIT } from "./quizUnlockConstants";

const baseFree = {
  isProActive: false,
  isQuizUnlockedWithCoins: false,
};

describe("resolveQuizResponseQuotaState", () => {
  it("returns full remaining quota at 0 completed responses", () => {
    const state = resolveQuizResponseQuotaState({
      ...baseFree,
      completedResponses: 0,
    });

    expect(state.freeLimit).toBe(FREE_QUIZ_RESPONSE_LIMIT);
    expect(state.completedResponses).toBe(0);
    expect(state.remainingFreeResponses).toBe(20);
    expect(state.hasReachedFreeLimit).toBe(false);
    expect(state.canAcceptResponses).toBe(true);
    expect(state.isUnlocked).toBe(false);
    expect(state.canViewAllDetails).toBe(false);
    expect(state.canViewAdvancedStats).toBe(false);
  });

  it("allows one more response at 19 completed", () => {
    const state = resolveQuizResponseQuotaState({
      ...baseFree,
      completedResponses: 19,
    });

    expect(state.remainingFreeResponses).toBe(1);
    expect(state.hasReachedFreeLimit).toBe(false);
    expect(state.canAcceptResponses).toBe(true);
  });

  it("blocks new responses at 20 completed", () => {
    const state = resolveQuizResponseQuotaState({
      ...baseFree,
      completedResponses: 20,
    });

    expect(state.remainingFreeResponses).toBe(0);
    expect(state.hasReachedFreeLimit).toBe(true);
    expect(state.canAcceptResponses).toBe(false);
    expect(state.canViewAllDetails).toBe(false);
    expect(state.canViewAdvancedStats).toBe(false);
  });

  it("blocks new responses above the free limit", () => {
    const state = resolveQuizResponseQuotaState({
      ...baseFree,
      completedResponses: 25,
    });

    expect(state.remainingFreeResponses).toBe(0);
    expect(state.hasReachedFreeLimit).toBe(true);
    expect(state.canAcceptResponses).toBe(false);
  });

  it("allows responses when coin-unlocked despite limit reached", () => {
    const state = resolveQuizResponseQuotaState({
      completedResponses: 20,
      isProActive: false,
      isQuizUnlockedWithCoins: true,
    });

    expect(state.isUnlocked).toBe(true);
    expect(state.canAcceptResponses).toBe(true);
    expect(state.canViewAllDetails).toBe(true);
    expect(state.canViewAdvancedStats).toBe(true);
  });

  it("allows responses when Pro is active despite limit reached", () => {
    const state = resolveQuizResponseQuotaState({
      completedResponses: 20,
      isProActive: true,
      isQuizUnlockedWithCoins: false,
    });

    expect(state.isUnlocked).toBe(true);
    expect(state.canAcceptResponses).toBe(true);
    expect(state.canViewAllDetails).toBe(true);
    expect(state.canViewAdvancedStats).toBe(true);
  });

  it("clamps negative completed counts to zero", () => {
    const state = resolveQuizResponseQuotaState({
      ...baseFree,
      completedResponses: -3,
    });

    expect(state.completedResponses).toBe(0);
    expect(state.remainingFreeResponses).toBe(20);
  });
});

describe("quota helper shortcuts", () => {
  it("canAcceptQuizResponses mirrors state", () => {
    expect(
      canAcceptQuizResponses({ ...baseFree, completedResponses: 20 }),
    ).toBe(false);
    expect(
      canAcceptQuizResponses({
        completedResponses: 20,
        isProActive: true,
        isQuizUnlockedWithCoins: false,
      }),
    ).toBe(true);
  });

  it("canViewAllQuizDetails is false for free and true when unlocked", () => {
    expect(
      canViewAllQuizDetails({ ...baseFree, completedResponses: 5 }),
    ).toBe(false);
    expect(
      canViewAllQuizDetails({
        completedResponses: 5,
        isProActive: false,
        isQuizUnlockedWithCoins: true,
      }),
    ).toBe(true);
  });

  it("canViewAdvancedQuizStats is false for free and true when unlocked", () => {
    expect(
      canViewAdvancedQuizStats({ ...baseFree, completedResponses: 5 }),
    ).toBe(false);
    expect(
      canViewAdvancedQuizStats({
        completedResponses: 5,
        isProActive: true,
        isQuizUnlockedWithCoins: false,
      }),
    ).toBe(true);
  });
});
