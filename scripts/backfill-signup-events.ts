/**
 * Backfill lifecycle signup events for users created before tracking existed.
 * Usage: pnpm run backfill:signup-events
 */

import { prisma } from "../lib/prisma";
import { backfillMissingSignupEvents } from "../lib/userLifecycleEvents";

async function backfillSignupEvents(): Promise<void> {
  if (!prisma) {
    console.error("❌ Prisma client not initialized");
    process.exit(1);
  }

  const insertedRows = await backfillMissingSignupEvents(prisma);
  console.log(`✅ Backfill completed. Inserted ${insertedRows} signup event(s).`);
}

backfillSignupEvents()
  .catch((error) => {
    console.error("❌ Error while backfilling signup events:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
