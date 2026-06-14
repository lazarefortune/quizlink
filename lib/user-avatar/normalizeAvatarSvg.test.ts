import { describe, expect, it } from "vitest";

import { normalizeAvatarSvg } from "./normalizeAvatarSvg";

describe("normalizeAvatarSvg", () => {
  it("adds preserveAspectRatio when missing", () => {
    const input = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 440 440"></svg>';
    const output = normalizeAvatarSvg(input);

    expect(output).toContain('preserveAspectRatio="xMidYMid meet"');
  });

  it("strips explicit width and height attributes", () => {
    const input =
      '<svg width="440" height="440" viewBox="0 0 440 440" preserveAspectRatio="none"></svg>';
    const output = normalizeAvatarSvg(input);

    expect(output).not.toContain('width="440"');
    expect(output).not.toContain('height="440"');
    expect(output).toContain('preserveAspectRatio="none"');
  });
});
