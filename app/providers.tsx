"use client";

import { PostHogProviderClient } from "@/components/analytics/posthog-provider";
import { PostHogPageView } from "@/components/analytics/posthog-pageview";
import { PostHogIdentify } from "@/components/analytics/posthog-identify";
import { CookieConsentProvider } from "@/components/cookie-consent/CookieConsentProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CookieConsentProvider>
      <PostHogProviderClient>
        <PostHogPageView />
        <PostHogIdentify />
        {children}
      </PostHogProviderClient>
    </CookieConsentProvider>
  );
}
