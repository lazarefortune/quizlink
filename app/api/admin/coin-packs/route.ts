/**
 * Admin API Routes for Coin Packs Management
 *
 * SECURITY: Only admins can access these routes
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/admin/coin-packs - Get all coin packs
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const packs = await prisma.coinPack.findMany({
      orderBy: { order: "asc" },
    });

    return NextResponse.json({
      packs: packs.map((pack) => ({
        id: pack.id,
        name: pack.name,
        displayName: pack.displayName,
        coins: pack.coins,
        price: pack.price / 100, // Convert cents to euros
        stripePriceId: pack.stripePriceId,
        isActive: pack.isActive,
        isPopular: pack.isPopular,
        order: pack.order,
        createdAt: pack.createdAt,
        updatedAt: pack.updatedAt,
      })),
    });
  } catch (error) {
    console.error("[Admin Coin Packs] GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch coin packs" },
      { status: 500 }
    );
  }
}

// POST /api/admin/coin-packs - Create a new coin pack
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, displayName, coins, price, stripePriceId, isPopular, order } = body;

    // Validation
    if (!name || !displayName || !coins || price === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: name, displayName, coins, price" },
        { status: 400 }
      );
    }

    if (coins <= 0 || price <= 0) {
      return NextResponse.json(
        { error: "Coins and price must be positive" },
        { status: 400 }
      );
    }

    // Check if name already exists
    const existing = await prisma.coinPack.findUnique({
      where: { name },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A pack with this name already exists" },
        { status: 400 }
      );
    }

    // Create pack (price stored in cents)
    const pack = await prisma.coinPack.create({
      data: {
        name,
        displayName,
        coins: parseInt(coins),
        price: Math.round(parseFloat(price) * 100), // Convert euros to cents
        stripePriceId: stripePriceId || null,
        isPopular: isPopular === true,
        order: order || 0,
        isActive: true,
      },
    });

    return NextResponse.json({
      pack: {
        id: pack.id,
        name: pack.name,
        displayName: pack.displayName,
        coins: pack.coins,
        price: pack.price / 100,
        stripePriceId: pack.stripePriceId,
        isActive: pack.isActive,
        isPopular: pack.isPopular,
        order: pack.order,
      },
    });
  } catch (error) {
    console.error("[Admin Coin Packs] POST error:", error);
    return NextResponse.json(
      { error: "Failed to create coin pack" },
      { status: 500 }
    );
  }
}
