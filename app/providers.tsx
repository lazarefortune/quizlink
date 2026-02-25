"use client";

import { PostHogProviderClient } from "@/components/analytics/posthog-provider";
import { PostHogPageView } from "@/components/analytics/posthog-pageview";
import { PostHogIdentify } from "@/components/analytics/posthog-identify";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PostHogProviderClient>
      <PostHogPageView />
      <PostHogIdentify />
      {children}
    </PostHogProviderClient>
  );
}
