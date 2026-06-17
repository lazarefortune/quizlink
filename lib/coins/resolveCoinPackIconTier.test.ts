import { describe, expect, it } from "vitest";

import { resolveCoinPackIconTier } from "./resolveCoinPackIconTier";

describe("resolveCoinPackIconTier", () => {
  it("maps starter-sized packs to a single coin", () => {
    expect(resolveCoinPackIconTier(50)).toBe("single");
    expect(resolveCoinPackIconTier(79)).toBe("single");
  });

  it("maps medium packs to overlapping coins", () => {
    expect(resolveCoinPackIconTier(120)).toBe("duo");
    expect(resolveCoinPackIconTier(149)).toBe("duo");
  });

  it("maps larger packs to stacked icons", () => {
    expect(resolveCoinPackIconTier(300)).toBe("stacksTall");
    expect(resolveCoinPackIconTier(200)).toBe("stacks");
  });

  it("maps the largest packs to a coin pile", () => {
    expect(resolveCoinPackIconTier(500)).toBe("pile");
    expect(resolveCoinPackIconTier(1000)).toBe("pile");
  });
});
