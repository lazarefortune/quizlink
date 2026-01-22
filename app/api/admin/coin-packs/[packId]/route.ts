/**
 * Admin API Routes for Individual Coin Pack Management
 *
 * SECURITY: Only admins can access these routes
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/admin/coin-packs/[packId] - Get a specific coin pack
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ packId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { packId } = await params;
    const pack = await prisma.coinPack.findUnique({
      where: { id: packId },
    });

    if (!pack) {
      return NextResponse.json({ error: "Pack not found" }, { status: 404 });
    }

    return NextResponse.json({
      pack: {
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
      },
    });
  } catch (error) {
    console.error("[Admin Coin Packs] GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch coin pack" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/coin-packs/[packId] - Update a coin pack
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ packId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { packId } = await params;
    const body = await request.json();
    const { name, displayName, coins, price, stripePriceId, isActive, isPopular, order } = body;

    // Check if pack exists
    const existing = await prisma.coinPack.findUnique({
      where: { id: packId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Pack not found" }, { status: 404 });
    }

    // If name is being changed, check for conflicts
    if (name && name !== existing.name) {
      const nameConflict = await prisma.coinPack.findUnique({
        where: { name },
      });

      if (nameConflict) {
        return NextResponse.json(
          { error: "A pack with this name already exists" },
          { status: 400 }
        );
      }
    }

    // Build update data
    const updateData: {
      name?: string;
      displayName?: string;
      coins?: number;
      price?: number;
      stripePriceId?: string | null;
      isActive?: boolean;
      isPopular?: boolean;
      order?: number;
    } = {};

    if (name !== undefined) updateData.name = name;
    if (displayName !== undefined) updateData.displayName = displayName;
    if (coins !== undefined) updateData.coins = parseInt(coins);
    if (price !== undefined) updateData.price = Math.round(parseFloat(price) * 100);
    if (stripePriceId !== undefined) updateData.stripePriceId = stripePriceId || null;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (isPopular !== undefined) updateData.isPopular = isPopular === true;
    if (order !== undefined) updateData.order = order;

    const pack = await prisma.coinPack.update({
      where: { id: packId },
      data: updateData,
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
        order: pack.order,
      },
    });
  } catch (error) {
    console.error("[Admin Coin Packs] PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to update coin pack" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/coin-packs/[packId] - Delete a coin pack
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ packId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { packId } = await params;

    // Check if pack exists
    const existing = await prisma.coinPack.findUnique({
      where: { id: packId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Pack not found" }, { status: 404 });
    }

    // Delete pack
    await prisma.coinPack.delete({
      where: { id: packId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Admin Coin Packs] DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete coin pack" },
      { status: 500 }
    );
  }
}
