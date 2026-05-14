import { describe, expect, it } from "vitest";

import {
  computeLegacyQuestionImageDryRunMetrics,
  decodeImageBufferFromParsed,
  estimateDecodedByteLengthFromBase64Payload,
  getDetectedMimeFromDataUrlPayload,
  isLegacyDataUrlQuestionImage,
  mimeFromDetectedFormat,
  normalizeDeclaredImageMime,
  parseDataUrlImage,
} from "./migrate-question-images-to-storage.helpers";

const ONE_BY_ONE_PNG_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

describe("isLegacyDataUrlQuestionImage", () => {
  it("returns true for data:image prefix", () => {
    expect(isLegacyDataUrlQuestionImage("data:image/png;base64,abcd")).toBe(true);
  });

  it("returns false for null, empty, or non-data URLs", () => {
    expect(isLegacyDataUrlQuestionImage(null)).toBe(false);
    expect(isLegacyDataUrlQuestionImage("")).toBe(false);
    expect(isLegacyDataUrlQuestionImage("https://example.com/x.png")).toBe(false);
  });
});

describe("normalizeDeclaredImageMime", () => {
  it("normalizes jpg and pjpeg to image/jpeg", () => {
    expect(normalizeDeclaredImageMime("image/jpg")).toBe("image/jpeg");
    expect(normalizeDeclaredImageMime("image/pjpeg")).toBe("image/jpeg");
  });
});

describe("parseDataUrlImage", () => {
  it("parses a valid PNG data URL with base64", () => {
    const result = parseDataUrlImage(ONE_BY_ONE_PNG_DATA_URL);
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.declaredMime).toBe("image/png");
    expect(result.normalizedDeclaredMime).toBe("image/png");
    expect(result.base64Payload.length).toBeGreaterThan(10);
  });

  it("parses JPEG declared as image/jpg", () => {
    const jpegHeader = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x00, 0x00]);
    const b64 = jpegHeader.toString("base64");
    const url = `data:image/jpg;base64,${b64}`;
    const result = parseDataUrlImage(url);
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.normalizedDeclaredMime).toBe("image/jpeg");
  });

  it("accepts charset before base64", () => {
    const url = `data:image/png;charset=utf-8;base64,${ONE_BY_ONE_PNG_DATA_URL.split(",")[1]}`;
    const result = parseDataUrlImage(url);
    expect(result.ok).toBe(true);
  });

  it("rejects unsupported declared MIME", () => {
    const result = parseDataUrlImage("data:image/gif;base64,R0lGODlhAQABAAAAACw=");
    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(result.error).toContain("Unsupported declared MIME");
  });

  it("rejects non-base64 data URLs", () => {
    const result = parseDataUrlImage("data:image/png,hello");
    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(result.error).toContain("base64");
  });

  it("rejects missing comma", () => {
    const result = parseDataUrlImage("data:image/png;base64");
    expect(result.ok).toBe(false);
  });

  it("rejects strings that are not data:image URLs", () => {
    const result = parseDataUrlImage("data:text/plain;base64,Zm9v");
    expect(result.ok).toBe(false);
  });
});

describe("decodeImageBufferFromParsed", () => {
  it("decodes valid base64 payload", () => {
    const parsed = parseDataUrlImage(ONE_BY_ONE_PNG_DATA_URL);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }
    const buf = decodeImageBufferFromParsed(parsed);
    expect(buf[0]).toBe(0x89);
    expect(buf[1]).toBe(0x50);
    expect(buf[2]).toBe(0x4e);
    expect(buf[3]).toBe(0x47);
  });
});

describe("estimateDecodedByteLengthFromBase64Payload", () => {
  it("matches Buffer length for a known payload", () => {
    const parsed = parseDataUrlImage(ONE_BY_ONE_PNG_DATA_URL);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }
    const decoded = Buffer.from(parsed.base64Payload, "base64");
    const est = estimateDecodedByteLengthFromBase64Payload(parsed.base64Payload);
    expect(est).toBe(decoded.length);
  });

  it("ignores whitespace in payload", () => {
    const parsed = parseDataUrlImage(ONE_BY_ONE_PNG_DATA_URL);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }
    const spaced = parsed.base64Payload.replace(/(.{20})/g, "$1\n");
    const est = estimateDecodedByteLengthFromBase64Payload(spaced);
    expect(est).toBe(Buffer.from(parsed.base64Payload, "base64").length);
  });
});

describe("getDetectedMimeFromDataUrlPayload", () => {
  it("detects PNG from payload prefix without full decode", () => {
    const parsed = parseDataUrlImage(ONE_BY_ONE_PNG_DATA_URL);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }
    expect(getDetectedMimeFromDataUrlPayload(parsed.base64Payload)).toBe("image/png");
  });
});

describe("mimeFromDetectedFormat", () => {
  it("maps formats to MIME strings", () => {
    expect(mimeFromDetectedFormat("jpeg")).toBe("image/jpeg");
    expect(mimeFromDetectedFormat("png")).toBe("image/png");
    expect(mimeFromDetectedFormat("webp")).toBe("image/webp");
  });
});

describe("computeLegacyQuestionImageDryRunMetrics", () => {
  it("marks rows with imageKey as skipped and not eligible", () => {
    const metrics = computeLegacyQuestionImageDryRunMetrics({
      image: ONE_BY_ONE_PNG_DATA_URL,
      imageKey: "user/quiz/abc123.png",
    });
    expect(metrics.isDataUrl).toBe(true);
    expect(metrics.wouldSkipDueToImageKey).toBe(true);
    expect(metrics.eligibleForMigrationPreview).toBe(false);
  });

  it("returns eligible when data URL is valid and imageKey is empty", () => {
    const metrics = computeLegacyQuestionImageDryRunMetrics({
      image: ONE_BY_ONE_PNG_DATA_URL,
      imageKey: null,
    });
    expect(metrics.eligibleForMigrationPreview).toBe(true);
    expect(metrics.detectedMime).toBe("image/png");
    expect(metrics.parseError).toBeNull();
  });

  it("returns dry-run mapping for non-data image", () => {
    const metrics = computeLegacyQuestionImageDryRunMetrics({
      image: "https://example.com/a.png",
      imageKey: null,
    });
    expect(metrics.isDataUrl).toBe(false);
    expect(metrics.approxDecodedBytes).toBe(0);
  });
});
