/**
 * Parse PostHog distinct_id from a Cookie header (server-side).
 */
export function parsePostHogDistinctIdFromCookieHeader(
  cookieHeader: string | null | undefined,
): string | undefined {
  if (!cookieHeader) {
    return undefined;
  }
  const postHogCookieMatch = cookieHeader.match(/ph_phc_.*?_posthog=([^;]+)/);
  if (!postHogCookieMatch?.[1]) {
    return undefined;
  }
  try {
    const decodedCookie = decodeURIComponent(postHogCookieMatch[1]);
    const postHogData = JSON.parse(decodedCookie) as { distinct_id?: unknown };
    if (typeof postHogData.distinct_id === "string" && postHogData.distinct_id.length > 0) {
      return postHogData.distinct_id;
    }
  } catch {
    return undefined;
  }
  return undefined;
}
