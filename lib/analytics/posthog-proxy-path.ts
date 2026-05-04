/**
 * First-party path segment proxied by Next.js to PostHog EU.
 * Avoid `/ingest` — EasyPrivacy / uBlock often block that pattern even same-origin.
 *
 * Override with `NEXT_PUBLIC_POSTHOG_PROXY_PATH` (must start with `/`, no `..`).
 */
export const POSTHOG_PROXY_DEFAULT = "/qk/ph";

function normalizeProxyPath(raw: string | undefined): string {
  const trimmed = raw?.trim();
  if (!trimmed || !trimmed.startsWith("/") || trimmed.includes("..")) {
    return POSTHOG_PROXY_DEFAULT;
  }
  const withoutTrailingSlash = trimmed.replace(/\/+$/, "");
  return withoutTrailingSlash.length > 0 ? withoutTrailingSlash : POSTHOG_PROXY_DEFAULT;
}

export function getPosthogProxyBasePath(): string {
  return normalizeProxyPath(process.env.NEXT_PUBLIC_POSTHOG_PROXY_PATH);
}
