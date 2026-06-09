"use client";

import { useMemo } from "react";
import { createAvatar } from "@dicebear/core";
import { bigEars } from "@dicebear/collection";
import { Ban } from "lucide-react";

import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";
import { DISABLED_AVATAR_VARIANT } from "@/lib/user-avatar/avatarVariantSelection";
import { toDiceBearAvatarOptions } from "@/lib/user-avatar/toDiceBearAvatarOptions";
import type { UserAvatarConfig, UserAvatarOptions } from "@/lib/user-avatar/userAvatarConfigSchema";

import { AvatarSvgDisplay } from "./avatar-svg-display";

type UserAvatarEditorVariantGridProps = {
  config: UserAvatarConfig;
  optionKey: keyof UserAvatarOptions;
  options: readonly string[];
  selectedValue: string | undefined;
  allowDisable?: boolean;
  onSelect: (value: string) => void;
};

function generateAvatarSvg(
  seed: string,
  options: UserAvatarOptions,
): string {
  return createAvatar(bigEars, {
    seed,
    ...toDiceBearAvatarOptions(options),
  }).toString();
}

export function UserAvatarEditorVariantGrid({
  config,
  optionKey,
  options,
  selectedValue,
  allowDisable = false,
  onSelect,
}: UserAvatarEditorVariantGridProps) {
  const { locale } = useLocale();

  const thumbnails = useMemo(() => {
    return options.map((value) => {
      const previewOptions: UserAvatarOptions = {
        ...config.options,
        [optionKey]: [value],
      };

      return {
        value,
        svg: generateAvatarSvg(config.seed, previewOptions),
      };
    });
  }, [config.options, config.seed, optionKey, options]);

  const isNoneSelected = selectedValue === DISABLED_AVATAR_VARIANT;

  return (
    <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-6">
      {allowDisable ? (
        <button
          type="button"
          onClick={() => onSelect(DISABLED_AVATAR_VARIANT)}
          className={[
            "flex aspect-square flex-col items-center justify-center gap-1 overflow-hidden rounded-xl border-4 border-dashed bg-muted/20 text-muted-foreground transition-transform hover:scale-105",
            isNoneSelected
              ? "border-blue text-blue ring-2 ring-blue/30"
              : "border-border hover:border-muted-foreground/50",
          ].join(" ")}
          aria-pressed={isNoneSelected}
          title={t(locale, "account.avatar.none")}
        >
          <Ban className="h-6 w-6" strokeWidth={2.25} />
          <span className="text-[10px] font-bold uppercase tracking-wide">
            {t(locale, "account.avatar.none")}
          </span>
        </button>
      ) : null}

      {thumbnails.map(({ value, svg }) => {
        const isSelected = selectedValue === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => onSelect(value)}
            className={[
              "aspect-square overflow-hidden rounded-xl border-4 bg-muted/40 transition-transform hover:scale-105",
              isSelected
                ? "border-blue ring-2 ring-blue/30"
                : "border-transparent hover:border-border",
            ].join(" ")}
            aria-pressed={isSelected}
            title={value}
          >
            <AvatarSvgDisplay svg={svg} className="h-full w-full p-0.5" />
          </button>
        );
      })}
    </div>
  );
}
