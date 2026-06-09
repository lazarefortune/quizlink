import type { AvatarEditorVariantCategory } from "./avatarEditorCategories";
import type { UserAvatarOptions } from "./userAvatarConfigSchema";

export const DISABLED_AVATAR_VARIANT = "__none__" as const;

export function getSelectedVariantValue(
  options: UserAvatarOptions,
  category: AvatarEditorVariantCategory,
): string | undefined {
  if (category.allowDisable) {
    if (category.disableStrategy === "cheekProbability") {
      if (options.cheekProbability === 0) {
        return DISABLED_AVATAR_VARIANT;
      }
    } else {
      const value = options[category.optionKey];
      if (Array.isArray(value) && value.length === 0) {
        return DISABLED_AVATAR_VARIANT;
      }
    }
  }

  const value = options[category.optionKey];
  if (!Array.isArray(value) || value.length === 0) {
    return undefined;
  }

  return String(value[0]);
}

export function buildVariantSelectionPatch(
  category: AvatarEditorVariantCategory,
  value: string,
): Partial<UserAvatarOptions> {
  if (value === DISABLED_AVATAR_VARIANT) {
    if (category.disableStrategy === "cheekProbability") {
      return { cheekProbability: 0 };
    }

    return { [category.optionKey]: [] } as Partial<UserAvatarOptions>;
  }

  const patch: Partial<UserAvatarOptions> = {
    [category.optionKey]: [value],
  } as Partial<UserAvatarOptions>;

  if (category.forceFullProbability && category.optionKey === "cheek") {
    patch.cheekProbability = 100;
  }

  return patch;
}
