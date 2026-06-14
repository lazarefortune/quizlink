"use client";

import { Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/i18n/use-locale";
import { cn } from "@/lib/utils";

type UnlockSoonButtonProps = {
  labelKey: string;
  ariaLabelKey: string;
  variant?: "default" | "outline";
  className?: string;
};

export function UnlockSoonButton({
  labelKey,
  ariaLabelKey,
  variant = "default",
  className,
}: UnlockSoonButtonProps) {
  const { locale } = useLocale();

  return (
    <div
      className={cn(
        "relative mx-auto w-full max-w-[min(100%,18rem)] pt-2 pr-1 sm:mx-0 sm:w-auto sm:max-w-none",
        className,
      )}
    >
      <Button
        type="button"
        variant={variant}
        size="sm"
        disabled
        className={cn(
          "h-auto min-h-9 w-full gap-1.5 whitespace-normal px-3 py-2.5 text-center leading-snug shadow-sm",
          variant === "outline" && "shadow-none",
          "sm:w-auto sm:whitespace-nowrap sm:py-2",
        )}
        aria-label={t(locale, ariaLabelKey)}
      >
        <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden />
        <span>{t(locale, labelKey)}</span>
      </Button>
      <span className="pointer-events-none absolute right-1 top-0 rounded-full bg-warning px-1.5 py-0.5 text-[10px] font-bold uppercase leading-none text-warning-foreground shadow-sm sm:right-0">
        {t(locale, "dashboard.soonBadge")}
      </span>
    </div>
  );
}
