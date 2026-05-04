let clientAllowsAnalytics = false;

export function setClientAnalyticsConsent(allowed: boolean): void {
  clientAllowsAnalytics = allowed;
}

export function getClientConsentAllowsAnalytics(): boolean {
  return clientAllowsAnalytics;
}
