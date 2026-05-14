export type DetectedQuestionImageFormat = "png" | "jpeg" | "webp";

/**
 * Detects PNG, JPEG, or WebP from file header bytes (do not trust Content-Type alone).
 */
export function detectQuestionImageFormatFromMagicBytes(
  buffer: Buffer,
): DetectedQuestionImageFormat | null {
  if (buffer.length < 12) {
    return null;
  }

  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "jpeg";
  }

  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "png";
  }

  if (
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "webp";
  }

  return null;
}

export function storageExtensionForDetectedFormat(
  format: DetectedQuestionImageFormat,
): ".jpg" | ".png" | ".webp" {
  if (format === "jpeg") {
    return ".jpg";
  }
  if (format === "png") {
    return ".png";
  }
  return ".webp";
}
