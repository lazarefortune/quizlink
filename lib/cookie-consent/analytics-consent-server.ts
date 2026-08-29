import { cookies } from "next/headers";
import {
  ANALYTICS_CONSENT_COOKIE,
  isAnalyticsConsentCookieAllowed,
} from "@/lib/cookie-consent/analytics-consent-cookie";

/**
 * Server gate for Product Analytics (posthog-node capture events).
 * Does NOT gate Error Tracking / structured logs (technical observability).
 */
export async function getServerAllowsProductAnalytics(): Promise<boolean> {
  try {
    const jar = await cookies();
    return isAnalyticsConsentCookieAllowed(jar.get(ANALYTICS_CONSENT_COOKIE)?.value);
  } catch {
    return false;
  }
}
