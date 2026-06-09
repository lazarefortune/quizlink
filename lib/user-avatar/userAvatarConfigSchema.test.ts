import { describe, expect, it } from "vitest";

import {
  deserializeUserAvatarConfig,
  parseUserAvatarConfig,
  serializeUserAvatarConfig,
  userAvatarConfigSchema,
} from "./userAvatarConfigSchema";

describe("userAvatarConfigSchema", () => {
  it("accepts a valid config", () => {
    const config = {
      seed: "user-1",
      backgroundColor: "c8bfe8",
      options: {
        hair: ["short05"],
        eyes: ["variant04"],
        skinColor: ["f8b788"],
      },
    };

    const parsed = userAvatarConfigSchema.safeParse(config);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.options.skinColor).toEqual(["f8b788"]);
    }
  });

  it("normalizes legacy colors with hash prefix", () => {
    const config = {
      seed: "user-1",
      options: {
        skinColor: ["#da9969"],
        hairColor: ["#2c1b18"],
      },
    };

    const parsed = parseUserAvatarConfig(config);
    expect(parsed?.options.skinColor).toEqual(["da9969"]);
    expect(parsed?.options.hairColor).toEqual(["2c1b18"]);
  });

  it("accepts empty optional variant arrays", () => {
    const config = {
      seed: "user-1",
      options: {
        sideburn: [],
        frontHair: [],
      },
    };

    expect(userAvatarConfigSchema.safeParse(config).success).toBe(true);
  });

  it("rejects invalid hair variant", () => {
    const config = {
      seed: "user-1",
      options: {
        hair: ["invalid-hair"],
      },
    };

    expect(userAvatarConfigSchema.safeParse(config).success).toBe(false);
  });

  it("rejects colors outside the allowed palette", () => {
    const config = {
      seed: "user-1",
      options: {
        skinColor: ["ffffff"],
      },
    };

    expect(userAvatarConfigSchema.safeParse(config).success).toBe(false);
  });

  it("rejects unknown option keys", () => {
    const config = {
      seed: "user-1",
      options: {
        svg: "<svg></svg>",
      },
    };

    expect(userAvatarConfigSchema.safeParse(config).success).toBe(false);
  });

  it("rejects empty seed", () => {
    const config = {
      seed: "",
      options: {},
    };

    expect(userAvatarConfigSchema.safeParse(config).success).toBe(false);
  });
});

describe("serializeUserAvatarConfig / deserializeUserAvatarConfig", () => {
  it("round-trips a valid config", () => {
    const config = {
      seed: "user-42",
      backgroundColor: "ddd6f3",
      options: { mouth: ["variant0201"] },
    };

    const serialized = serializeUserAvatarConfig(config);
    const parsed = deserializeUserAvatarConfig(serialized);

    expect(parsed).toEqual(config);
    expect(parseUserAvatarConfig(config)).toEqual(config);
  });

  it("returns null for invalid JSON", () => {
    expect(deserializeUserAvatarConfig("{not-json")).toBeNull();
  });
});
