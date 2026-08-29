import { PostHog } from "posthog-node";
import { getServiceVersion } from "@/lib/observability/release";

const POSTHOG_EU_HOST = "https://eu.i.posthog.com";

let posthogServerClient: PostHog | null = null;

function getProjectToken(): string | undefined {
  return (
    process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim() ||
    process.env.NEXT_PUBLIC_POSTHOG_TOKEN?.trim() ||
    process.env.POSTHOG_PROJECT_TOKEN?.trim() ||
    undefined
  );
}

/**
 * Singleton PostHog Node client for server-side capture / exceptions.
 * Uses the project token (phc_…), never the Personal API Key (phx_…).
 */
export function getPostHogServer(): PostHog | null {
  const token = getProjectToken();
  if (!token) {
    return null;
  }

  if (!posthogServerClient) {
    posthogServerClient = new PostHog(token, {
      host: process.env.POSTHOG_HOST?.trim() || POSTHOG_EU_HOST,
      flushAt: 1,
      flushInterval: 0,
    });
  }

  return posthogServerClient;
}

export async function shutdownPostHogServer(): Promise<void> {
  if (!posthogServerClient) {
    return;
  }
  try {
    await posthogServerClient.shutdown();
  } catch {
    /* ignore flush errors */
  }
}

export function getPostHogServerReleaseProperties(): Record<string, string> {
  return {
    $lib: "posthog-node",
    service_version: getServiceVersion(),
  };
}
