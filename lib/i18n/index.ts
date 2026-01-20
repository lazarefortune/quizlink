import { fr } from "./fr";
import { en } from "./en";

export type Locale = "fr" | "en";
export type TranslationKey = keyof typeof fr;

const translations = {
  fr,
  en,
} as const;

export function getTranslations(locale: Locale) {
  return translations[locale];
}

export function t(locale: Locale, key: string, params?: Record<string, string | number>): string {
  const keys = key.split(".");
  let value: any = translations[locale];

  for (const k of keys) {
    if (value && typeof value === "object" && k in value) {
      value = value[k as keyof typeof value];
    } else {
      return key;
    }
  }

  if (typeof value !== "string") {
    return key;
  }

  if (params) {
    return value.replace(/\{(\w+)\}/g, (match, paramKey) => {
      return params[paramKey]?.toString() || match;
    });
  }

  return value;
}
