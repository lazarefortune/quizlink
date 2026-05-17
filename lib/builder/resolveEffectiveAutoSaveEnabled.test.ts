import { describe, expect, it } from "vitest";
import { resolveEffectiveAutoSaveEnabled } from "@/lib/builder/resolveEffectiveAutoSaveEnabled";

describe("resolveEffectiveAutoSaveEnabled", () => {
  it("returns true when autoSaveEnabled is absent", () => {
    expect(resolveEffectiveAutoSaveEnabled({})).toBe(true);
  });

  it("returns true when autoSaveEnabled is true", () => {
    expect(resolveEffectiveAutoSaveEnabled({ autoSaveEnabled: true })).toBe(true);
  });

  it("returns false when autoSaveEnabled is false", () => {
    expect(resolveEffectiveAutoSaveEnabled({ autoSaveEnabled: false })).toBe(false);
  });
});
