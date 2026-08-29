"use client";

import { PostHogProviderClient } from "@/components/analytics/posthog-provider";
import { PostHogIdentify } from "@/components/analytics/posthog-identify";
import { CookieConsentProvider } from "@/components/cookie-consent/CookieConsentProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CookieConsentProvider>
      <PostHogProviderClient>
        <PostHogIdentify />
        {children}
      </PostHogProviderClient>
    </CookieConsentProvider>
  );
}
