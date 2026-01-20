"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { Locale } from "./index";

const LOCALE_STORAGE_KEY = "quizlink-locale";

type LocaleContextType = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
};

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

export function LocaleProvider({ children }: { children: ReactNode }) {
  // Always start with "fr" to match server-side rendering
  const [locale, setLocaleState] = useState<Locale>("fr");
  const [isMounted, setIsMounted] = useState(false);

  // After mount, read from localStorage and update
  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
      const initialLocale = (stored === "en" || stored === "fr" ? stored : "fr") as Locale;
      if (initialLocale !== locale) {
        setLocaleState(initialLocale);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && isMounted) {
      localStorage.setItem(LOCALE_STORAGE_KEY, locale);
      document.documentElement.lang = locale;
    }
  }, [locale, isMounted]);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
  };

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (context === undefined) {
    throw new Error("useLocale must be used within a LocaleProvider");
  }
  return context;
}
