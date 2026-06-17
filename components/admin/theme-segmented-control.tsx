"use client";

import { useEffect, useState } from "react";
import { MonitorCog, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { cn } from "@/lib/utils";

type ThemeMode = "light" | "dark" | "system";

const modes: Array<{ value: ThemeMode; icon: typeof Sun; labelFr: string; labelEn: string }> = [
  { value: "light", icon: Sun, labelFr: "Clair", labelEn: "Light" },
  { value: "dark", icon: Moon, labelFr: "Sombre", labelEn: "Dark" },
  { value: "system", icon: MonitorCog, labelFr: "Système", labelEn: "System" },
];

type ThemeSegmentedControlProps = {
  locale: string;
  className?: string;
};

export function ThemeSegmentedControl({ locale, className }: ThemeSegmentedControlProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-0.5 rounded-full bg-muted p-1 dark:bg-zinc-900",
          className
        )}
      >
        {modes.map(({ value, icon: Icon }) => (
          <button
            key={value}
            type="button"
            disabled
            className="flex size-8 items-center justify-center rounded-full text-muted-foreground opacity-60"
          >
            <Icon className="size-4" />
          </button>
        ))}
      </div>
    );
  }

  return (
    <div
      role="radiogroup"
      aria-label={locale === "fr" ? "Thème d'affichage" : "Display theme"}
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full bg-muted p-1 dark:bg-zinc-900",
        className
      )}
    >
      {modes.map(({ value, icon: Icon, labelFr, labelEn }) => {
        const isActive = theme === value;
        const label = locale === "fr" ? labelFr : labelEn;

        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-label={label}
            title={label}
            onClick={() => setTheme(value)}
            className={cn(
              "relative flex size-8 items-center justify-center rounded-full transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              isActive
                ? "bg-background text-foreground shadow-sm dark:bg-zinc-800 dark:text-zinc-100"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="size-4 shrink-0" aria-hidden />
          </button>
        );
      })}
    </div>
  );
}
