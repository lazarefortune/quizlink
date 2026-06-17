"use client";

import { useCallback } from "react";
import { useSession } from "next-auth/react";

import { updatePreferredLanguage } from "@/app/(app)/account/actions";

import type { Locale } from "./index";
import { useLocale } from "./use-locale";

export function usePersistLocalePreference() {
  const { locale, setLocale } = useLocale();
  const { data: session } = useSession();

  const setLocaleWithPersistence = useCallback(
    (newLocale: Locale) => {
      setLocale(newLocale);
      if (session?.user?.id) {
        void updatePreferredLanguage(newLocale);
      }
    },
    [session?.user?.id, setLocale],
  );

  return { locale, setLocale: setLocaleWithPersistence };
}
