import { describe, expect, it } from "vitest";

import {
  isValidDiceBearHexColor,
  normalizeDiceBearHexColor,
  toCssHexColor,
} from "./avatarColorUtils";

describe("avatarColorUtils", () => {
  it("strips leading hash for DiceBear", () => {
    expect(normalizeDiceBearHexColor("#89532c")).toBe("89532c");
    expect(normalizeDiceBearHexColor("89532c")).toBe("89532c");
  });

  it("converts to CSS hex color", () => {
    expect(toCssHexColor("c8bfe8")).toBe("#c8bfe8");
    expect(toCssHexColor("#c8bfe8")).toBe("#c8bfe8");
  });

  it("validates 6-char hex colors", () => {
    expect(isValidDiceBearHexColor("da9969")).toBe(true);
    expect(isValidDiceBearHexColor("#da9969")).toBe(true);
    expect(isValidDiceBearHexColor("white")).toBe(false);
  });
});
