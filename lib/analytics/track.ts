"use client";

/**
 * Track a PostHog event. Safe to call from client components only.
 * No-op on server and when PostHog is not initialized.
 */

import posthog from "posthog-js";

export function track(
  eventName: string,
  properties?: Record<string, unknown>
): void {
  if (typeof window === "undefined") return;
  try {
    posthog.capture(eventName, properties);
  } catch {
    // No-op when PostHog not initialized or unavailable
  }
}
