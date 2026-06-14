import type { LucideIcon } from "lucide-react";
import {
  Droplets,
  Ear,
  Eye,
  ImageIcon,
  Layers,
  Paintbrush,
  ScanFace,
  Scissors,
  Shuffle,
  Smile,
  Sparkles,
  Split,
  UserRound,
} from "lucide-react";

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
} from "./bigEarsOptionValues";
import type { UserAvatarOptions } from "./userAvatarConfigSchema";

export type AvatarEditorVariantCategory = {
  type: "variant";
  id: string;
  optionKey: keyof UserAvatarOptions;
  options: readonly string[];
  icon: LucideIcon;
  labelKey: string;
  /** Set cheekProbability to 100 when picking cheek variants. */
  forceFullProbability?: boolean;
  /** Shows a "none" tile to disable this optional layer. */
  allowDisable?: boolean;
  disableStrategy?: "emptyArray" | "cheekProbability";
};

export type AvatarEditorColorCategory = {
  type: "color";
  id: string;
  colorTarget: "skinColor" | "hairColor" | "backgroundColor";
  options: readonly string[];
  icon: LucideIcon;
  labelKey: string;
};

export type AvatarEditorRandomCategory = {
  type: "random";
  id: "random";
  icon: LucideIcon;
  labelKey: string;
};

export type AvatarEditorCategoryDefinition =
  | AvatarEditorVariantCategory
  | AvatarEditorColorCategory
  | AvatarEditorRandomCategory;

/** Mirrors DiceBear Big Ears playground — all component + color options. */
export const AVATAR_EDITOR_CATEGORIES: AvatarEditorCategoryDefinition[] = [
  {
    type: "variant",
    id: "cheek",
    optionKey: "cheek",
    options: BIG_EARS_CHEEK_VARIANTS,
    icon: Sparkles,
    labelKey: "account.avatar.categories.cheek",
    forceFullProbability: true,
    allowDisable: true,
    disableStrategy: "cheekProbability",
  },
  {
    type: "variant",
    id: "ear",
    optionKey: "ear",
    options: BIG_EARS_EAR_VARIANTS,
    icon: Ear,
    labelKey: "account.avatar.categories.ear",
  },
  {
    type: "variant",
    id: "eyes",
    optionKey: "eyes",
    options: BIG_EARS_EYES_VARIANTS,
    icon: Eye,
    labelKey: "account.avatar.categories.eyes",
  },
  {
    type: "variant",
    id: "frontHair",
    optionKey: "frontHair",
    options: BIG_EARS_FRONT_HAIR_VARIANTS,
    icon: Layers,
    labelKey: "account.avatar.categories.frontHair",
    allowDisable: true,
    disableStrategy: "emptyArray",
  },
  {
    type: "variant",
    id: "hair",
    optionKey: "hair",
    options: BIG_EARS_HAIR_VARIANTS,
    icon: Scissors,
    labelKey: "account.avatar.categories.hair",
  },
  {
    type: "variant",
    id: "face",
    optionKey: "face",
    options: BIG_EARS_FACE_VARIANTS,
    icon: UserRound,
    labelKey: "account.avatar.categories.face",
  },
  {
    type: "variant",
    id: "mouth",
    optionKey: "mouth",
    options: BIG_EARS_MOUTH_VARIANTS,
    icon: Smile,
    labelKey: "account.avatar.categories.mouth",
  },
  {
    type: "variant",
    id: "nose",
    optionKey: "nose",
    options: BIG_EARS_NOSE_VARIANTS,
    icon: ScanFace,
    labelKey: "account.avatar.categories.nose",
  },
  {
    type: "variant",
    id: "sideburn",
    optionKey: "sideburn",
    options: BIG_EARS_SIDEBURN_VARIANTS,
    icon: Split,
    labelKey: "account.avatar.categories.sideburn",
    allowDisable: true,
    disableStrategy: "emptyArray",
  },
  {
    type: "color",
    id: "skin",
    colorTarget: "skinColor",
    options: BIG_EARS_SKIN_COLORS,
    icon: Droplets,
    labelKey: "account.avatar.categories.skin",
  },
  {
    type: "color",
    id: "hairColor",
    colorTarget: "hairColor",
    options: BIG_EARS_HAIR_COLORS,
    icon: Paintbrush,
    labelKey: "account.avatar.categories.hairColor",
  },
  {
    type: "color",
    id: "background",
    colorTarget: "backgroundColor",
    options: AVATAR_BACKGROUND_COLORS,
    icon: ImageIcon,
    labelKey: "account.avatar.categories.background",
  },
  {
    type: "random",
    id: "random",
    icon: Shuffle,
    labelKey: "account.avatar.categories.random",
  },
];

export type AvatarEditorCategoryId =
  (typeof AVATAR_EDITOR_CATEGORIES)[number]["id"];
