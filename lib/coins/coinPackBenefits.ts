import { QUIZ_UNLOCK_COIN_COST } from "@/lib/quiz/quizUnlockConstants";

export const COINS_PER_AI_GENERATION = 2;

export type CoinPackBenefitCounts = {
  aiGenerations: number;
  quizUnlocks: number;
};

export function resolveCoinPackBenefitCounts(coins: number): CoinPackBenefitCounts {
  const safeCoins = Math.max(0, Math.floor(coins));

  return {
    aiGenerations: Math.floor(safeCoins / COINS_PER_AI_GENERATION),
    quizUnlocks: Math.floor(safeCoins / QUIZ_UNLOCK_COIN_COST),
  };
}
