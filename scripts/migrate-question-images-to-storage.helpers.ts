import {
  detectQuestionImageFormatFromMagicBytes,
  type DetectedQuestionImageFormat,
} from "../lib/builder/validateQuestionImageMagicBytes";

const LEGACY_PREFIX = "data:image/";

const ALLOWED_DECLARED_MIMES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/pjpeg",
  "image/webp",
]);

export type ParseDataUrlImageOk = {
  ok: true;
  declaredMime: string;
  normalizedDeclaredMime: string;
  base64Payload: string;
};

export type ParseDataUrlImageError = {
  ok: false;
  error: string;
};

export type ParseDataUrlImageResult = ParseDataUrlImageOk | ParseDataUrlImageError;

export function isLegacyDataUrlQuestionImage(image: string | null | undefined): boolean {
  if (!image) {
    return false;
  }
  return image.startsWith(LEGACY_PREFIX);
}

export function normalizeDeclaredImageMime(mime: string): string {
  const t = mime.trim().toLowerCase();
  if (t === "image/jpg" || t === "image/pjpeg") {
    return "image/jpeg";
  }
  return t;
}

/**
 * Parses a data URL that embeds a base64 image. Does not decode payload bytes.
 */
export function parseDataUrlImage(dataUrl: string): ParseDataUrlImageResult {
  const trimmed = dataUrl.trim();
  if (!trimmed.startsWith(LEGACY_PREFIX)) {
    return { ok: false, error: "Not a data:image URL" };
  }

  const comma = trimmed.indexOf(",");
  if (comma === -1) {
    return { ok: false, error: "Missing comma in data URL" };
  }

  const header = trimmed.slice(5, comma);
  const base64Payload = trimmed.slice(comma + 1);
  if (base64Payload.length === 0) {
    return { ok: false, error: "Empty payload" };
  }

  const segments = header.split(";").map((s) => s.trim()).filter(Boolean);
  if (segments.length === 0) {
    return { ok: false, error: "Missing MIME type in data URL" };
  }

  const declaredMimeRaw = segments[0];
  if (!declaredMimeRaw.toLowerCase().startsWith("image/")) {
    return { ok: false, error: "MIME is not an image type" };
  }

  const hasBase64Marker = segments.some((s) => s.toLowerCase() === "base64");
  if (!hasBase64Marker) {
    return { ok: false, error: "Expected base64 encoding in data URL" };
  }

  const normalizedDeclaredMime = normalizeDeclaredImageMime(declaredMimeRaw);
  if (!ALLOWED_DECLARED_MIMES.has(normalizedDeclaredMime)) {
    return {
      ok: false,
      error: `Unsupported declared MIME "${declaredMimeRaw}"`,
    };
  }

  return {
    ok: true,
    declaredMime: declaredMimeRaw,
    normalizedDeclaredMime,
    base64Payload,
  };
}

/**
 * Approximate decoded byte length from a base64 payload without decoding the full string.
 */
export function estimateDecodedByteLengthFromBase64Payload(base64Payload: string): number {
  const cleaned = base64Payload.replace(/\s/g, "");
  if (cleaned.length === 0) {
    return 0;
  }

  let padding = 0;
  if (cleaned.endsWith("==")) {
    padding = 2;
  } else if (cleaned.endsWith("=")) {
    padding = 1;
  }

  return Math.max(0, Math.floor((cleaned.length * 3) / 4) - padding);
}

export function decodeImageBufferFromParsed(parsed: ParseDataUrlImageOk): Buffer {
  return Buffer.from(parsed.base64Payload, "base64");
}

function decodeLeadingBytesFromBase64Payload(
  base64Payload: string,
  maxBytes: number,
): Buffer {
  const cleaned = base64Payload.replace(/\s/g, "");
  const neededChars = Math.ceil((maxBytes * 4) / 3) + 8;
  let slice = cleaned.slice(0, Math.min(cleaned.length, neededChars));
  const remainder = slice.length % 4;
  if (remainder !== 0) {
    slice = slice.slice(0, slice.length - remainder);
  }
  if (slice.length === 0) {
    return Buffer.alloc(0);
  }
  return Buffer.from(slice, "base64");
}

export function mimeFromDetectedFormat(format: DetectedQuestionImageFormat): string {
  if (format === "jpeg") {
    return "image/jpeg";
  }
  if (format === "png") {
    return "image/png";
  }
  return "image/webp";
}

/**
 * Reads only enough base64 to inspect magic bytes (dry-run, no full decode).
 */
export function getDetectedMimeFromDataUrlPayload(base64Payload: string): string | null {
  const buf = decodeLeadingBytesFromBase64Payload(base64Payload, 32);
  const fmt = detectQuestionImageFormatFromMagicBytes(buf);
  if (!fmt) {
    return null;
  }
  return mimeFromDetectedFormat(fmt);
}

export type LegacyQuestionImageDryRunInput = {
  image: string | null;
  imageKey: string | null;
};

export type LegacyQuestionImageDryRunMetrics = {
  isDataUrl: boolean;
  wouldSkipDueToImageKey: boolean;
  eligibleForMigrationPreview: boolean;
  parseError: string | null;
  approxDecodedBytes: number;
  declaredMime: string | null;
  detectedMime: string | null;
};

/**
 * Pure dry-run metrics for one question row (no I/O).
 */
export function computeLegacyQuestionImageDryRunMetrics(
  input: LegacyQuestionImageDryRunInput,
): LegacyQuestionImageDryRunMetrics {
  const isDataUrl = isLegacyDataUrlQuestionImage(input.image);
  const wouldSkipDueToImageKey =
    Boolean(input.imageKey && input.imageKey.trim().length > 0);

  if (!isDataUrl) {
    return {
      isDataUrl: false,
      wouldSkipDueToImageKey,
      eligibleForMigrationPreview: false,
      parseError: null,
      approxDecodedBytes: 0,
      declaredMime: null,
      detectedMime: null,
    };
  }

  const image = input.image as string;
  const parsed = parseDataUrlImage(image);
  if (!parsed.ok) {
    return {
      isDataUrl: true,
      wouldSkipDueToImageKey,
      eligibleForMigrationPreview: false,
      parseError: parsed.error,
      approxDecodedBytes: 0,
      declaredMime: null,
      detectedMime: null,
    };
  }

  const approxDecodedBytes = estimateDecodedByteLengthFromBase64Payload(parsed.base64Payload);
  const detectedMime = getDetectedMimeFromDataUrlPayload(parsed.base64Payload);
  const magicError =
    detectedMime === null ? "Magic bytes do not match PNG, JPEG, or WebP" : null;

  const eligibleForMigrationPreview =
    !wouldSkipDueToImageKey && detectedMime !== null;

  return {
    isDataUrl: true,
    wouldSkipDueToImageKey,
    eligibleForMigrationPreview,
    parseError: magicError,
    approxDecodedBytes,
    declaredMime: parsed.declaredMime,
    detectedMime,
  };
}
