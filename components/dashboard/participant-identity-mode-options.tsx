"use client";

import { Check, Loader2 } from "lucide-react";
import type { CSSProperties } from "react";

import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import { PARTICIPANT_IDENTITY_MODE_OPTIONS } from "@/lib/dashboard/participant-identity-mode-meta";
import { cn } from "@/lib/utils";
import type { ParticipantIdentityMode } from "@/types/participant-identity";

type ParticipantIdentityModeOptionsProps = {
  value: ParticipantIdentityMode;
  locale: Locale;
  onSelect: (mode: ParticipantIdentityMode) => void;
  pendingMode?: ParticipantIdentityMode | null;
  disabled?: boolean;
  descriptionVariant?: "full" | "short";
  ariaLabel: string;
};

function getPlayfulColorStyle(
  softCssVar: string,
  solidCssVar: string,
  isSelected: boolean,
): CSSProperties {
  return {
    borderColor: isSelected ? `var(${solidCssVar})` : undefined,
    backgroundColor: isSelected
      ? `color-mix(in srgb, var(${softCssVar}) 18%, transparent)`
      : undefined,
  };
}

export function ParticipantIdentityModeOptions({
  value,
  locale,
  onSelect,
  pendingMode = null,
  disabled = false,
  descriptionVariant = "full",
  ariaLabel,
}: ParticipantIdentityModeOptionsProps) {
  const isBusy = pendingMode !== null;

  return (
    <div role="radiogroup" aria-label={ariaLabel} className="grid gap-3">
      {PARTICIPANT_IDENTITY_MODE_OPTIONS.map((option) => {
        const isSelected = value === option.mode;
        const isLoading = pendingMode === option.mode;
        const Icon = option.icon;
        const descriptionKey =
          descriptionVariant === "short" ? option.shortDescriptionKey : option.descriptionKey;
        const colorStyle = getPlayfulColorStyle(
          option.playfulColors.softCssVar,
          option.playfulColors.solidCssVar,
          isSelected,
        );

        return (
          <button
            key={option.mode}
            type="button"
            role="radio"
            aria-checked={isSelected}
            disabled={disabled || (isBusy && !isLoading)}
            onClick={() => onSelect(option.mode)}
            style={colorStyle}
            className={cn(
              "relative flex w-full flex-col items-start gap-2 rounded-2xl border-2 px-4 py-3 text-left transition-colors",
              "outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
              isSelected ? "shadow-sm" : "border-border bg-card hover:bg-muted/30",
              (disabled || (isBusy && !isLoading)) && "pointer-events-none opacity-60",
            )}
          >
            {isSelected ? (
              <span
                className="absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-full"
                style={{ backgroundColor: `var(${option.playfulColors.solidCssVar})` }}
                aria-hidden
              >
                <Check className="h-3 w-3 text-white" strokeWidth={3} />
              </span>
            ) : null}

            <div className="flex w-full items-start gap-3 pr-6">
              <span
                className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
                style={{
                  backgroundColor: `color-mix(in srgb, var(${option.playfulColors.softCssVar}) 35%, transparent)`,
                }}
              >
                {isLoading ? (
                  <Loader2
                    className="h-5 w-5 animate-spin"
                    style={{ color: `var(${option.playfulColors.solidCssVar})` }}
                    aria-hidden
                  />
                ) : (
                  <Icon className="h-6 w-6" />
                )}
              </span>
              <span className="min-w-0 flex-1 space-y-1">
                <span className="block text-lg text-zinc-700 dark:text-zinc-300 font-semibold text-foreground">
                  {t(locale, option.labelKey)}
                </span>
                <span className="block text-sm leading-relaxed text-muted-foreground">
                  {t(locale, descriptionKey)}
                </span>
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
