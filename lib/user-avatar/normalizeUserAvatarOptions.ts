import { normalizeDiceBearHexColor } from "./avatarColorUtils";
import type { UserAvatarOptions } from "./userAvatarConfigSchema";

function normalizeColorArray(
  colors: string[] | undefined,
): string[] | undefined {
  if (!colors) {
    return undefined;
  }

  return colors.map((color) => normalizeDiceBearHexColor(color));
}

/** Ensures DiceBear color options use the format required by the library. */
export function normalizeUserAvatarOptions(
  options: UserAvatarOptions,
): UserAvatarOptions {
  return {
    ...options,
    skinColor: normalizeColorArray(options.skinColor),
    hairColor: normalizeColorArray(options.hairColor),
  };
}
