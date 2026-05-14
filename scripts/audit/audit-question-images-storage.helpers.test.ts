import path from "path";

import { describe, expect, it } from "vitest";

import {
  buildReferencedKeySet,
  normalizeStorageKeyForCompare,
  partitionDiskKeysByReference,
  relativeImageKeyFromAbsoluteFilePath,
} from "./audit-question-images-storage.helpers";

describe("relativeImageKeyFromAbsoluteFilePath", () => {
  it("returns POSIX-style key for a file under the root", () => {
    const root = path.resolve("/var/www/app/storage/question-images");
    const file = path.join(root, "user1", "quiz1", "abc123.png");
    expect(relativeImageKeyFromAbsoluteFilePath(root, file)).toBe(
      "user1/quiz1/abc123.png",
    );
  });

  it("returns null for paths outside the root", () => {
    const root = path.resolve("/var/www/app/storage/question-images");
    const outside = path.resolve("/etc/passwd");
    expect(relativeImageKeyFromAbsoluteFilePath(root, outside)).toBeNull();
  });

  it("returns null when file path is the root itself", () => {
    const root = path.resolve("/data/images");
    expect(relativeImageKeyFromAbsoluteFilePath(root, root)).toBeNull();
  });
});

describe("normalizeStorageKeyForCompare", () => {
  it("trims and normalizes backslashes", () => {
    expect(normalizeStorageKeyForCompare("  a\\b/c  ")).toBe("a/b/c");
  });
});

describe("buildReferencedKeySet", () => {
  it("dedupes and skips empty strings", () => {
    const set = buildReferencedKeySet(["a/b/c.png", "  a/b/c.png  ", "", "x/y/z.jpg"]);
    expect(set.size).toBe(2);
    expect(set.has("a/b/c.png")).toBe(true);
    expect(set.has("x/y/z.jpg")).toBe(true);
  });
});

describe("partitionDiskKeysByReference", () => {
  it("lists keys on disk that are not referenced in DB", () => {
    const referenced = buildReferencedKeySet(["u/q/aa.png"]);
    const { orphanKeys } = partitionDiskKeysByReference(
      ["u/q/aa.png", "u/q/orphan.jpg"],
      referenced,
    );
    expect(orphanKeys).toEqual(["u/q/orphan.jpg"]);
  });
});
