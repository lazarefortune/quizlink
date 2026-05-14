/**
 * Audit lecture seule : coherence entre Question.imageKey (DB) et fichiers sous
 * QUESTION_IMAGE_UPLOAD_DIR (ou repertoire local par defaut).
 *
 * Usage:
 *   npx tsx scripts/audit-question-images-storage.ts --dry-run
 *
 * L'option --confirm-delete-orphans est reconnue mais reste desactivee (aucune suppression).
 */
import { pathToFileURL } from "node:url";
import { constants as fsConstants } from "fs";
import { access, readdir, stat } from "fs/promises";
import path from "path";

import { prisma } from "../lib/prisma";
import {
  getQuestionImageLocalBaseDir,
  getQuestionImageStorageMode,
  isSafeQuestionImageStorageKey,
} from "../lib/storage/question-image-storage";
import {
  buildReferencedKeySet,
  normalizeStorageKeyForCompare,
  partitionDiskKeysByReference,
  relativeImageKeyFromAbsoluteFilePath,
} from "./audit-question-images-storage.helpers";

type QuestionAuditRow = {
  id: string;
  imageKey: string;
  quizId: string;
  quiz: {
    name: string;
    ownerId: string | null;
    owner: { email: string } | null;
  };
};

type KeyIssueRow = {
  questionId: string;
  quizId: string;
  quizTitle: string;
  ownerEmail: string;
  imageKey: string;
  reason: "unsafe_key" | "missing_file";
};

function parseOptions(argv: string[]): {
  dryRun: boolean;
  confirmDeleteOrphansRequested: boolean;
} {
  return {
    dryRun: argv.includes("--dry-run"),
    confirmDeleteOrphansRequested: argv.includes("--confirm-delete-orphans"),
  };
}

function ownerEmailLabel(row: QuestionAuditRow): string {
  if (row.quiz.owner?.email) {
    return row.quiz.owner.email;
  }
  return "(sans propriétaire)";
}

function resolveLocalFilePathForAudit(storageRoot: string, storageKey: string): string {
  return path.join(storageRoot, ...storageKey.split("/"));
}

async function pathExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function walkQuestionImageFiles(rootDir: string): Promise<string[]> {
  const results: string[] = [];

  async function walk(current: string): Promise<void> {
    let entries;
    try {
      entries = await readdir(current, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        await walk(full);
      } else if (entry.isFile()) {
        results.push(full);
      }
    }
  }

  await walk(rootDir);
  return results;
}

