import { describe, expect, it } from "vitest";

import type { AvatarEditorVariantCategory } from "./avatarEditorCategories";
import {
  buildVariantSelectionPatch,
  DISABLED_AVATAR_VARIANT,
  getSelectedVariantValue,
} from "./avatarVariantSelection";

const sideburnCategory: AvatarEditorVariantCategory = {
  type: "variant",
  id: "sideburn",
  optionKey: "sideburn",
  options: ["variant01"],
  icon: () => null,
  labelKey: "account.avatar.categories.sideburn",
  allowDisable: true,
  disableStrategy: "emptyArray",
};

const cheekCategory: AvatarEditorVariantCategory = {
  type: "variant",
  id: "cheek",
  optionKey: "cheek",
  options: ["variant01"],
  icon: () => null,
  labelKey: "account.avatar.categories.cheek",
  allowDisable: true,
  disableStrategy: "cheekProbability",
  forceFullProbability: true,
};

describe("avatarVariantSelection", () => {
  it("returns none when sideburn is explicitly disabled", () => {
    expect(
      getSelectedVariantValue({ sideburn: [] }, sideburnCategory),
    ).toBe(DISABLED_AVATAR_VARIANT);
  });

  it("builds an empty array patch when disabling sideburn", () => {
    expect(
      buildVariantSelectionPatch(sideburnCategory, DISABLED_AVATAR_VARIANT),
    ).toEqual({ sideburn: [] });
  });

  it("builds cheekProbability 0 when disabling cheek details", () => {
    expect(
      buildVariantSelectionPatch(cheekCategory, DISABLED_AVATAR_VARIANT),
    ).toEqual({ cheekProbability: 0 });
  });

  it("forces cheekProbability 100 when selecting a cheek variant", () => {
    expect(buildVariantSelectionPatch(cheekCategory, "variant03")).toEqual({
      cheek: ["variant03"],
      cheekProbability: 100,
    });
  });
});
