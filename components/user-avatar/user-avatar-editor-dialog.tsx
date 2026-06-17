"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createAvatar } from "@dicebear/core";
import { bigEars } from "@dicebear/collection";
import { Shuffle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { updateUserAvatarAction } from "@/app/(app)/account/actions";
import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";
import { toCssHexColor } from "@/lib/user-avatar/avatarColorUtils";
import {
  AVATAR_EDITOR_CATEGORIES,
  type AvatarEditorCategoryId,
  type AvatarEditorVariantCategory,
} from "@/lib/user-avatar/avatarEditorCategories";
import {
  buildVariantSelectionPatch,
  getSelectedVariantValue,
} from "@/lib/user-avatar/avatarVariantSelection";
import { DEFAULT_AVATAR_BACKGROUND_COLOR } from "@/lib/user-avatar/bigEarsOptionValues";
import { createRandomAvatarSeed } from "@/lib/user-avatar/createRandomAvatarSeed";
import {
  createRandomUserAvatarBackgroundColor,
  createRandomUserAvatarOptions,
} from "@/lib/user-avatar/createRandomUserAvatarOptions";
import { createDefaultUserAvatarConfig } from "@/lib/user-avatar/defaultUserAvatarConfig";
import { toDiceBearAvatarOptions } from "@/lib/user-avatar/toDiceBearAvatarOptions";
import {
  deserializeUserAvatarConfig,
  type UserAvatarConfig,
  type UserAvatarOptions,
} from "@/lib/user-avatar/userAvatarConfigSchema";

import { AvatarSvgDisplay } from "./avatar-svg-display";
import { UserAvatarEditorColorGrid } from "./user-avatar-editor-color-grid";
import { UserAvatarEditorVariantGrid } from "./user-avatar-editor-variant-grid";

type UserAvatarEditorDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  initialAvatarConfig: string | null;
};

function generateAvatarSvg(config: UserAvatarConfig): string {
  return createAvatar(bigEars, {
    seed: config.seed,
    ...toDiceBearAvatarOptions(config.options),
  }).toString();
}

function getSelectedColorValue(
  options: UserAvatarOptions,
  key: "skinColor" | "hairColor",
): string | undefined {
  const value = options[key];
  if (!Array.isArray(value) || value.length === 0) {
    return undefined;
  }
  return String(value[0]);
}

