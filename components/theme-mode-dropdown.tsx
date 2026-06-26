"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { MonitorCog, Moon02Icon, Sun03Icon } from "@hugeicons/core-free-icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type ThemeMode = "light" | "dark" | "system";

const themeModes: Array<{
  value: ThemeMode;
  icon: typeof Sun03Icon;
  labelFr: string;
  labelEn: string;
}> = [
  { value: "light", icon: Sun03Icon, labelFr: "Clair", labelEn: "Light" },
  { value: "dark", icon: Moon02Icon, labelFr: "Sombre", labelEn: "Dark" },
  { value: "system", icon: MonitorCog, labelFr: "Système", labelEn: "System" },
];

type ThemeModeDropdownProps = {
  locale: string;
  className?: string;
};

export function ThemeModeDropdown({ locale, className }: ThemeModeDropdownProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const menuLabel = locale === "fr" ? "Thème d'affichage" : "Display theme";
  const placeholderMode = themeModes[2];

  const resolvedTheme = (theme ?? "system") as ThemeMode;
  const activeMode =
    themeModes.find((mode) => mode.value === resolvedTheme) ?? placeholderMode;
  const activeLabel = locale === "fr" ? activeMode.labelFr : activeMode.labelEn;

  const TriggerIcon = mounted ? activeMode.icon : placeholderMode.icon;
  const triggerAriaLabel = mounted ? `${menuLabel}: ${activeLabel}` : menuLabel;
  const radioValue = mounted ? resolvedTheme : placeholderMode.value;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn("h-9 w-9 shrink-0 cursor-pointer", className)}
          aria-label={triggerAriaLabel}
          suppressHydrationWarning
        >
          <HugeiconsIcon icon={TriggerIcon} size={20} className="text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[10rem]">
        <DropdownMenuRadioGroup
          value={radioValue}
          onValueChange={(value) => setTheme(value as ThemeMode)}
        >
          {themeModes.map(({ value, icon: Icon, labelFr, labelEn }) => {
            const label = locale === "fr" ? labelFr : labelEn;

            return (
              <DropdownMenuRadioItem
                key={value}
                value={value}
                className="font-medium"
              >
                <span className="flex items-center gap-2">
                  <HugeiconsIcon icon={Icon} size={20} className="text-muted-foreground" />
                  {label}
                </span>
              </DropdownMenuRadioItem>
            );
          })}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
