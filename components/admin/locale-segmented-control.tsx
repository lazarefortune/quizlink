"use client";

import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const locales: Array<{
  value: Locale;
  shortLabel: string;
  labelFr: string;
  labelEn: string;
}> = [
  { value: "fr", shortLabel: "FR", labelFr: "Français", labelEn: "French" },
  { value: "en", shortLabel: "EN", labelFr: "Anglais", labelEn: "English" },
];

type LocaleSegmentedControlProps = {
  locale: Locale;
  onLocaleChange: (locale: Locale) => void;
  className?: string;
};

export function LocaleSegmentedControl({
  locale,
  onLocaleChange,
  className,
}: LocaleSegmentedControlProps) {
  const ariaLabel = locale === "fr" ? "Langue de l'interface" : "Interface language";

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full bg-muted p-1 dark:bg-zinc-900",
        className,
      )}
    >
      {locales.map(({ value, shortLabel, labelFr, labelEn }) => {
        const isActive = locale === value;
        const label = locale === "fr" ? labelFr : labelEn;

        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-label={label}
            title={label}
            onClick={() => onLocaleChange(value)}
            className={cn(
              "relative flex h-8 min-w-10 items-center justify-center rounded-full px-2.5 text-xs font-bold tracking-wide transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              isActive
                ? "bg-background text-foreground shadow-sm dark:bg-zinc-800 dark:text-zinc-100"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {shortLabel}
          </button>
        );
      })}
    </div>
  );
}
