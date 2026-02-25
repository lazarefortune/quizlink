"use client";

/**
 * Identify user in PostHog. Safe to call from client only.
 * No-op on server and when PostHog is not initialized.
 */

import posthog from "posthog-js";

export type IdentifyTraits = {
  email?: string;
  name?: string;
  role?: string;
  preferredLanguage?: string;
};

export function identify(userId: string, traits?: IdentifyTraits): void {
  if (typeof window === "undefined") return;
  try {
    posthog.identify(userId, traits);
  } catch {
    // No-op when PostHog not initialized
  }
}

export function resetIdentify(): void {
  if (typeof window === "undefined") return;
  try {
    posthog.reset();
  } catch {
    // No-op when PostHog not initialized
  }
}
