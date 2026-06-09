export type CoinPackIconTier = "single" | "duo" | "stacks" | "stacksTall" | "pile";

export function resolveCoinPackIconTier(coins: number): CoinPackIconTier {
  const safeCoins = Math.max(0, Math.floor(coins));

  if (safeCoins < 80) return "single";
  if (safeCoins < 150) return "duo";
  if (safeCoins < 250) return "stacks";
  if (safeCoins < 500) return "stacksTall";

  return "pile";
}
