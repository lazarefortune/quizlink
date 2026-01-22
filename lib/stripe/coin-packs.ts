/**
 * Centralized coin pack configuration
 *
 * SECURITY: Pack prices and coin amounts are defined server-side only.
 * Never trust frontend values for pricing or coin amounts.
 *
 * Packs are now stored in the database and can be managed by admins.
 */

import { prisma } from "@/lib/prisma";

export type CoinPackId = string; // Now dynamic from database

export type CoinPack = {
  id: string; // Database ID
  name: string; // e.g., "STARTER", "BOOST", "PRO"
  displayName: string;
  coins: number;
  price: number; // Price in euros (converted from cents)
  stripePriceId: string | null;
  isActive: boolean;
  isPopular: boolean;
  order: number;
};

/**
 * Get all active coin packs from database
 * @returns Array of active coin packs ordered by display order
 */
export async function getActiveCoinPacks(): Promise<CoinPack[]> {
  if (!prisma) {
    console.error("[getActiveCoinPacks] Database not initialized");
    return [];
  }

  try {
    const packs = await prisma.coinPack.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
    });

    return packs.map((pack) => ({
      id: pack.id,
      name: pack.name,
      displayName: pack.displayName,
      coins: pack.coins,
      price: pack.price / 100, // Convert cents to euros
      stripePriceId: pack.stripePriceId,
      isActive: pack.isActive,
      isPopular: pack.isPopular,
      order: pack.order,
    }));
  } catch (error) {
    console.error("[getActiveCoinPacks] Error fetching packs:", error);
    return [];
  }
}

/**
 * Get coin pack by ID (database ID)
 * @param packId - Pack database ID
 * @returns Coin pack configuration or null if not found
 */
export async function getCoinPack(packId: string): Promise<CoinPack | null> {
  if (!prisma) {
    console.error("[getCoinPack] Database not initialized");
    return null;
  }

  try {
    const pack = await prisma.coinPack.findUnique({
      where: { id: packId },
    });

    if (!pack || !pack.isActive) {
      return null;
    }

    return {
      id: pack.id,
      name: pack.name,
      displayName: pack.displayName,
      coins: pack.coins,
      price: pack.price / 100, // Convert cents to euros
      stripePriceId: pack.stripePriceId,
      isActive: pack.isActive,
      isPopular: pack.isPopular,
      order: pack.order,
    };
  } catch (error) {
    console.error("[getCoinPack] Error fetching pack:", error);
    return null;
  }
}

/**
 * Get coin pack by name (e.g., "STARTER", "BOOST", "PRO")
 * @param packName - Pack name
 * @returns Coin pack configuration or null if not found
 */
export async function getCoinPackByName(packName: string): Promise<CoinPack | null> {
  if (!prisma) {
    console.error("[getCoinPackByName] Database not initialized");
    return null;
  }

  try {
    const pack = await prisma.coinPack.findUnique({
      where: { name: packName },
    });

    if (!pack || !pack.isActive) {
      return null;
    }

    return {
      id: pack.id,
      name: pack.name,
      displayName: pack.displayName,
      coins: pack.coins,
      price: pack.price / 100, // Convert cents to euros
      stripePriceId: pack.stripePriceId,
      isActive: pack.isActive,
      isPopular: pack.isPopular,
      order: pack.order,
    };
  } catch (error) {
    console.error("[getCoinPackByName] Error fetching pack:", error);
    return null;
  }
}

/**
 * Validate pack ID
 * @param packId - Pack ID to validate
 * @returns True if pack ID is valid and pack is active
 */
export async function isValidPackId(packId: string): Promise<boolean> {
  if (!prisma) {
    return false;
  }

  try {
    const pack = await prisma.coinPack.findUnique({
      where: { id: packId },
      select: { isActive: true },
    });

    return pack?.isActive === true;
  } catch (error) {
    console.error("[isValidPackId] Error validating pack:", error);
    return false;
  }
}
