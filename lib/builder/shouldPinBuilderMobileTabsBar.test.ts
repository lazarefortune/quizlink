import { describe, expect, it } from "vitest";

import { shouldPinBuilderMobileTabsBar } from "./shouldPinBuilderMobileTabsBar";

describe("shouldPinBuilderMobileTabsBar", () => {
  it("pins when anchor scrolls above scroll root top", () => {
    expect(shouldPinBuilderMobileTabsBar(40, 56)).toBe(true);
  });

  it("does not pin when anchor is at scroll root top", () => {
    expect(shouldPinBuilderMobileTabsBar(56, 56)).toBe(false);
  });

  it("does not pin when anchor is below scroll root top", () => {
    expect(shouldPinBuilderMobileTabsBar(80, 56)).toBe(false);
  });
});
