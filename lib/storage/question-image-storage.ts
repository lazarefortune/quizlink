import { randomBytes } from "crypto";
import {
  mkdir,
  readFile,
  unlink,
  writeFile,
} from "fs/promises";
import path from "path";

export type QuestionImageStorageMode = "local" | "s3";

const DEFAULT_RELATIVE_UPLOAD_DIR = path.join("storage", "question-images");

const ALLOWED_IMAGE_EXTENSIONS = new Set([
  ".webp",
  ".jpeg",
  ".jpg",
  ".png",
]);

const DIRECTORY_SEGMENT_PATTERN = /^[a-z0-9_-]{1,128}$/i;

const OBJECT_FILE_PATTERN =
  /^[a-f0-9]{32}\.(webp|jpeg|jpg|png)$/i;

/**
 * Storage driver for question images. `s3` is reserved for a future implementation;
 * reads/writes/deletes only work in `local` mode today.
 */
export function getQuestionImageStorageMode(): QuestionImageStorageMode {
  const mode = process.env.QUESTION_IMAGE_STORAGE?.trim().toLowerCase();
  if (mode === "s3") {
    return "s3";
  }
  return "local";
}

/**
 * Absolute base directory for local question image files.
 * Never under `public/`. Creates the directory when saving the first file.
 */
export function getQuestionImageLocalBaseDir(): string {
  const fromEnv = process.env.QUESTION_IMAGE_UPLOAD_DIR?.trim();
  const resolved = fromEnv && fromEnv.length > 0
    ? path.resolve(fromEnv)
    : path.resolve(process.cwd(), DEFAULT_RELATIVE_UPLOAD_DIR);
  return resolved;
}

function assertLocalModeForMutation(operation: string): void {
  if (getQuestionImageStorageMode() !== "local") {
    throw new Error(
      `Question image ${operation} is only implemented for local storage (QUESTION_IMAGE_STORAGE=local).`,
    );
  }
}

function normalizeImageExtension(extension: string): string {
  const trimmed = extension.trim().toLowerCase();
  const withDot = trimmed.startsWith(".") ? trimmed : `.${trimmed}`;
  if (!ALLOWED_IMAGE_EXTENSIONS.has(withDot)) {
    throw new Error(
      `Unsupported image extension "${extension}". Allowed: ${[...ALLOWED_IMAGE_EXTENSIONS].join(", ")}`,
    );
  }
  return withDot;
}

function assertSafePathSegment(segment: string, label: string): void {
  if (!DIRECTORY_SEGMENT_PATTERN.test(segment)) {
    throw new Error(
      `Invalid ${label}: must be 1–128 characters from [a-z0-9_-].`,
    );
  }
}

/**
 * Returns true if `storageKey` is a safe relative object key (no traversal, no absolute paths).
 */
export function isSafeQuestionImageStorageKey(storageKey: string): boolean {
  if (!storageKey || storageKey.length > 512) {
    return false;
  }
  if (storageKey.startsWith("/") || storageKey.includes("\0")) {
    return false;
  }
  const segments = storageKey.split("/");
  if (segments.length < 3) {
    return false;
  }
  for (let i = 0; i < segments.length - 1; i += 1) {
    const segment = segments[i];
    if (segment === "" || segment === "." || segment === "..") {
      return false;
    }
    if (!DIRECTORY_SEGMENT_PATTERN.test(segment)) {
      return false;
    }
  }
  const last = segments[segments.length - 1];
  if (!last) {
    return false;
  }
  return OBJECT_FILE_PATTERN.test(last);
}

export function assertSafeQuestionImageStorageKey(storageKey: string): void {
  if (!isSafeQuestionImageStorageKey(storageKey)) {
    throw new Error("Invalid question image storage key.");
  }
}

/**
 * Builds an unguessable storage key. Never embeds the original filename.
 * Format: `{userId}/{quizId|draft}/{entropy}{extension}`
 */
export function buildQuestionImageStorageKey(params: {
  userId: string;
  quizId?: string;
  extension: string;
}): string {
  const userId = params.userId.trim();
  const quizSegment = (params.quizId?.trim() || "draft");
  assertSafePathSegment(userId, "userId");
  assertSafePathSegment(quizSegment, "quizId");
  const ext = normalizeImageExtension(params.extension);
  const entropy = randomBytes(16).toString("hex");
  return `${userId}/${quizSegment}/${entropy}${ext}`;
}

export function getQuestionImageContentTypeFromKey(storageKey: string): string {
  const ext = path.extname(storageKey).toLowerCase();
  switch (ext) {
    case ".webp":
      return "image/webp";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    default:
      return "application/octet-stream";
  }
}

function resolveLocalFilePath(storageKey: string): string {
  assertSafeQuestionImageStorageKey(storageKey);
  const base = getQuestionImageLocalBaseDir();
  return path.join(base, ...storageKey.split("/"));
}

/**
 * Persists bytes under the validated storage key (local filesystem).
 */
export async function saveQuestionImageBuffer(params: {
  storageKey: string;
  buffer: Buffer;
}): Promise<void> {
  assertLocalModeForMutation("write");
  assertSafeQuestionImageStorageKey(params.storageKey);
  const filePath = resolveLocalFilePath(params.storageKey);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, params.buffer);
}

/**
 * Reads bytes for a validated storage key.
 */
export async function readQuestionImageBuffer(storageKey: string): Promise<Buffer> {
  if (getQuestionImageStorageMode() !== "local") {
    throw new Error(
      "Question image read is only implemented for local storage (QUESTION_IMAGE_STORAGE=local).",
    );
  }
  assertSafeQuestionImageStorageKey(storageKey);
  const filePath = resolveLocalFilePath(storageKey);
  return readFile(filePath);
}

/**
 * Copies a stored question image to a new object key for another quiz/user.
 * Does not delete the source object.
 */
export async function copyQuestionImageStorageObject(params: {
  sourceKey: string;
  targetUserId: string;
  targetQuizId: string;
}): Promise<string> {
  if (getQuestionImageStorageMode() !== "local") {
    throw new Error(
      "Question image copy is only implemented for local storage (QUESTION_IMAGE_STORAGE=local).",
    );
  }
  if (!isSafeQuestionImageStorageKey(params.sourceKey)) {
    throw new Error("Invalid question image storage key.");
  }
  const buffer = await readQuestionImageBuffer(params.sourceKey);
  const extensionFromKey = path.extname(params.sourceKey);
  if (!extensionFromKey) {
    throw new Error("Question image storage key must include a file extension.");
  }
  const newKey = buildQuestionImageStorageKey({
    userId: params.targetUserId,
    quizId: params.targetQuizId,
    extension: extensionFromKey,
  });
  await saveQuestionImageBuffer({ storageKey: newKey, buffer });
  return newKey;
}

/**
 * Deletes the object if it exists. Ignores missing files.
 */
export async function deleteQuestionImage(storageKey: string): Promise<void> {
  assertLocalModeForMutation("delete");
  assertSafeQuestionImageStorageKey(storageKey);
  const filePath = resolveLocalFilePath(storageKey);
  try {
    await unlink(filePath);
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === "ENOENT") {
      return;
    }
    throw err;
  }
}
