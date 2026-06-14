import { describe, expect, it } from "vitest";

import { generateUserAvatar } from "./generateUserAvatar";
import { toDiceBearAvatarOptions } from "./toDiceBearAvatarOptions";

describe("toDiceBearAvatarOptions", () => {
  it("omits undefined color keys", () => {
    expect(toDiceBearAvatarOptions({})).toEqual({});
    expect(toDiceBearAvatarOptions({ hair: ["short01"] })).toEqual({
      hair: ["short01"],
    });
  });

  it("still generates valid SVG when options are empty", () => {
    const svg = generateUserAvatar({
      seed: "user-123",
      backgroundColor: "c8bfe8",
      options: {},
    });

    expect(svg).toContain("<svg");
    expect(svg).toContain('viewBox="0 0 440 440"');
  });
});
