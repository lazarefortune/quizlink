"use client";

import { useState } from "react";
import { Star } from "lucide-react";

import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";

const STAR_VALUES = [1, 2, 3, 4, 5] as const;

type StarRatingProps = {
  value: number | null;
  onChange: (value: number) => void;
  disabled?: boolean;
  id?: string;
};

export function StarRating({
  value,
  onChange,
  disabled = false,
  id = "user-feedback-rating",
}: StarRatingProps) {
  const { locale } = useLocale();
  const [hoveredValue, setHoveredValue] = useState<number | null>(null);

  const displayValue = hoveredValue ?? value;
  const labelText =
    displayValue !== null
      ? t(locale, `userFeedback.star.${displayValue}`)
      : "\u00a0";

  return (
    <div
      role="radiogroup"
      aria-labelledby={`${id}-label`}
      className="flex flex-col gap-1.5"
      onMouseLeave={() => setHoveredValue(null)}
    >
      <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
        {STAR_VALUES.map((starValue) => {
          const isSelected = displayValue !== null && starValue <= displayValue;
          const starLabel = t(locale, `userFeedback.star.${starValue}`);

          return (
            <button
              key={starValue}
              type="button"
              role="radio"
              aria-checked={value === starValue}
              aria-label={starLabel}
              disabled={disabled}
              className={cn(
                "inline-flex h-11 w-11 items-center justify-center rounded-lg transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:bg-muted",
              )}
              onMouseEnter={() => setHoveredValue(starValue)}
              onFocus={() => setHoveredValue(starValue)}
              onBlur={() => setHoveredValue(null)}
              onClick={() => onChange(starValue)}
              onKeyDown={(event) => {
                if (disabled) {
                  return;
                }

                if (event.key === "ArrowRight" || event.key === "ArrowUp") {
                  event.preventDefault();
                  onChange(Math.min(5, (value ?? 0) + 1));
                }

                if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
                  event.preventDefault();
                  onChange(Math.max(1, (value ?? 2) - 1));
                }
              }}
            >
              <Star
                className={cn(
                  "h-7 w-7 transition-colors",
                  isSelected
                    ? "fill-amber-400 text-amber-400"
                    : "text-muted-foreground",
                )}
                aria-hidden
              />
            </button>
          );
        })}
      </div>

      <div className="h-5 min-h-5 overflow-hidden" aria-hidden={displayValue === null}>
        <p
          className={cn(
            "text-sm leading-5 text-muted-foreground transition-opacity duration-150",
            displayValue !== null ? "opacity-100" : "opacity-0",
          )}
          aria-live="polite"
        >
          {labelText}
        </p>
      </div>
    </div>
  );
}
