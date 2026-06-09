import { describe, expect, it } from "vitest";

import { generateUserAvatar } from "./generateUserAvatar";
import {
  createRandomUserAvatarBackgroundColor,
  createRandomUserAvatarOptions,
} from "./createRandomUserAvatarOptions";
import { AVATAR_BACKGROUND_COLORS } from "./bigEarsOptionValues";

describe("createRandomUserAvatarOptions", () => {
  it("returns explicit options for all core features", () => {
    const options = createRandomUserAvatarOptions();

    expect(options.hair?.length).toBe(1);
    expect(options.eyes?.length).toBe(1);
    expect(options.mouth?.length).toBe(1);
    expect(options.skinColor?.length).toBe(1);
    expect(options.hairColor?.length).toBe(1);
  });

  it("generates a valid SVG preview config", () => {
    const svg = generateUserAvatar({
      seed: "random-preview-seed",
      backgroundColor: createRandomUserAvatarBackgroundColor(),
      options: createRandomUserAvatarOptions(),
    });

    expect(svg).toContain("<svg");
    expect(svg).toContain('viewBox="0 0 440 440"');
    expect(AVATAR_BACKGROUND_COLORS.length).toBeGreaterThan(0);
  });
});
