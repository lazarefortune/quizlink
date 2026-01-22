/**
 * Seed script to initialize default coin packs
 * Run with: pnpm run seed:coin-packs
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding coin packs...");

  const defaultPacks = [
    {
      name: "STARTER",
      displayName: "Pack Starter",
      coins: 50,
      price: 500, // 5.00€ in cents
      stripePriceId: null, // Will be set manually after creating in Stripe
      isActive: true,
      isPopular: false,
      order: 0,
    },
    {
      name: "BOOST",
      displayName: "Pack Boost",
      coins: 120,
      price: 1000, // 10.00€ in cents
      stripePriceId: null,
      isActive: true,
      isPopular: true, // Mark BOOST as popular by default
      order: 1,
    },
    {
      name: "PRO",
      displayName: "Pack Pro",
      coins: 300,
      price: 2000, // 20.00€ in cents
      stripePriceId: null,
      isActive: true,
      isPopular: false,
      order: 2,
    },
  ];

  for (const pack of defaultPacks) {
    const existing = await prisma.coinPack.findUnique({
      where: { name: pack.name },
    });

    if (existing) {
      console.log(`⏭️  Pack ${pack.name} already exists, skipping...`);
    } else {
      await prisma.coinPack.create({
        data: pack,
      });
      console.log(`✅ Created pack ${pack.name}`);
    }
  }

  console.log("✨ Coin packs seeded successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding coin packs:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
