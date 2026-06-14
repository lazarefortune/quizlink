import { describe, expect, it } from "vitest";

import { generateUserAvatar } from "./generateUserAvatar";
import type { UserAvatarConfig } from "./userAvatarConfigSchema";

describe("generateUserAvatar", () => {
  it("generates deterministic SVG for the same config", () => {
    const config: UserAvatarConfig = {
      seed: "user-123",
      backgroundColor: "c8bfe8",
      options: {
        hair: ["short05"],
        eyes: ["variant04"],
        mouth: ["variant0101"],
        skinColor: ["f8b788"],
        hairColor: ["2c1b18"],
      },
    };

    const first = generateUserAvatar(config);
    const second = generateUserAvatar(config);

    expect(first).toContain("<svg");
    expect(first).toBe(second);
    expect(first).toContain('fill="#f8b788"');
    expect(first).not.toContain('fill="##');
  });

  it("normalizes legacy colors that include a hash prefix", () => {
    const config = {
      seed: "user-123",
      backgroundColor: "c8bfe8",
      options: {
        skinColor: ["#89532c"],
        hairColor: ["#2c1b18"],
      },
    };

    const svg = generateUserAvatar(config as UserAvatarConfig);

    expect(svg).toContain('fill="#89532c"');
    expect(svg).toContain('fill="#2c1b18"');
    expect(svg).not.toContain('fill="##');
  });

  it("generates different SVG for different seeds", () => {
    const baseOptions: UserAvatarConfig["options"] = {
      hair: ["short01"],
      eyes: ["variant01"],
    };

    const first = generateUserAvatar({
      seed: "seed-a",
      backgroundColor: "c8bfe8",
      options: baseOptions,
    });
    const second = generateUserAvatar({
      seed: "seed-b",
      backgroundColor: "c8bfe8",
      options: baseOptions,
    });

    expect(first).not.toBe(second);
  });
});
