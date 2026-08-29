"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  defaultPendingConsent,
  readConsentFromStorage,
  writeConsentToStorage,
  syncConsentMirrorCookie,
} from "@/lib/cookie-consent/consent-storage";
import type { CookieConsentValue } from "@/lib/cookie-consent/types";
import { CookieConsentBanner } from "./CookieConsentBanner";
import { CookieConsentPanel } from "./CookieConsentPanel";
import { CookieConsentContextProvider } from "./cookie-consent-context";

export { useCookieConsent } from "./cookie-consent-context";

export function CookieConsentProvider({ children }: { children: ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [consent, setConsent] = useState<CookieConsentValue>(
    defaultPendingConsent,
  );
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  useEffect(() => {
    const stored = readConsentFromStorage();
    if (stored === null) {
      setConsent(defaultPendingConsent());
      syncConsentMirrorCookie(defaultPendingConsent());
    } else {
      setConsent(stored);
      syncConsentMirrorCookie(stored);
    }
    setIsHydrated(true);
  }, []);

  const updateConsent = useCallback((next: CookieConsentValue) => {
    const normalized: CookieConsentValue = {
      hasRecordedChoice: next.hasRecordedChoice,
      analytics: next.analytics,
      sessionReplay: next.analytics ? next.sessionReplay : false,
    };
    setConsent(normalized);
    if (normalized.hasRecordedChoice) {
      writeConsentToStorage(normalized);
    }
  }, []);

  const openConsentPanel = useCallback(() => {
    setIsPanelOpen(true);
  }, []);

  const closeConsentPanel = useCallback(() => {
    setIsPanelOpen(false);
  }, []);

  const value = useMemo(
    () => ({
      isHydrated,
      consent,
      updateConsent,
      openConsentPanel,
      closeConsentPanel,
      isPanelOpen,
    }),
    [
      isHydrated,
      consent,
      updateConsent,
      openConsentPanel,
      closeConsentPanel,
      isPanelOpen,
    ],
  );

  return (
    <CookieConsentContextProvider value={value}>
      {children}
      {isHydrated ? (
        <>
          <CookieConsentBanner />
          <CookieConsentPanel />
        </>
      ) : null}
    </CookieConsentContextProvider>
  );
}
