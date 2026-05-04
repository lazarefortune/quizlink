import type { CookieConsentStored } from "./cookie-consent-stored.schema";
import { cookieConsentStoredSchema } from "./cookie-consent-stored.schema";
import type { CookieConsentValue } from "./types";

export const COOKIE_CONSENT_STORAGE_KEY = "quizsnap-cookie-consent-v1";

export function parseStoredConsentJson(raw: string): CookieConsentStored | null {
  try {
    const data: unknown = JSON.parse(raw);
    const parsed = cookieConsentStoredSchema.safeParse(data);
    if (!parsed.success) {
      return null;
    }
    return parsed.data;
  } catch {
    return null;
  }
}

export function storedToConsent(stored: CookieConsentStored): CookieConsentValue {
  return {
    hasRecordedChoice: true,
    analytics: stored.analytics,
    sessionReplay: stored.analytics ? stored.sessionReplay : false,
  };
}

export function readConsentFromStorage(): CookieConsentValue | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
    if (raw === null) {
      return null;
    }
    const stored = parseStoredConsentJson(raw);
    if (stored === null) {
      return null;
    }
    return storedToConsent(stored);
  } catch {
    return null;
  }
}

export function writeConsentToStorage(consent: CookieConsentValue): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    const payload: CookieConsentStored = {
      version: 1,
      analytics: consent.analytics,
      sessionReplay: consent.analytics ? consent.sessionReplay : false,
    };
    window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // First-party storage unavailable (private mode, blocked)
  }
}

export function defaultPendingConsent(): CookieConsentValue {
  return {
    hasRecordedChoice: false,
    analytics: false,
    sessionReplay: false,
  };
}
