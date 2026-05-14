/**
 * Migration one-shot : déplace les images de questions encore en data URL base64
 * (Question.image) vers le stockage local (imageKey + fichier), puis vide Question.image.
 *
 * Usage:
 *   npx tsx scripts/migrate-question-images-to-storage.ts --dry-run
 *   npx tsx scripts/migrate-question-images-to-storage.ts --confirm
 */
import { pathToFileURL } from "node:url";

import {
  detectQuestionImageFormatFromMagicBytes,
  storageExtensionForDetectedFormat,
} from "../lib/builder/validateQuestionImageMagicBytes";
import { prisma } from "../lib/prisma";
import {
  buildQuestionImageStorageKey,
  saveQuestionImageBuffer,
} from "../lib/storage/question-image-storage";
import {
  computeLegacyQuestionImageDryRunMetrics,
  decodeImageBufferFromParsed,
  estimateDecodedByteLengthFromBase64Payload,
  parseDataUrlImage,
} from "./migrate-question-images-to-storage.helpers";

type QuestionRow = {
  id: string;
  image: string;
  imageKey: string | null;
  quizId: string;
  quiz: {
    name: string;
    ownerId: string | null;
    owner: { email: string } | null;
  };
};

type DryRunEntry = {
  questionId: string;
  quizId: string;
  quizTitle: string;
  ownerEmail: string;
  detectedMime: string;
  approxBytes: number;
};

function parseOptions(argv: string[]): { dryRun: boolean; confirm: boolean } {
  return {
    dryRun: argv.includes("--dry-run"),
    confirm: argv.includes("--confirm"),
  };
}

function formatBytes(n: number): string {
  if (n < 1024) {
    return `${n} o`;
  }
  if (n < 1024 * 1024) {
    return `${(n / 1024).toFixed(1)} Ko`;
  }
  return `${(n / (1024 * 1024)).toFixed(2)} Mo`;
}

async function fetchLegacyImageQuestions(): Promise<QuestionRow[]> {
  const rows = await prisma.question.findMany({
    where: {
      image: {
        startsWith: "data:image/",
      },
    },
    select: {
      id: true,
      image: true,
      imageKey: true,
      quizId: true,
      quiz: {
        select: {
          name: true,
          ownerId: true,
          owner: {
            select: {
              email: true,
            },
          },
        },
      },
    },
  });

  return rows.filter((row): row is QuestionRow => typeof row.image === "string");
}

function ownerEmailLabel(row: QuestionRow): string {
  if (row.quiz.owner?.email) {
    return row.quiz.owner.email;
  }
  return "(sans propriétaire)";
}

function buildDryRunEntry(
  row: QuestionRow,
  metrics: ReturnType<typeof computeLegacyQuestionImageDryRunMetrics>,
): DryRunEntry | null {
  if (!metrics.eligibleForMigrationPreview) {
    return null;
  }
  const parsed = parseDataUrlImage(row.image);
  if (!parsed.ok) {
    return null;
  }
  const approxBytes = estimateDecodedByteLengthFromBase64Payload(parsed.base64Payload);
  const detectedMime = metrics.detectedMime ?? "(inconnu)";
  return {
    questionId: row.id,
    quizId: row.quizId,
    quizTitle: row.quiz.name,
    ownerEmail: ownerEmailLabel(row),
    detectedMime,
    approxBytes,
  };
}

