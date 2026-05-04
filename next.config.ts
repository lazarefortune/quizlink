import type { NextConfig } from "next";
import { getPosthogProxyBasePath } from "./lib/analytics/posthog-proxy-path";

const posthogProxyBase = getPosthogProxyBasePath();

const nextConfig: NextConfig = {
  /**
   * Required for PostHog (and similar) reverse proxies: the API uses paths like `/e/`
   * with a trailing slash. Without this, Next.js responds with 308 redirects that break
   * event capture and session replay. See PostHog Next.js proxy docs.
   */
  skipTrailingSlashRedirect: true,
  serverExternalPackages: ["pdf-parse"],
  // Allow raw body for Stripe webhooks
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  async rewrites() {
    return [
      {
        source: `${posthogProxyBase}/static/:path*`,
        destination: "https://eu-assets.i.posthog.com/static/:path*",
      },
      {
        source: `${posthogProxyBase}/array/:path*`,
        destination: "https://eu-assets.i.posthog.com/array/:path*",
      },
      {
        source: `${posthogProxyBase}/:path*`,
        destination: "https://eu.i.posthog.com/:path*",
      },
    ];
  },
};

export default nextConfig;
