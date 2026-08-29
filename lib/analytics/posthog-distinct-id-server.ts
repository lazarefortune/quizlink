import { cookies } from "next/headers";

/**
 * Read the browser PostHog distinct_id from the ph_* cookie when available.
 * Lets server-side captures join the anonymous pre-signup journey after identify().
 */
export async function getPostHogDistinctIdFromCookies(): Promise<string | undefined> {
  try {
    const jar = await cookies();
    for (const cookie of jar.getAll()) {
      if (!/^ph_phc_.*_posthog$/.test(cookie.name)) {
        continue;
      }
      try {
        const decoded = decodeURIComponent(cookie.value);
        const data = JSON.parse(decoded) as { distinct_id?: unknown };
        if (typeof data.distinct_id === "string" && data.distinct_id.length > 0) {
          return data.distinct_id;
        }
      } catch {
        /* ignore malformed */
      }
    }
  } catch {
    /* cookies() unavailable outside request context */
  }
  return undefined;
}
