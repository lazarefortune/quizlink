"use client";

import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function LocaleSwitcher() {
  const { locale, setLocale } = useLocale();

  return (
    <Select value={locale} onValueChange={(value) => setLocale(value as "fr" | "en")}>
      <SelectTrigger className="w-[120px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="fr">Français</SelectItem>
        <SelectItem value="en">English</SelectItem>
      </SelectContent>
    </Select>
  );
}
