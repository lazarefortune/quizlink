"use client";

/**
 * Identify user in PostHog. Safe to call from client only.
 * No-op on server and when PostHog is not initialized.
 * Do not send password, tokens, or private attempt details.
 */

import posthog from "posthog-js";
import { getClientConsentAllowsAnalytics } from "@/lib/cookie-consent/consent-gate";

export type IdentifyTraits = {
  email?: string;
  name?: string;
  role?: "USER" | "ADMIN";
  preferredLanguage?: "fr" | "en";
  coinsBalance?: number;
  createdAt?: string;
  signupSource?: string;
};

export function identify(userId: string, traits?: IdentifyTraits): void {
  if (typeof window === "undefined") return;
  if (!getClientConsentAllowsAnalytics()) return;
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
