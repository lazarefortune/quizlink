"use client";

/**
 * Build common event properties for PostHog. Safe client-side only; no-op on server.
 * Merge with event-specific props when calling track().
 */

export type CommonEventProps = {
  path?: string;
  page?: string;
  is_logged_in?: boolean;
  preferred_language?: "fr" | "en";
  app_version?: string;
  referrer?: string;
};

export function buildCommonEventProps(ctx?: {
  path?: string;
  page?: string;
  isLoggedIn?: boolean;
  preferredLanguage?: string;
  referrer?: string;
}): CommonEventProps {
  if (typeof window === "undefined") return {};

  const path =
    ctx?.path ?? (typeof window !== "undefined" ? window.location.pathname : undefined);
  const referrer = ctx?.referrer ?? (typeof document !== "undefined" ? document.referrer || undefined : undefined);

  const out: CommonEventProps = {
    path: path || undefined,
    page: ctx?.page,
    is_logged_in: ctx?.isLoggedIn,
    preferred_language:
      ctx?.preferredLanguage === "fr" || ctx?.preferredLanguage === "en"
        ? ctx.preferredLanguage
        : undefined,
    referrer: referrer && referrer !== "" ? referrer : undefined,
  };

  return out;
}
