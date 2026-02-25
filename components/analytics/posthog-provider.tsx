"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";

const key =
  process.env.NEXT_PUBLIC_POSTHOG_KEY || process.env.NEXT_PUBLIC_POSTHOG_TOKEN;
const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;

let initialized = false;

function initPostHog(): void {
  if (typeof window === "undefined") return;
  if (!key || !host) return;
  if (initialized) return;
  posthog.init(key, {
    api_host: host,
    person_profiles: "identified_only",
    disable_session_recording: true,
    autocapture: false,
  });
  initialized = true;
}

export function PostHogProviderClient({ children }: { children: React.ReactNode }) {
  if (key && host) {
    initPostHog();
    return <PHProvider client={posthog}>{children}</PHProvider>;
  }
  return <>{children}</>;
}
