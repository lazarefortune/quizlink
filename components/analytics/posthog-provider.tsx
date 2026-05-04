"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import {
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useCookieConsent } from "@/components/cookie-consent/cookie-consent-context";
import { setClientAnalyticsConsent } from "@/lib/cookie-consent/consent-gate";
import { getPosthogProxyBasePath } from "@/lib/analytics/posthog-proxy-path";

const apiKey =
  process.env.NEXT_PUBLIC_POSTHOG_KEY ?? process.env.NEXT_PUBLIC_POSTHOG_TOKEN;

let hasInitializedPosthog = false;

type PostHogRecordingControls = {
  startSessionRecording?: (forced?: boolean) => void;
  stopSessionRecording?: () => void;
};

type PostHogClientConfig = NonNullable<Parameters<typeof posthog.init>[1]>;

const posthogApiHost = getPosthogProxyBasePath();

function buildInitOptions(sessionReplay: boolean): PostHogClientConfig {
  if (sessionReplay) {
    return {
      api_host: posthogApiHost,
      ui_host: "https://eu.posthog.com",
      capture_pageview: false,
      capture_pageleave: true,
      autocapture: false,
      person_profiles: "identified_only",
      disable_session_recording: false,
      session_recording: {
        maskAllInputs: true,
        maskInputOptions: {
          password: true,
          email: true,
        },
        recordCrossOriginIframes: false,
      },
    };
  }

  return {
    api_host: posthogApiHost,
    ui_host: "https://eu.posthog.com",
    capture_pageview: false,
    capture_pageleave: true,
    autocapture: false,
    person_profiles: "identified_only",
    disable_session_recording: true,
  };
}

function syncSessionRecording(enabled: boolean): void {
  const ph = posthog as unknown as PostHogRecordingControls;
  try {
    if (enabled) {
      ph.startSessionRecording?.();
    } else {
      ph.stopSessionRecording?.();
    }
  } catch {
    /* SDK unavailable */
  }
}

export function PostHogProviderClient({ children }: { children: ReactNode }) {
  const { isHydrated, consent } = useCookieConsent();
  const [, setIntegrationNonce] = useState(0);
  const lastFingerprintRef = useRef<string | null>(null);

  useLayoutEffect(() => {
    const scheduleSync = (): void => {
      queueMicrotask(() => {
        setIntegrationNonce((n) => n + 1);
      });
    };

    if (!apiKey) {
      setClientAnalyticsConsent(false);
      scheduleSync();
      return;
    }

    if (!isHydrated || !consent.hasRecordedChoice) {
      setClientAnalyticsConsent(false);
      scheduleSync();
      return;
    }

    if (!consent.analytics) {
      setClientAnalyticsConsent(false);
      try {
        if (hasInitializedPosthog) {
          posthog.opt_out_capturing();
          posthog.reset();
        }
      } catch {
        /* noop */
      }
      lastFingerprintRef.current = null;
      scheduleSync();
      return;
    }

    const fingerprint = `a:${consent.analytics}:r:${consent.sessionReplay}`;
    if (
      hasInitializedPosthog &&
      lastFingerprintRef.current === fingerprint
    ) {
      setClientAnalyticsConsent(true);
      scheduleSync();
      return;
    }

    try {
      setClientAnalyticsConsent(true);

      if (!hasInitializedPosthog) {
        posthog.init(apiKey, buildInitOptions(consent.sessionReplay));
        hasInitializedPosthog = true;
      } else {
        posthog.opt_in_capturing();
        syncSessionRecording(consent.sessionReplay);
      }

      lastFingerprintRef.current = fingerprint;
    } catch {
      setClientAnalyticsConsent(false);
    }

    scheduleSync();
  }, [
    isHydrated,
    consent.hasRecordedChoice,
    consent.analytics,
    consent.sessionReplay,
  ]);

  const showReactProvider =
    Boolean(apiKey) &&
    consent.hasRecordedChoice &&
    consent.analytics &&
    hasInitializedPosthog;

  if (showReactProvider) {
    return <PHProvider client={posthog}>{children}</PHProvider>;
  }

  return <>{children}</>;
}
