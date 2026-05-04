"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { CookieConsentValue } from "@/lib/cookie-consent/types";

export type CookieConsentContextValue = {
  isHydrated: boolean;
  consent: CookieConsentValue;
  updateConsent: (next: CookieConsentValue) => void;
  openConsentPanel: () => void;
  closeConsentPanel: () => void;
  isPanelOpen: boolean;
};

export const CookieConsentContext =
  createContext<CookieConsentContextValue | null>(null);

export function useCookieConsent(): CookieConsentContextValue {
  const ctx = useContext(CookieConsentContext);
  if (!ctx) {
    throw new Error(
      "useCookieConsent must be used within CookieConsentProvider",
    );
  }
  return ctx;
}

export function CookieConsentContextProvider({
  value,
  children,
}: {
  value: CookieConsentContextValue;
  children: ReactNode;
}) {
  return (
    <CookieConsentContext.Provider value={value}>
      {children}
    </CookieConsentContext.Provider>
  );
}
