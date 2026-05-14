import { mkdtempSync, rmSync } from "fs";
import { tmpdir } from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildQuestionImageStorageKey,
  copyQuestionImageStorageObject,
  deleteQuestionImage,
  getQuestionImageContentTypeFromKey,
  getQuestionImageLocalBaseDir,
  getQuestionImageStorageMode,
  isSafeQuestionImageStorageKey,
  readQuestionImageBuffer,
  saveQuestionImageBuffer,
} from "./question-image-storage";

describe("getQuestionImageStorageMode", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns local by default", () => {
    vi.stubEnv("QUESTION_IMAGE_STORAGE", "");
    expect(getQuestionImageStorageMode()).toBe("local");
  });

  it("returns s3 when env is s3", () => {
    vi.stubEnv("QUESTION_IMAGE_STORAGE", "s3");
    expect(getQuestionImageStorageMode()).toBe("s3");
  });
});

describe("getQuestionImageLocalBaseDir", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses QUESTION_IMAGE_UPLOAD_DIR when set", () => {
    const custom = path.join(tmpdir(), "quizlink-test-uploads");
    vi.stubEnv("QUESTION_IMAGE_UPLOAD_DIR", custom);
    expect(getQuestionImageLocalBaseDir()).toBe(path.resolve(custom));
  });
});

describe("isSafeQuestionImageStorageKey", () => {
  it("accepts a well-formed key", () => {
    const key =
      "cluser12345678901234567890/clquiz12345678901234567890/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.webp";
    expect(isSafeQuestionImageStorageKey(key)).toBe(true);
  });

  it("rejects path traversal", () => {
    expect(
      isSafeQuestionImageStorageKey(
        "user/../aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.webp",
      ),
    ).toBe(false);
  });

  it("rejects too few segments", () => {
    expect(
      isSafeQuestionImageStorageKey("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.webp"),
    ).toBe(false);
  });

  it("rejects wrong entropy length", () => {
    expect(
      isSafeQuestionImageStorageKey(
        "userid/quizid/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.webp",
      ),
    ).toBe(false);
  });
});

describe("getQuestionImageContentTypeFromKey", () => {
  it("maps extensions", () => {
    expect(getQuestionImageContentTypeFromKey("a/b/c.webp")).toBe("image/webp");
    expect(getQuestionImageContentTypeFromKey("a/b/c.jpg")).toBe("image/jpeg");
    expect(getQuestionImageContentTypeFromKey("a/b/c.jpeg")).toBe("image/jpeg");
    expect(getQuestionImageContentTypeFromKey("a/b/c.png")).toBe("image/png");
    expect(getQuestionImageContentTypeFromKey("a/b/c.unknown")).toBe(
      "application/octet-stream",
    );
  });
});

describe("buildQuestionImageStorageKey", () => {
  it("includes user, quiz, 32-char hex entropy and extension", () => {
    const key = buildQuestionImageStorageKey({
      userId: "cluser12345678901234567890",
      quizId: "clquiz12345678901234567890",
      extension: "webp",
    });

    expect(key).toMatch(
      /^cluser12345678901234567890\/clquiz12345678901234567890\/[a-f0-9]{32}\.webp$/,
    );
  });

  it("uses draft when quizId omitted", () => {
    const key = buildQuestionImageStorageKey({
      userId: "cluser12345678901234567890",
      extension: ".png",
    });

    expect(key).toMatch(
      /^cluser12345678901234567890\/draft\/[a-f0-9]{32}\.png$/,
    );
  });
});

describe("local storage IO", () => {
  let tempBase: string;

  beforeEach(() => {
    tempBase = mkdtempSync(path.join(tmpdir(), "quizlink-qimg-"));
    vi.stubEnv("QUESTION_IMAGE_UPLOAD_DIR", tempBase);
    vi.stubEnv("QUESTION_IMAGE_STORAGE", "local");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    rmSync(tempBase, { recursive: true, force: true });
  });

  it("writes, reads, and deletes a file", async () => {
    const storageKey =
      "cluser12345678901234567890/clquiz12345678901234567890/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.webp";
    const payload = Buffer.from("fake-image");

    await saveQuestionImageBuffer({ storageKey, buffer: payload });
    const readBack = await readQuestionImageBuffer(storageKey);
    expect(readBack.equals(payload)).toBe(true);

    await deleteQuestionImage(storageKey);
    await expect(readQuestionImageBuffer(storageKey)).rejects.toMatchObject({
      code: "ENOENT",
    });
  });

  it("deleteQuestionImage ignores missing file", async () => {
    const storageKey =
      "cluser12345678901234567890/clquiz12345678901234567890/bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb.png";
    await expect(deleteQuestionImage(storageKey)).resolves.toBeUndefined();
  });

  it("copyQuestionImageStorageObject writes a new key with same bytes and extension", async () => {
    const sourceKey =
      "cluser12345678901234567890/clquiz12345678901234567890/cccccccccccccccccccccccccccccccc.png";
    const payload = Buffer.from("png-bytes");
    await saveQuestionImageBuffer({ storageKey: sourceKey, buffer: payload });

    const newKey = await copyQuestionImageStorageObject({
      sourceKey,
      targetUserId: "cluser12345678901234567890",
      targetQuizId: "clquiz999999999999999999999999",
    });

    expect(newKey).not.toBe(sourceKey);
    expect(newKey.endsWith(".png")).toBe(true);
    expect(newKey).toContain("/clquiz999999999999999999999999/");
    const readBack = await readQuestionImageBuffer(newKey);
    expect(readBack.equals(payload)).toBe(true);
    const sourceStill = await readQuestionImageBuffer(sourceKey);
    expect(sourceStill.equals(payload)).toBe(true);

    await deleteQuestionImage(newKey);
    await deleteQuestionImage(sourceKey);
  });

  it("copyQuestionImageStorageObject rejects an unsafe source key", async () => {
    await expect(
      copyQuestionImageStorageObject({
        sourceKey: "not/a/valid/key.png",
        targetUserId: "cluser12345678901234567890",
        targetQuizId: "clquiz12345678901234567890",
      }),
    ).rejects.toThrow(/Invalid question image storage key/);
  });
});
