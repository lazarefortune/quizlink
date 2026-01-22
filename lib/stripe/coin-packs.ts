/**
 * Centralized coin pack configuration
 *
 * SECURITY: Pack prices and coin amounts are defined server-side only.
 * Never trust frontend values for pricing or coin amounts.
 */

export type CoinPackId = "STARTER" | "BOOST" | "PRO";

export type CoinPack = {
  id: CoinPackId;
  coins: number;
  price: number; // Price in euros
  nameKey: string;
};

export const COIN_PACKS: Record<CoinPackId, CoinPack> = {
  STARTER: {
    id: "STARTER",
    coins: 50,
    price: 5,
    nameKey: "pricing.starter.name",
  },
  BOOST: {
    id: "BOOST",
    coins: 120,
    price: 10,
    nameKey: "pricing.boost.name",
  },
  PRO: {
    id: "PRO",
    coins: 300,
    price: 20,
    nameKey: "pricing.pro.name",
  },
} as const;

/**
 * Get coin pack by ID
 * @param packId - Pack ID (STARTER, BOOST, PRO)
 * @returns Coin pack configuration or null if not found
 */
export function getCoinPack(packId: string): CoinPack | null {
  if (packId in COIN_PACKS) {
    return COIN_PACKS[packId as CoinPackId];
  }
  return null;
}

/**
 * Validate pack ID
 * @param packId - Pack ID to validate
 * @returns True if pack ID is valid
 */
export function isValidPackId(packId: string): packId is CoinPackId {
  return packId in COIN_PACKS;
}
