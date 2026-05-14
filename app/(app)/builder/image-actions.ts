"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  buildQuestionImageStorageKey,
  saveQuestionImageBuffer,
} from "@/lib/storage/question-image-storage";
import {
  detectQuestionImageFormatFromMagicBytes,
  storageExtensionForDetectedFormat,
} from "@/lib/builder/validateQuestionImageMagicBytes";
import { getQuestionImageSrc } from "@/lib/question-image-src";

const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;

const ALLOWED_CLIENT_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/pjpeg",
  "image/webp",
]);

export type UploadQuestionImageResult =
  | { success: true; imageKey: string; imageUrl: string }
  | { success: false; error: string };

function normalizeClientMimeType(raw: string): string {
  const t = raw.trim().toLowerCase();
  if (t === "image/jpg") {
    return "image/jpeg";
  }
  return t;
}

function isAllowedDeclaredMimeType(mime: string): boolean {
  const normalized = normalizeClientMimeType(mime);
  return ALLOWED_CLIENT_TYPES.has(normalized);
}

export async function uploadQuestionImageAction(
  formData: FormData,
): Promise<UploadQuestionImageResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  const userId = session.user.id;
  const fileEntry = formData.get("file");
  if (!(fileEntry instanceof File)) {
    return { success: false, error: "Missing file" };
  }

  if (fileEntry.size === 0) {
    return { success: false, error: "Empty file" };
  }

  if (fileEntry.size > MAX_UPLOAD_BYTES) {
    return { success: false, error: "File too large" };
  }

  if (fileEntry.type && !isAllowedDeclaredMimeType(fileEntry.type)) {
    return { success: false, error: "Unsupported image type" };
  }

  const quizIdRaw = formData.get("quizId");
  let quizIdForKey: string | undefined;
  if (typeof quizIdRaw === "string" && quizIdRaw.trim().length > 0) {
    const quizId = quizIdRaw.trim();
    if (!prisma) {
      return { success: false, error: "Database not initialized" };
    }
    const owned = await prisma.quiz.findFirst({
      where: { id: quizId, ownerId: userId },
      select: { id: true },
    });
    if (!owned) {
      return { success: false, error: "Quiz not found" };
    }
    quizIdForKey = quizId;
  }

  const arrayBuffer = await fileEntry.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const detected = detectQuestionImageFormatFromMagicBytes(buffer);
  if (!detected) {
    return { success: false, error: "Invalid image data" };
  }

  const extension = storageExtensionForDetectedFormat(detected);
  const storageKey = buildQuestionImageStorageKey({
    userId,
    quizId: quizIdForKey,
    extension,
  });

  try {
    await saveQuestionImageBuffer({ storageKey, buffer });
  } catch (err) {
    console.error("[uploadQuestionImageAction] save failed", err);
    return { success: false, error: "Failed to store image" };
  }

  const imageUrl = getQuestionImageSrc({ imageKey: storageKey, image: null });
  if (!imageUrl) {
    return { success: false, error: "Failed to build image URL" };
  }

  return { success: true, imageKey: storageKey, imageUrl };
}