export function UserAvatarEditorDialog({
  open,
  onOpenChange,
  userId,
  initialAvatarConfig,
}: UserAvatarEditorDialogProps) {
  const { locale } = useLocale();
  const toast = useToast();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [activeCategoryId, setActiveCategoryId] =
    useState<AvatarEditorCategoryId>("skin");

  const initialConfig = useMemo(() => {
    return (
      deserializeUserAvatarConfig(initialAvatarConfig) ??
      createDefaultUserAvatarConfig(userId)
    );
  }, [initialAvatarConfig, userId]);

  const [config, setConfig] = useState<UserAvatarConfig>(initialConfig);

  useEffect(() => {
    if (open) {
      setConfig(initialConfig);
      setActiveCategoryId("skin");
    }
  }, [open, initialConfig]);

  const previewSvg = useMemo(() => generateAvatarSvg(config), [config]);

  const activeCategory = AVATAR_EDITOR_CATEGORIES.find(
    (category) => category.id === activeCategoryId,
  );

  const updateOptions = (patch: Partial<UserAvatarOptions>) => {
    setConfig((current) => ({
      ...current,
      options: { ...current.options, ...patch },
    }));
  };

  const handleVariantSelect = (
    category: AvatarEditorVariantCategory,
    value: string,
  ) => {
    updateOptions(buildVariantSelectionPatch(category, value));
  };

  const handleRandomize = useCallback(() => {
    setConfig({
      seed: createRandomAvatarSeed(),
      backgroundColor: createRandomUserAvatarBackgroundColor(),
      options: createRandomUserAvatarOptions(),
    });
  }, []);

  const handleCategorySelect = (categoryId: AvatarEditorCategoryId) => {
    if (categoryId === "random") {
      handleRandomize();
    }
    setActiveCategoryId(categoryId);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const result = await updateUserAvatarAction(config);
      if (result.success) {
        toast.showToast(t(locale, "account.avatar.saveSuccess"), "success");
        onOpenChange(false);
        router.refresh();
        return;
      }

      toast.showToast(
        result.error || t(locale, "account.avatar.saveError"),
        "error",
      );
    } catch {
      toast.showToast(t(locale, "account.avatar.saveError"), "error");
    } finally {
      setIsSaving(false);
    }
  };

  const selectedBackgroundColor =
    config.backgroundColor ?? DEFAULT_AVATAR_BACKGROUND_COLOR;

  const categoryLabel =
    activeCategory && activeCategory.type !== "random"
      ? t(locale, activeCategory.labelKey)
      : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90dvh] max-w-3xl flex-col gap-0 overflow-hidden rounded-3xl p-0 sm:max-w-5xl">
        <DialogHeader className="shrink-0 border-b border-border px-5 py-4 sm:px-6">
          <DialogTitle className="text-left text-lg sm:text-xl">
            {t(locale, "account.avatar.editorTitle")}
          </DialogTitle>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:min-h-[min(70vh,560px)] lg:flex-row">
          <div
            className="flex w-full shrink-0 items-center justify-center border-b border-border px-6 py-6 lg:w-[38%] lg:border-b-0 lg:border-r lg:py-8"
            style={{ backgroundColor: toCssHexColor(selectedBackgroundColor) }}
          >
            <div
              className="aspect-square w-full max-w-[220px] overflow-hidden rounded-3xl shadow-inner sm:max-w-[260px] lg:max-w-[300px]"
              style={{
                backgroundColor: toCssHexColor(selectedBackgroundColor),
                filter: "brightness(0.92)",
              }}
            >
              <AvatarSvgDisplay svg={previewSvg} className="h-full w-full" />
            </div>
          </div>

          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            <div className="flex shrink-0 overflow-x-auto border-b border-border scrollbar-none">
              {AVATAR_EDITOR_CATEGORIES.map((category) => {
                const Icon = category.icon;
                const isActive = activeCategoryId === category.id;
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => handleCategorySelect(category.id)}
                    className={[
                      "flex min-w-[3.25rem] shrink-0 flex-col items-center gap-1 border-b-4 px-3 py-3 transition-colors sm:min-w-[3.5rem]",
                      isActive
                        ? "border-blue text-blue"
                        : "border-transparent text-muted-foreground hover:text-foreground",
                    ].join(" ")}
                    aria-label={t(locale, category.labelKey)}
                    aria-pressed={isActive}
                  >
                    <Icon className="h-5 w-5" strokeWidth={2.25} />
                  </button>
                );
              })}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
              {activeCategory?.type !== "random" ? (
                <p className="mb-4 text-sm font-bold uppercase tracking-wide text-muted-foreground">
                  {categoryLabel}
                </p>
              ) : null}

              {activeCategory?.type === "color" ? (
                <UserAvatarEditorColorGrid
                  colors={activeCategory.options}
                  selectedColor={
                    activeCategory.colorTarget === "backgroundColor"
                      ? selectedBackgroundColor
                      : getSelectedColorValue(
                          config.options,
                          activeCategory.colorTarget,
                        )
                  }
                  onSelect={(color) => {
                    if (activeCategory.colorTarget === "backgroundColor") {
                      setConfig((current) => ({
                        ...current,
                        backgroundColor: color,
                      }));
                      return;
                    }
                    updateOptions({ [activeCategory.colorTarget]: [color] });
                  }}
                />
              ) : null}

              {activeCategory?.type === "variant" ? (
                <UserAvatarEditorVariantGrid
                  config={config}
                  optionKey={activeCategory.optionKey}
                  options={activeCategory.options}
                  allowDisable={activeCategory.allowDisable}
                  selectedValue={getSelectedVariantValue(
                    config.options,
                    activeCategory,
                  )}
                  onSelect={(value) => handleVariantSelect(activeCategory, value)}
                />
              ) : null}

              {activeCategory?.type === "random" ? (
                <div className="flex flex-col items-center justify-center gap-4 py-8 text-center">
                  <p className="max-w-xs text-sm text-muted-foreground">
                    {t(locale, "account.avatar.randomizeHint")}
                  </p>
                  <Button
                    type="button"
                    variant="blue"
                    size="lg"
                    onClick={handleRandomize}
                    className="rounded-2xl px-8 font-black uppercase tracking-wide"
                  >
                    <Shuffle className="mr-2 h-5 w-5" />
                    {t(locale, "account.avatar.randomize")}
                  </Button>
                </div>
              ) : null}
            </div>

            <div className="shrink-0 border-t border-border bg-background px-5 py-4 sm:px-6">
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="blue"
                  size="lg"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="min-w-[140px] rounded-2xl font-black uppercase tracking-wide"
                >
                  {isSaving
                    ? t(locale, "account.avatar.saving")
                    : t(locale, "account.avatar.done")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
