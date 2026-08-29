/**
 * First-party cookie mirroring analytics consent for server-side Product Analytics.
 * Source of truth remains localStorage; this cookie is a server-readable mirror only.
 *
 * Values:
 * - "1" = user recorded choice and accepted analytics
 * - "0" = user recorded choice and refused analytics
 * - absent = no choice yet → treat as refused for Product Analytics
 */

export const ANALYTICS_CONSENT_COOKIE = "ql_analytics_consent";
export const ANALYTICS_CONSENT_MAX_AGE_SECONDS = 60 * 60 * 24 * 400; // ~13 months

export function buildAnalyticsConsentCookieAttributes(allowed: boolean): string {
  const secure =
    typeof window !== "undefined" && window.location.protocol === "https:"
      ? "; Secure"
      : "";
  return `${ANALYTICS_CONSENT_COOKIE}=${allowed ? "1" : "0"}; Path=/; Max-Age=${ANALYTICS_CONSENT_MAX_AGE_SECONDS}; SameSite=Lax${secure}`;
}

export function syncAnalyticsConsentCookie(allowed: boolean): void {
  if (typeof document === "undefined") {
    return;
  }
  document.cookie = buildAnalyticsConsentCookieAttributes(allowed);
}

export function clearAnalyticsConsentCookie(): void {
  if (typeof document === "undefined") {
    return;
  }
  const secure =
    typeof window !== "undefined" && window.location.protocol === "https:"
      ? "; Secure"
      : "";
  document.cookie = `${ANALYTICS_CONSENT_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
}

export function isAnalyticsConsentCookieAllowed(
  raw: string | undefined | null,
): boolean {
  return raw === "1";
}
