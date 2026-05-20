"use client";

import { AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type BuilderSaveErrorReportBannerProps = {
  locale: Locale;
  onReportIssue: () => void;
  className?: string;
};

export function BuilderSaveErrorReportBanner({
  locale,
  onReportIssue,
  className,
}: BuilderSaveErrorReportBannerProps) {
  return (
    <div
      className={cn(
        "flex w-full flex-col gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex min-w-0 items-start gap-2">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden />
        <p className="text-sm text-muted-foreground">{t(locale, "builder.saveError")}</p>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full shrink-0 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive sm:w-auto"
        onClick={onReportIssue}
      >
        {t(locale, "support.reportIssue")}
      </Button>
    </div>
  );
}
