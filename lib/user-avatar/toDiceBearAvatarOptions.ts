import { normalizeUserAvatarOptions } from "./normalizeUserAvatarOptions";
import type { UserAvatarOptions } from "./userAvatarConfigSchema";

/** Strips undefined values before passing options to DiceBear. */
export function toDiceBearAvatarOptions(
  options: UserAvatarOptions,
): Record<string, string | number | string[]> {
  const normalized = normalizeUserAvatarOptions(options);
  const diceBearOptions: Record<string, string | number | string[]> = {};

  for (const [key, value] of Object.entries(normalized)) {
    if (value !== undefined) {
      diceBearOptions[key] = value;
    }
  }

  return diceBearOptions;
}
