/**
 * Server-side PostHog event capture (posthog-node).
 * Prefer this for facts known only on the server (account created, email verified).
 *
 * Product Analytics respects the mirrored analytics consent cookie.
 * Technical observability (captureServerException / logs) is separate.
 */

import {
  getPostHogServer,
  getPostHogServerReleaseProperties,
} from "@/lib/observability/posthog-server";
import { getServerAllowsProductAnalytics } from "@/lib/cookie-consent/analytics-consent-server";

export async function trackServer(
  distinctId: string,
  eventName: string,
  properties?: Record<string, unknown>,
): Promise<void> {
  const client = getPostHogServer();
  if (!client || !distinctId) {
    return;
  }

  const allowsAnalytics = await getServerAllowsProductAnalytics();
  if (!allowsAnalytics) {
    return;
  }

  try {
    client.capture({
      distinctId,
      event: eventName,
      properties: {
        ...getPostHogServerReleaseProperties(),
        ...properties,
        $lib: "posthog-node",
      },
    });
    await client.flush();
  } catch {
    /* never break auth / product flows on analytics failure */
  }
}

export async function captureServerException(
  error: unknown,
  distinctId?: string | null,
  properties?: Record<string, unknown>,
): Promise<void> {
  const client = getPostHogServer();
  if (!client) {
    return;
  }

  try {
    const id = distinctId?.trim() || "server";
    client.captureException(error, id, {
      ...getPostHogServerReleaseProperties(),
      ...properties,
    });
    await client.flush();
  } catch {
    /* ignore */
  }
}