async function fetchQuestionsWithImageKey(): Promise<QuestionAuditRow[]> {
  const rows = await prisma.question.findMany({
    where: {
      imageKey: {
        not: null,
      },
    },
    select: {
      id: true,
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

  return rows.filter(
    (row): row is QuestionAuditRow =>
      typeof row.imageKey === "string" && row.imageKey.trim().length > 0,
  );
}

async function main(): Promise<void> {
  const { dryRun, confirmDeleteOrphansRequested } = parseOptions(process.argv.slice(2));

  if (!dryRun) {
    console.error(
      "Utilisez --dry-run pour lancer l'audit (lecture seule, aucune modification).",
    );
    process.exit(1);
  }

  if (confirmDeleteOrphansRequested) {
    console.log(
      "Note: --confirm-delete-orphans est desactivee dans cette version (aucune suppression).",
    );
    console.log("");
  }

  const storageMode = getQuestionImageStorageMode();
  const baseDir = getQuestionImageLocalBaseDir();

  console.log("=== Audit stockage images de questions ===");
  console.log(`Mode stockage declare: ${storageMode}`);
  console.log(`Repertoire scanne: ${baseDir}`);
  if (storageMode !== "local") {
    console.log(
      "Note: en mode non-local, la presence des fichiers est verifiee sur le chemin ci-dessus (filesystem local).",
    );
  }
  console.log("");

  const questions = await fetchQuestionsWithImageKey();
  const distinctKeys = buildReferencedKeySet(questions.map((q) => q.imageKey));

  const baseStat = await stat(baseDir).catch(() => null);
  const storageDirReady = Boolean(baseStat?.isDirectory());

  const issues: KeyIssueRow[] = [];

  for (const row of questions) {
    const key = normalizeStorageKeyForCompare(row.imageKey);
    if (!isSafeQuestionImageStorageKey(key)) {
      issues.push({
        questionId: row.id,
        quizId: row.quizId,
        quizTitle: row.quiz.name,
        ownerEmail: ownerEmailLabel(row),
        imageKey: row.imageKey,
        reason: "unsafe_key",
      });
      continue;
    }

    if (!storageDirReady) {
      continue;
    }

    const filePath = resolveLocalFilePathForAudit(baseDir, key);
    const exists = await pathExists(filePath);
    if (!exists) {
      issues.push({
        questionId: row.id,
        quizId: row.quizId,
        quizTitle: row.quiz.name,
        ownerEmail: ownerEmailLabel(row),
        imageKey: key,
        reason: "missing_file",
      });
    }
  }

  let diskFileCount = 0;
  let diskKeyCount = 0;
  let orphanCount = 0;
  const orphanExamples: string[] = [];

  if (!storageDirReady) {
    console.warn(`AVERTISSEMENT: le repertoire de stockage est absent ou inaccessible: ${baseDir}`);
    console.warn(
      "Verification de presence des fichiers et scan des orphelins omis (impossible sans repertoire).",
    );
    console.log("");
  } else {
    const absoluteFiles = await walkQuestionImageFiles(baseDir);
    diskFileCount = absoluteFiles.length;
    const diskKeys: string[] = [];
    for (const abs of absoluteFiles) {
      const rel = relativeImageKeyFromAbsoluteFilePath(baseDir, abs);
      if (rel) {
        diskKeys.push(rel);
      }
    }
    diskKeyCount = diskKeys.length;
    const { orphanKeys } = partitionDiskKeysByReference(diskKeys, distinctKeys);
    orphanCount = orphanKeys.length;
    orphanExamples.push(...orphanKeys.slice(0, 10));
  }

  const unsafeRows = issues.filter((i) => i.reason === "unsafe_key");
  const missingRows = issues.filter((i) => i.reason === "missing_file");
  const okCount =
    questions.length -
    unsafeRows.length -
    (storageDirReady ? missingRows.length : 0);

  console.log("--- Resume ---");
  console.log(`Questions avec imageKey en base: ${questions.length}`);
  console.log(`imageKey distincts en base: ${distinctKeys.size}`);
  console.log(`Fichiers sur le disque (recursif): ${diskFileCount}`);
  console.log(`Cles fichiers derivees du scan: ${diskKeyCount}`);
  console.log(`Questions OK (cle safe + fichier present): ${okCount}`);
  console.log(`Cles non conformes (unsafe): ${unsafeRows.length}`);
  if (storageDirReady) {
    console.log(`Fichiers manquants (cle safe, fichier absent): ${missingRows.length}`);
  } else {
    console.log(
      "Fichiers manquants (cle safe, fichier absent): non verifie (repertoire de stockage absent)",
    );
  }
  console.log(`Fichiers orphelins (sur disque, non references en base): ${orphanCount}`);
  console.log("");

  const printExamples = (label: string, rows: KeyIssueRow[], limit: number): void => {
    console.log(`${label} (max ${limit}):`);
    if (rows.length === 0) {
      console.log("(aucun)");
    } else {
      rows.slice(0, limit).forEach((r, i) => {
        console.log(
          `${i + 1}. questionId=${r.questionId} | quizId=${r.quizId} | quiz="${r.quizTitle}" | owner=${r.ownerEmail} | reason=${r.reason} | imageKey=${r.imageKey}`,
        );
      });
    }
    console.log("");
  };

  printExamples("Exemples cles non conformes ou chemins invalides", unsafeRows, 10);
  printExamples("Exemples fichiers manquants", missingRows, 10);

  console.log("Exemples fichiers orphelins (cle relative, max 10):");
  if (orphanExamples.length === 0) {
    console.log("(aucun)");
  } else {
    orphanExamples.forEach((k, i) => {
      console.log(`${i + 1}. ${k}`);
    });
  }
  console.log("");
  console.log("Audit termine (aucune ecriture, aucune suppression).");
}

const isDirectExecution =
  typeof process.argv[1] === "string" &&
  pathToFileURL(process.argv[1]).href === import.meta.url;

if (isDirectExecution) {
  main()
    .catch((error) => {
      console.error("Erreur pendant l'audit des images de questions:", error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
