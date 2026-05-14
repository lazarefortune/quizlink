import { describe, expect, it } from "vitest";
import {
  detectQuestionImageFormatFromMagicBytes,
  storageExtensionForDetectedFormat,
} from "./validateQuestionImageMagicBytes";

describe("detectQuestionImageFormatFromMagicBytes", () => {
  it("detects JPEG", () => {
    const buf = Buffer.concat([
      Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]),
      Buffer.alloc(6, 0),
    ]);
    expect(detectQuestionImageFormatFromMagicBytes(buf)).toBe("jpeg");
  });

  it("detects PNG", () => {
    const buf = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
    ]);
    expect(detectQuestionImageFormatFromMagicBytes(buf)).toBe("png");
  });

  it("detects WebP", () => {
    const buf = Buffer.alloc(16);
    buf.write("RIFF", 0, "ascii");
    buf.write("WEBP", 8, "ascii");
    expect(detectQuestionImageFormatFromMagicBytes(buf)).toBe("webp");
  });

  it("returns null for unknown", () => {
    expect(detectQuestionImageFormatFromMagicBytes(Buffer.from("hello"))).toBeNull();
  });
});

describe("storageExtensionForDetectedFormat", () => {
  it("maps formats", () => {
    expect(storageExtensionForDetectedFormat("jpeg")).toBe(".jpg");
    expect(storageExtensionForDetectedFormat("png")).toBe(".png");
    expect(storageExtensionForDetectedFormat("webp")).toBe(".webp");
  });
});