async function runDryRun(rows: QuestionRow[]): Promise<void> {
  let totalDataUrl = 0;
  let skippedImageKey = 0;
  let eligible = 0;
  let invalidNoImageKey = 0;
  let totalApproxBytes = 0;
  const quizIdsEligible = new Set<string>();
  const quizIdsWithDataUrl = new Set<string>();
  const dryRunEntries: DryRunEntry[] = [];

  for (const row of rows) {
    totalDataUrl += 1;
    quizIdsWithDataUrl.add(row.quizId);
    const metrics = computeLegacyQuestionImageDryRunMetrics({
      image: row.image,
      imageKey: row.imageKey,
    });
    if (metrics.wouldSkipDueToImageKey) {
      skippedImageKey += 1;
      continue;
    }
    if (metrics.eligibleForMigrationPreview) {
      eligible += 1;
      totalApproxBytes += metrics.approxDecodedBytes;
      quizIdsEligible.add(row.quizId);
      const entry = buildDryRunEntry(row, metrics);
      if (entry) {
        dryRunEntries.push(entry);
      }
    } else {
      invalidNoImageKey += 1;
    }
  }

  dryRunEntries.sort((a, b) => b.approxBytes - a.approxBytes);
  const topTen = dryRunEntries.slice(0, 10);

  console.log("=== Migration Question.image (data URL) -> imageKey + stockage ===");
  console.log("Mode: DRY RUN (aucune ecriture base, aucun fichier)");
  console.log(`Questions avec image commencant par data:image/: ${totalDataUrl}`);
  console.log(`Ignorees (deja imageKey, strategie skip): ${skippedImageKey}`);
  console.log(`Eligibles (sans imageKey, MIME declare + entete OK): ${eligible}`);
  console.log(`Non migrables sans imageKey (parse/MIME/entete): ${invalidNoImageKey}`);
  console.log(`Taille totale approximative (base64 decodee, eligibles): ${formatBytes(totalApproxBytes)}`);
  console.log(`Nombre de quiz distincts (au moins une question data URL): ${quizIdsWithDataUrl.size}`);
  console.log(`Nombre de quiz distincts (eligibles migration): ${quizIdsEligible.size}`);
  console.log("");
  console.log("Top 10 questions eligibles (par taille estimee decroissante):");
  if (topTen.length === 0) {
    console.log("(aucune ligne a afficher)");
  } else {
    topTen.forEach((e, index) => {
      console.log(
        `${index + 1}. questionId=${e.questionId} | quizId=${e.quizId} | quiz="${e.quizTitle}" | owner=${e.ownerEmail} | mime detecte=${e.detectedMime} | taille estimee=${formatBytes(e.approxBytes)}`,
      );
    });
  }
}

async function runConfirm(rows: QuestionRow[]): Promise<void> {
  let migrated = 0;
  let ignored = 0;
  let errors = 0;

  for (const row of rows) {
    if (row.imageKey && row.imageKey.trim().length > 0) {
      ignored += 1;
      continue;
    }

    if (!row.image.startsWith("data:image/")) {
      ignored += 1;
      continue;
    }

    const parsed = parseDataUrlImage(row.image);
    if (!parsed.ok) {
      console.error(`[erreur] question=${row.id} quiz=${row.quizId}: parse data URL: ${parsed.error}`);
      errors += 1;
      continue;
    }

    let buffer: Buffer;
    try {
      buffer = decodeImageBufferFromParsed(parsed);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[erreur] question=${row.id} quiz=${row.quizId}: decode base64: ${message}`);
      errors += 1;
      continue;
    }

    if (buffer.length === 0) {
      console.error(`[erreur] question=${row.id} quiz=${row.quizId}: image vide apres decode`);
      errors += 1;
      continue;
    }

    const format = detectQuestionImageFormatFromMagicBytes(buffer);
    if (!format) {
      console.error(
        `[erreur] question=${row.id} quiz=${row.quizId}: magic bytes non reconnus (PNG/JPEG/WebP requis)`,
      );
      errors += 1;
      continue;
    }

    const ownerId = row.quiz.ownerId;
    if (!ownerId) {
      console.error(
        `[erreur] question=${row.id} quiz=${row.quizId}: quiz sans ownerId, migration impossible`,
      );
      errors += 1;
      continue;
    }

    const extension = storageExtensionForDetectedFormat(format);
    const storageKey = buildQuestionImageStorageKey({
      userId: ownerId,
      quizId: row.quizId,
      extension,
    });

    try {
      await saveQuestionImageBuffer({ storageKey, buffer });
      await prisma.question.update({
        where: { id: row.id },
        data: {
          imageKey: storageKey,
          image: null,
        },
      });
      migrated += 1;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(
        `[erreur] question=${row.id} quiz=${row.quizId}: ecriture ou update Prisma: ${message}`,
      );
      errors += 1;
    }
  }

  console.log("");
  console.log("=== Resume migration ===");
  console.log(`Migrees: ${migrated}`);
  console.log(`Ignorees: ${ignored}`);
  console.log(`Erreurs: ${errors}`);
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const { dryRun, confirm } = parseOptions(argv);

  if (dryRun === confirm) {
    console.error(
      "Precisez exactement un mode: --dry-run (lecture seule) ou --confirm (ecriture base + stockage).",
    );
    process.exit(1);
  }

  const rows = await fetchLegacyImageQuestions();

  if (dryRun) {
    await runDryRun(rows);
    return;
  }

  console.log("=== Migration Question.image (data URL) -> imageKey + stockage ===");
  console.log("Mode: CONFIRM (ecriture active)");
  console.log(`Lignes candidates (data:image/): ${rows.length}`);
  await runConfirm(rows);
}

const isDirectExecution =
  typeof process.argv[1] === "string" &&
  pathToFileURL(process.argv[1]).href === import.meta.url;

if (isDirectExecution) {
  main()
    .catch((error) => {
      console.error("Erreur pendant la migration des images de questions:", error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
