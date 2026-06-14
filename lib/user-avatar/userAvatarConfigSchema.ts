import { z } from "zod";

import {
  AVATAR_BACKGROUND_COLORS,
  BIG_EARS_CHEEK_VARIANTS,
  BIG_EARS_EAR_VARIANTS,
  BIG_EARS_EYES_VARIANTS,
  BIG_EARS_FACE_VARIANTS,
  BIG_EARS_FRONT_HAIR_VARIANTS,
  BIG_EARS_HAIR_COLORS,
  BIG_EARS_HAIR_VARIANTS,
  BIG_EARS_MOUTH_VARIANTS,
  BIG_EARS_NOSE_VARIANTS,
  BIG_EARS_SIDEBURN_VARIANTS,
  BIG_EARS_SKIN_COLORS,
  DEFAULT_AVATAR_BACKGROUND_COLOR,
} from "./bigEarsOptionValues";
import { normalizeDiceBearHexColor, isValidDiceBearHexColor } from "./avatarColorUtils";
import { normalizeUserAvatarOptions } from "./normalizeUserAvatarOptions";

const diceBearHexColor = z
  .string()
  .transform((value) => normalizeDiceBearHexColor(value))
  .refine(isValidDiceBearHexColor, { message: "Invalid hex color" });

const variantArray = <T extends readonly [string, ...string[]]>(values: T) =>
  z.array(z.enum(values)).optional();

const diceBearColorArray = <T extends readonly [string, ...string[]]>(values: T) =>
  z
    .array(diceBearHexColor)
    .refine((colors) => colors.every((color) => values.includes(color as T[number])), {
      message: "Color not in allowed palette",
    })
    .optional();

export const userAvatarOptionsSchema = z
  .object({
    hair: variantArray(BIG_EARS_HAIR_VARIANTS),
    face: variantArray(BIG_EARS_FACE_VARIANTS),
    mouth: variantArray(BIG_EARS_MOUTH_VARIANTS),
    ear: variantArray(BIG_EARS_EAR_VARIANTS),
    eyes: variantArray(BIG_EARS_EYES_VARIANTS),
    cheek: variantArray(BIG_EARS_CHEEK_VARIANTS),
    cheekProbability: z.number().min(0).max(100).optional(),
    nose: variantArray(BIG_EARS_NOSE_VARIANTS),
    sideburn: variantArray(BIG_EARS_SIDEBURN_VARIANTS),
    frontHair: variantArray(BIG_EARS_FRONT_HAIR_VARIANTS),
    hairColor: diceBearColorArray(BIG_EARS_HAIR_COLORS),
    skinColor: diceBearColorArray(BIG_EARS_SKIN_COLORS),
  })
  .strict();

export const userAvatarConfigSchema = z.object({
  seed: z.string().trim().min(1).max(64),
  backgroundColor: diceBearHexColor
    .refine(
      (color) =>
        AVATAR_BACKGROUND_COLORS.includes(
          color as (typeof AVATAR_BACKGROUND_COLORS)[number],
        ),
      { message: "Background color not in allowed palette" },
    )
    .default(DEFAULT_AVATAR_BACKGROUND_COLOR),
  options: userAvatarOptionsSchema.default({}),
});

export type UserAvatarConfig = z.infer<typeof userAvatarConfigSchema>;
export type UserAvatarOptions = z.infer<typeof userAvatarOptionsSchema>;

export function parseUserAvatarConfig(value: unknown): UserAvatarConfig | null {
  const parsed = userAvatarConfigSchema.safeParse(value);
  if (!parsed.success) {
    return null;
  }

  return {
    ...parsed.data,
    options: normalizeUserAvatarOptions(parsed.data.options),
  };
}

export function serializeUserAvatarConfig(config: UserAvatarConfig): string {
  const normalized = parseUserAvatarConfig(config) ?? config;
  return JSON.stringify(normalized);
}

export function deserializeUserAvatarConfig(
  value: string | null | undefined,
): UserAvatarConfig | null {
  if (!value) {
    return null;
  }

  try {
    return parseUserAvatarConfig(JSON.parse(value));
  } catch {
    return null;
  }
}
