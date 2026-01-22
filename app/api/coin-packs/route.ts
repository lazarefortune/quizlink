/**
 * Public API Route to get active coin packs
 * Used by the pricing page to display available packs
 */

import { NextResponse } from "next/server";
import { getActiveCoinPacks } from "@/lib/stripe/coin-packs";

export async function GET() {
  try {
    const packs = await getActiveCoinPacks();

    return NextResponse.json({ packs });
  } catch (error) {
    console.error("[Coin Packs API] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch coin packs" },
      { status: 500 }
    );
  }
}
