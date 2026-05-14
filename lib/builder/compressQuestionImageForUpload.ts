"use client";

const MAX_DIMENSION = 1600;
const WEBP_QUALITY = 0.8;
const JPEG_QUALITY = 0.82;
const JPEG_FALLBACK_QUALITY = 0.72;
const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number,
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality);
  });
}

function isBrowserImageTypeAllowed(file: File): boolean {
  return /^image\/(png|jpeg|jpg|pjpeg|webp)$/i.test(file.type.trim());
}

export type CompressedQuestionImageForUpload = {
  blob: Blob;
  suggestedFileName: string;
};

/**
 * Resizes to fit within MAX_DIMENSION, then encodes WebP when supported, else JPEG.
 * Falls back to the original file when canvas / encoding is unavailable (server still validates).
 */
export async function compressQuestionImageForUpload(
  file: File,
): Promise<CompressedQuestionImageForUpload> {
  if (typeof createImageBitmap === "undefined" || typeof document === "undefined") {
    return { blob: file, suggestedFileName: file.name || "question-upload.bin" };
  }

  if (!isBrowserImageTypeAllowed(file)) {
    return { blob: file, suggestedFileName: file.name || "question-upload.bin" };
  }

  let bitmap: ImageBitmap | null = null;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return { blob: file, suggestedFileName: file.name || "question-upload.bin" };
  }

  try {
    const w = bitmap.width;
    const h = bitmap.height;
    const scale = Math.min(1, MAX_DIMENSION / w, MAX_DIMENSION / h);
    const targetW = Math.max(1, Math.round(w * scale));
    const targetH = Math.max(1, Math.round(h * scale));

    const canvas = document.createElement("canvas");
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return { blob: file, suggestedFileName: file.name || "question-upload.bin" };
    }

    ctx.drawImage(bitmap, 0, 0, targetW, targetH);

    let blob = await canvasToBlob(canvas, "image/webp", WEBP_QUALITY);
    if (!blob || blob.size === 0) {
      blob = await canvasToBlob(canvas, "image/jpeg", JPEG_QUALITY);
    }

    if (!blob || blob.size === 0) {
      return { blob: file, suggestedFileName: file.name || "question-upload.bin" };
    }

    let outBlob = blob;
    let suggestedFileName = outBlob.type === "image/webp" ? "question.webp" : "question.jpg";

    if (outBlob.size > MAX_UPLOAD_BYTES) {
      const smaller = await canvasToBlob(canvas, "image/jpeg", JPEG_FALLBACK_QUALITY);
      if (smaller && smaller.size > 0 && smaller.size < outBlob.size) {
        outBlob = smaller;
        suggestedFileName = "question.jpg";
      }
    }

    if (outBlob.size > MAX_UPLOAD_BYTES) {
      return { blob: file, suggestedFileName: file.name || "question-upload.bin" };
    }

    return { blob: outBlob, suggestedFileName };
  } finally {
    bitmap.close();
  }
}

export function isCompressedQuestionImageWithinUploadLimit(
  blob: Blob,
): boolean {
  return blob.size <= MAX_UPLOAD_BYTES;
}
