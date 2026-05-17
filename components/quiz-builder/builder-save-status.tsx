"use client";

import { Archive, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import type { BuilderSaveStatusDisplayKind } from "@/lib/builder/builderSaveStatusDisplay";
import { shouldShowBuilderSaveStatusRow } from "@/lib/builder/builderSaveStatusRowVisibility";

type BuilderSaveStatusProps = {
  locale: Locale;
  kind: BuilderSaveStatusDisplayKind;
  isLoading: boolean;
};

function messageKeyForKind(
  kind: Extract<BuilderSaveStatusDisplayKind, "local_draft" | "archived_readonly">,
): string {
  switch (kind) {
    case "local_draft":
      return "builder.saveStatus.localCopy";
    case "archived_readonly":
      return "builder.saveStatus.archived";
  }
}

function StatusIcon({
  kind,
  className,
}: {
  kind: Extract<BuilderSaveStatusDisplayKind, "local_draft" | "archived_readonly">;
  className?: string;
}) {
  const iconClass = cn("h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4", className);
  switch (kind) {
    case "local_draft":
      return <Smartphone className={iconClass} aria-hidden />;
    case "archived_readonly":
      return <Archive className={cn(iconClass, "text-muted-foreground")} aria-hidden />;
  }
}

export function BuilderSaveStatus({ locale, kind, isLoading }: BuilderSaveStatusProps) {
  if (isLoading || !shouldShowBuilderSaveStatusRow(kind)) {
    return null;
  }

  if (kind !== "local_draft" && kind !== "archived_readonly") {
    return null;
  }

  const primaryKey = messageKeyForKind(kind);

  return (
    <div
      className="w-full rounded-md border border-border/50 bg-muted/20 px-2.5 py-2 sm:max-w-md sm:border-0 sm:bg-transparent sm:px-0 sm:py-0"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center justify-end gap-2">
        <StatusIcon kind={kind} />
        <p className="text-xs font-medium leading-snug text-foreground/90 sm:text-sm">
          {t(locale, primaryKey)}
        </p>
      </div>
    </div>
  );
}
