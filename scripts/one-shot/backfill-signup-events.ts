/**
 * [ONE-SHOT — backfill] Insère les événements lifecycle `SIGNUP` manquants pour les comptes
 * créés avant le suivi des événements.
 *
 * Objectif : aligner l’historique admin / analytics via `backfillMissingSignupEvents`.
 *
 * Exécution prod : typiquement une fois après mise en prod du tracking (date non consignée ici).
 *
 * Emplacement : `scripts/one-shot/`. Préférer `pnpm run backfill:signup-events`.
 */

import { prisma } from "../../lib/prisma";
import { backfillMissingSignupEvents } from "../../lib/userLifecycleEvents";

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
