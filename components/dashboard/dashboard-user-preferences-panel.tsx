"use client";

import { LocaleSegmentedControl } from "@/components/admin/locale-segmented-control";
import { ThemeSegmentedControl } from "@/components/admin/theme-segmented-control";
import { t } from "@/lib/i18n";
import { usePersistLocalePreference } from "@/lib/i18n/use-persist-locale-preference";
import { cn } from "@/lib/utils";

type DashboardUserPreferencesPanelProps = {
  className?: string;
  /** Dropdown user menu vs mobile sheet label styling */
  variant?: "dropdown" | "sheet";
};

export function DashboardUserPreferencesPanel({
  className,
  variant = "dropdown",
}: DashboardUserPreferencesPanelProps) {
  const { locale, setLocale } = usePersistLocalePreference();

  const labelClassName =
    variant === "sheet"
      ? "mb-2 px-1 text-xs font-bold uppercase tracking-wide text-muted-foreground"
      : "mb-2 text-base font-medium text-muted-foreground";

  return (
    <div
      className={cn("space-y-3", variant === "dropdown" ? "px-2 py-2" : undefined, className)}
    >
      <div>
        <p className={labelClassName}>{t(locale, "userMenu.theme")}</p>
        <ThemeSegmentedControl locale={locale} />
      </div>
      <div>
        <p className={labelClassName}>{t(locale, "userMenu.language")}</p>
        <LocaleSegmentedControl locale={locale} onLocaleChange={setLocale} />
      </div>
    </div>
  );
}
